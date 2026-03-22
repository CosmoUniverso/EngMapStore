const { getSupabase, verifyToken, setCors, ok, err, canUpload, maxProjects, isAdmin, checkStorageLimit } = require('../_utils');

const ACCOUNT_MIN_DAYS = 5;

async function antiSpamCheck(sb, dbUser) {
  // Whitelisted+ → solo controllo storage
  if (['whitelisted','admin','superadmin'].includes(dbUser.user_status)) return null;

  // Età account GitHub
  if (dbUser.github_created_at) {
    const ageMs = Date.now() - new Date(dbUser.github_created_at).getTime();
    if (ageMs < ACCOUNT_MIN_DAYS * 86400000) {
      const left = Math.ceil((ACCOUNT_MIN_DAYS * 86400000 - ageMs) / 86400000);
      return `Account GitHub troppo recente. Mancano ${left} giorni.`;
    }
  }

  // Almeno 1 repo
  if ((dbUser.github_public_repos || 0) < 1) {
    return 'Il tuo account GitHub deve avere almeno 1 repository pubblico.';
  }

  return null;
}

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return err(res, 'Method not allowed', 405);

  const user = verifyToken(req);
  if (!user) return err(res, 'Non autenticato', 401);

  const sb = getSupabase();

  // Ricarica utente dal DB (sempre aggiornato)
  const { data: dbUser } = await sb
    .from('users')
    .select('id,user_status,github_created_at,github_public_repos')
    .eq('id', user.id)
    .single();

  if (!dbUser)                        return err(res, 'Utente non trovato', 404);
  if (dbUser.user_status === 'banned') return err(res, 'Account sospeso', 403);
  if (dbUser.user_status === 'pending') return err(res, 'Il tuo account è in attesa di approvazione da parte dell\'admin.', 403);
  if (!canUpload(dbUser.user_status)) return err(res, 'Non hai i permessi per caricare programmi', 403);

  // Controllo storage
  const storageFull = await checkStorageLimit(sb);
  if (storageFull) return err(res, 'Storage quasi pieno. Contatta l\'admin.', 507);

  // Anti-spam
  const spamErr = await antiSpamCheck(sb, dbUser);
  if (spamErr) return err(res, spamErr, 429);

  // Controlla limite progetti APPROVATI per utente
  const max = maxProjects(dbUser.user_status);
  const { count: approvedCount } = await sb
    .from('programs')
    .select('*', { count: 'exact', head: true })
    .eq('uploader_id', user.id)
    .eq('status', 'approved');

  if (approvedCount >= max) {
    return err(res, `Hai raggiunto il limite di ${max} progetti approvati per il tuo livello account.`, 429);
  }

  // Blocca se ha già 1 progetto IN PENDING (deve aspettare revisione)
  const { count: pendingCount } = await sb
    .from('programs')
    .select('*', { count: 'exact', head: true })
    .eq('uploader_id', user.id)
    .eq('status', 'pending');

  if (pendingCount >= 1 && !isAdmin(dbUser.user_status)) {
    return err(res, 'Hai già un progetto in attesa di revisione. Aspetta che venga approvato prima di inviarne un altro.', 429);
  }

  const { name, description, version, tags, contributors, filePath, originalName, fileSize } = req.body || {};
  if (!name?.trim())  return err(res, 'Nome obbligatorio');
  if (!filePath)      return err(res, 'File obbligatorio');
  if (!originalName)  return err(res, 'Nome file obbligatorio');

  const { data: prog, error } = await sb
    .from('programs')
    .insert({
      name:          name.trim(),
      description:   description?.trim()   || '',
      version:       version?.trim()       || '1.0.0',
      tags:          tags?.trim()          || '',
      contributors:  contributors?.trim()  || '',
      file_path:     filePath,
      original_name: originalName,
      file_size:     fileSize || 0,
      uploader_id:   user.id,
      status:        'pending',
    })
    .select()
    .single();

  if (error) return err(res, error.message, 500);

  await sb.from('submission_log').insert({ user_id: user.id });
  ok(res, prog, 201);
};
