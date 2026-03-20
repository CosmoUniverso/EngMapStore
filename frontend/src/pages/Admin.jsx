import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../hooks/useAuth.jsx';
import { useToast } from '../hooks/useToast.js';
import { ToastContainer } from '../components/ToastContainer.jsx';
import {
  Upload, Package, CheckCircle, XCircle,
  BarChart2, Users, Download, Clock,
  CloudUpload, FileCode, Trash2, ChevronRight,
} from 'lucide-react';

export default function Admin() {
  const { user, loading } = useAuth();
  const navigate          = useNavigate();
  const toast             = useToast();

  const [stats,     setStats]     = useState(null);
  const [programs,  setPrograms]  = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress,  setProgress]  = useState(0);

  // Form state
  const [file,     setFile]     = useState(null);
  const [name,     setName]     = useState('');
  const [desc,     setDesc]     = useState('');
  const [version,  setVersion]  = useState('1.0.0');
  const [tags,     setTags]     = useState('');

  useEffect(() => {
    if (!loading && (!user || !user.is_admin)) navigate('/');
  }, [user, loading, navigate]);

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('jwt');
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [statsRes, programsRes] = await Promise.all([
        fetch('/api/admin/stats', { headers }),
        fetch('/api/programs',    { headers }),
      ]);
      setStats(await statsRes.json());
      setPrograms(await programsRes.json());
    } catch {
      toast.error('Errore caricamento dati');
    }
  }, []);

  useEffect(() => { if (user?.is_admin) fetchData(); }, [user, fetchData]);

  // Drag & Drop
  const onDrop = useCallback((accepted) => {
    if (accepted[0]) {
      const f = accepted[0];
      setFile(f);
      if (!name) setName(f.name.replace('.jar', ''));
    }
  }, [name]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: { 'application/java-archive': ['.jar'], 'application/octet-stream': ['.jar'] },
    maxFiles: 1,
    maxSize: 200 * 1024 * 1024,
    onDropRejected: () => toast.error('File non valido. Solo .jar fino a 200MB.'),
  });

  const handleUpload = async () => {
    if (!file) return toast.error('Seleziona un file .jar');
    if (!name.trim()) return toast.error('Inserisci il nome del programma');

    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('jar', file);
    formData.append('name', name.trim());
    formData.append('description', desc.trim());
    formData.append('version', version.trim() || '1.0.0');
    formData.append('tags', tags.trim());

    try {
      // Use XHR for progress tracking
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        });
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText));
          else reject(new Error(JSON.parse(xhr.responseText)?.error || 'Upload fallito'));
        });
        xhr.addEventListener('error', () => reject(new Error('Errore di rete')));
        xhr.open('POST', '/api/programs');
        xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('jwt')}`);
        xhr.send(formData);
      });

      toast.success(`"${name}" caricato con successo!`);
      setFile(null); setName(''); setDesc(''); setVersion('1.0.0'); setTags('');
      fetchData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleDelete = async (id, pName) => {
    if (!confirm(`Eliminare "${pName}"?`)) return;
    try {
      const res = await fetch(`/api/programs/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('jwt')}` },
      });
      if (!res.ok) throw new Error();
      toast.success('Programma eliminato');
      fetchData();
    } catch {
      toast.error('Errore durante l\'eliminazione');
    }
  };

  const dropBorderColor = isDragReject
    ? 'var(--danger)'
    : isDragActive
    ? 'var(--accent)'
    : file
    ? 'var(--success)'
    : 'var(--border)';

  if (loading) return null;

  return (
    <>
      <div className="page-wide">
        {/* Header */}
        <div style={styles.pageHeader} className="fade-up">
          <div>
            <h1 style={styles.title}>
              <span style={{ color: 'var(--accent)' }}>{'// '}</span>
              Admin Panel
            </h1>
            <p style={styles.subtitle}>Gestisci i programmi del repository</p>
          </div>
        </div>

        {/* Stats Row */}
        {stats && (
          <div style={styles.statsGrid} className="fade-up">
            <StatCard icon={<Package size={18} />} label="Programmi" value={stats.totalPrograms} color="var(--accent)" />
            <StatCard icon={<Users size={18} />} label="Utenti" value={stats.totalUsers} color="#a78bfa" />
            <StatCard icon={<Download size={18} />} label="Download totali" value={stats.totalDownloads} color="var(--success)" />
          </div>
        )}

        <div style={styles.twoCol}>
          {/* Upload Form */}
          <div className="card fade-up" style={styles.uploadCard}>
            <h2 style={styles.sectionTitle}>
              <CloudUpload size={18} /> Carica programma
            </h2>

            {/* Drop Zone */}
            <div
              {...getRootProps()}
              style={{
                ...styles.dropzone,
                borderColor: dropBorderColor,
                background: isDragActive
                  ? 'var(--accent-dim)'
                  : file
                  ? 'rgba(63, 185, 80, 0.06)'
                  : 'var(--bg-base)',
              }}
            >
              <input {...getInputProps()} />
              {file ? (
                <div style={styles.fileInfo}>
                  <FileCode size={32} color="var(--success)" />
                  <div>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--text-primary)' }}>
                      {file.name}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={e => { e.stopPropagation(); setFile(null); }}
                  >
                    <XCircle size={14} /> Rimuovi
                  </button>
                </div>
              ) : (
                <div style={styles.dropContent}>
                  <Upload size={36} color={isDragActive ? 'var(--accent)' : 'var(--text-muted)'} />
                  <p style={styles.dropMain}>
                    {isDragActive ? 'Rilascia il file qui' : 'Trascina il file .jar qui'}
                  </p>
                  <p style={styles.dropSub}>oppure clicca per sfogliare · max 200 MB</p>
                </div>
              )}
            </div>

            {/* Fields */}
            <div style={styles.formGrid}>
              <div style={styles.field}>
                <label style={styles.label}>Nome *</label>
                <input
                  className="input"
                  placeholder="Nome del programma"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Versione</label>
                <input
                  className="input"
                  placeholder="1.0.0"
                  value={version}
                  onChange={e => setVersion(e.target.value)}
                />
              </div>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Descrizione</label>
              <textarea
                className="textarea"
                placeholder="Breve descrizione del programma…"
                value={desc}
                onChange={e => setDesc(e.target.value)}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Tag <span style={{ color: 'var(--text-muted)' }}>(separati da virgola)</span></label>
              <input
                className="input"
                placeholder="es: gioco, utility, demo"
                value={tags}
                onChange={e => setTags(e.target.value)}
              />
            </div>

            {/* Progress bar */}
            {uploading && (
              <div style={styles.progressWrap}>
                <div style={{ ...styles.progressBar, width: `${progress}%` }} />
                <span style={styles.progressText}>{progress}%</span>
              </div>
            )}

            <button
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
              onClick={handleUpload}
              disabled={uploading || !file}
            >
              {uploading ? (
                <><span className="spinner" style={{ width: 16, height: 16 }} /> Caricamento…</>
              ) : (
                <><Upload size={16} /> Carica programma</>
              )}
            </button>
          </div>

          {/* Programs list */}
          <div className="fade-up" style={styles.listCol}>
            <h2 style={styles.sectionTitle}>
              <Package size={18} /> Programmi ({programs.length})
            </h2>
            <div style={styles.programList}>
              {programs.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: 13, padding: 20, textAlign: 'center' }}>
                  Nessun programma ancora
                </p>
              ) : (
                programs.map(p => (
                  <div key={p.id} className="card" style={styles.listItem}>
                    <div style={styles.listItemIcon}>☕</div>
                    <div style={styles.listItemMeta}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700 }}>{p.name}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>v{p.version} · {p.download_count} dl</span>
                    </div>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(p.id, p.name)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      <ToastContainer toasts={toast.toasts} />
    </>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="card" style={styles.statCard}>
      <div style={{ ...styles.statIcon, color, background: color + '18' }}>{icon}</div>
      <div>
        <p style={styles.statValue}>{value ?? '—'}</p>
        <p style={styles.statLabel}>{label}</p>
      </div>
    </div>
  );
}

const styles = {
  pageHeader: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 28,
    flexWrap: 'wrap',
    gap: 16,
  },
  title: {
    fontFamily: 'var(--font-mono)',
    fontSize: 28,
    fontWeight: 700,
  },
  subtitle: {
    color: 'var(--text-muted)',
    fontSize: 13,
    marginTop: 4,
    fontFamily: 'var(--font-mono)',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 16,
    marginBottom: 28,
  },
  statCard: {
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  statValue: {
    fontFamily: 'var(--font-mono)',
    fontSize: 22,
    fontWeight: 700,
  },
  statLabel: {
    fontSize: 12,
    color: 'var(--text-muted)',
  },
  twoCol: {
    display: 'grid',
    gridTemplateColumns: '1fr 360px',
    gap: 24,
    alignItems: 'start',
  },
  uploadCard: {
    padding: 28,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  sectionTitle: {
    fontFamily: 'var(--font-mono)',
    fontSize: 15,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: 'var(--text-primary)',
    marginBottom: 4,
  },
  dropzone: {
    border: '2px dashed',
    borderRadius: 'var(--radius-md)',
    padding: '28px 20px',
    cursor: 'pointer',
    transition: 'all var(--transition)',
    minHeight: 130,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    pointerEvents: 'none',
  },
  dropMain: {
    fontFamily: 'var(--font-mono)',
    fontSize: 14,
    color: 'var(--text-secondary)',
  },
  dropSub: {
    fontSize: 12,
    color: 'var(--text-muted)',
  },
  fileInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    width: '100%',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 140px',
    gap: 12,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--text-secondary)',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  progressWrap: {
    height: 6,
    background: 'var(--bg-elevated)',
    borderRadius: 3,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBar: {
    height: '100%',
    background: 'linear-gradient(90deg, var(--accent), var(--accent2))',
    borderRadius: 3,
    transition: 'width 0.2s ease',
  },
  progressText: {
    position: 'absolute',
    right: 0,
    top: -18,
    fontSize: 11,
    color: 'var(--text-muted)',
  },
  listCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  programList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  listItem: {
    padding: '12px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  listItemIcon: {
    fontSize: 18,
    width: 32,
    textAlign: 'center',
  },
  listItemMeta: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
};
