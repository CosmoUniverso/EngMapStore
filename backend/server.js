const express = require('express');
const cors = require('cors');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_in_production';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const ADMIN_GITHUB_USERNAME = 'CosmoUniverso';

// ─── Database Setup ────────────────────────────────────────────────────────────
const db = new Database(path.join(__dirname, 'jarstore.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    github_id     TEXT    UNIQUE,
    github_username TEXT  NOT NULL,
    email         TEXT,
    avatar_url    TEXT,
    is_admin      INTEGER DEFAULT 0,
    created_at    TEXT    DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS programs (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    name           TEXT    NOT NULL,
    description    TEXT    DEFAULT '',
    version        TEXT    DEFAULT '1.0.0',
    filename       TEXT    NOT NULL,
    original_name  TEXT    NOT NULL,
    file_size      INTEGER DEFAULT 0,
    uploader_id    INTEGER,
    download_count INTEGER DEFAULT 0,
    tags           TEXT    DEFAULT '',
    created_at     TEXT    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploader_id) REFERENCES users(id)
  );
`);

// ─── Uploads Directory ─────────────────────────────────────────────────────────
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ─── Multer Config ─────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}.jar`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (
      file.originalname.toLowerCase().endsWith('.jar') ||
      file.mimetype === 'application/java-archive' ||
      file.mimetype === 'application/x-java-archive' ||
      file.mimetype === 'application/octet-stream'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Sono accettati solo file .jar'));
    }
  },
  limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB
});

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());

// ─── Auth Middleware ───────────────────────────────────────────────────────────
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token mancante' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(403).json({ error: 'Token non valido o scaduto' });
  }
};

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token) {
    try { req.user = jwt.verify(token, JWT_SECRET); } catch {}
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.user?.is_admin) return res.status(403).json({ error: 'Solo gli admin possono fare questa operazione' });
  next();
};

// ─── GitHub OAuth ──────────────────────────────────────────────────────────────
app.get('/auth/github', (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: process.env.GITHUB_CALLBACK_URL || `http://localhost:${PORT}/auth/github/callback`,
    scope: 'read:user user:email',
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
});

app.get('/auth/github/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.redirect(`${FRONTEND_URL}/login?error=no_code`);

  try {
    // 1. Scambia il code con un access token
    const tokenRes = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      },
      { headers: { Accept: 'application/json' } }
    );

    const accessToken = tokenRes.data.access_token;
    if (!accessToken) throw new Error('Access token non ricevuto');

    // 2. Ottieni le info dell'utente da GitHub
    const [userRes, emailsRes] = await Promise.all([
      axios.get('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
      axios.get('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${accessToken}` },
      }).catch(() => ({ data: [] })),
    ]);

    const githubUser = userRes.data;
    const primaryEmail = emailsRes.data.find?.(e => e.primary)?.email || githubUser.email || null;
    const isAdmin = githubUser.login === ADMIN_GITHUB_USERNAME ? 1 : 0;

    // 3. Upsert utente nel database
    db.prepare(`
      INSERT INTO users (github_id, github_username, email, avatar_url, is_admin)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(github_id) DO UPDATE SET
        github_username = excluded.github_username,
        email           = excluded.email,
        avatar_url      = excluded.avatar_url,
        is_admin        = excluded.is_admin
    `).run(
      String(githubUser.id),
      githubUser.login,
      primaryEmail,
      githubUser.avatar_url,
      isAdmin
    );

    const user = db.prepare('SELECT * FROM users WHERE github_id = ?').get(String(githubUser.id));

    // 4. Crea JWT
    const token = jwt.sign(
      {
        id: user.id,
        github_username: user.github_username,
        email: user.email,
        avatar_url: user.avatar_url,
        is_admin: Boolean(user.is_admin),
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`);
  } catch (err) {
    console.error('[Auth Error]', err.message);
    res.redirect(`${FRONTEND_URL}/login?error=auth_failed`);
  }
});

// ─── User Routes ───────────────────────────────────────────────────────────────
app.get('/api/me', authenticateToken, (req, res) => {
  res.json(req.user);
});

// ─── Programs Routes ───────────────────────────────────────────────────────────

// GET tutti i programmi (pubblico)
app.get('/api/programs', optionalAuth, (req, res) => {
  const programs = db.prepare(`
    SELECT
      p.id, p.name, p.description, p.version,
      p.original_name, p.file_size, p.download_count,
      p.tags, p.created_at,
      u.github_username AS uploader,
      u.avatar_url      AS uploader_avatar
    FROM programs p
    LEFT JOIN users u ON p.uploader_id = u.id
    ORDER BY p.created_at DESC
  `).all();

  res.json(programs);
});

// POST nuovo programma (solo admin)
app.post('/api/programs', authenticateToken, requireAdmin, upload.single('jar'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nessun file caricato' });

  const { name, description, version, tags } = req.body;

  const result = db.prepare(`
    INSERT INTO programs (name, description, version, filename, original_name, file_size, uploader_id, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    name?.trim() || req.file.originalname.replace('.jar', ''),
    description?.trim() || '',
    version?.trim() || '1.0.0',
    req.file.filename,
    req.file.originalname,
    req.file.size,
    req.user.id,
    tags?.trim() || ''
  );

  const program = db.prepare(`
    SELECT p.*, u.github_username AS uploader
    FROM programs p
    LEFT JOIN users u ON p.uploader_id = u.id
    WHERE p.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(program);
});

// PATCH aggiorna info programma (solo admin)
app.patch('/api/programs/:id', authenticateToken, requireAdmin, (req, res) => {
  const { name, description, version, tags } = req.body;
  const program = db.prepare('SELECT * FROM programs WHERE id = ?').get(req.params.id);
  if (!program) return res.status(404).json({ error: 'Programma non trovato' });

  db.prepare(`
    UPDATE programs
    SET name = ?, description = ?, version = ?, tags = ?
    WHERE id = ?
  `).run(
    name?.trim() || program.name,
    description?.trim() ?? program.description,
    version?.trim() || program.version,
    tags?.trim() ?? program.tags,
    req.params.id
  );

  res.json({ success: true });
});

// DELETE programma (solo admin)
app.delete('/api/programs/:id', authenticateToken, requireAdmin, (req, res) => {
  const program = db.prepare('SELECT * FROM programs WHERE id = ?').get(req.params.id);
  if (!program) return res.status(404).json({ error: 'Programma non trovato' });

  const filePath = path.join(uploadsDir, program.filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  db.prepare('DELETE FROM programs WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// GET download (pubblico)
app.get('/api/programs/:id/download', (req, res) => {
  const program = db.prepare('SELECT * FROM programs WHERE id = ?').get(req.params.id);
  if (!program) return res.status(404).json({ error: 'Programma non trovato' });

  const filePath = path.join(uploadsDir, program.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File non trovato sul server' });
  }

  db.prepare('UPDATE programs SET download_count = download_count + 1 WHERE id = ?').run(req.params.id);
  res.download(filePath, program.original_name);
});

// ─── Stats (solo admin) ────────────────────────────────────────────────────────
app.get('/api/admin/stats', authenticateToken, requireAdmin, (req, res) => {
  const totalPrograms = db.prepare('SELECT COUNT(*) as count FROM programs').get().count;
  const totalUsers    = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const totalDownloads= db.prepare('SELECT SUM(download_count) as total FROM programs').get().total || 0;
  const recentUploads = db.prepare(`
    SELECT p.name, p.created_at, p.download_count
    FROM programs p ORDER BY p.created_at DESC LIMIT 5
  `).all();

  res.json({ totalPrograms, totalUsers, totalDownloads, recentUploads });
});

// ─── Error Handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('[Server Error]', err.message);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File troppo grande (max 200MB)' });
  }
  res.status(500).json({ error: err.message || 'Errore interno del server' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 JarStore Backend avviato su http://localhost:${PORT}`);
  console.log(`   Admin: ${ADMIN_GITHUB_USERNAME}`);
  console.log(`   Frontend: ${FRONTEND_URL}\n`);
});
