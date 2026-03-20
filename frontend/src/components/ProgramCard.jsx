import { useState } from 'react';
import { Download, Terminal, Trash2, HardDrive, Calendar, TrendingDown } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';

function formatSize(bytes) {
  if (!bytes) return '—';
  const mb = bytes / 1024 / 1024;
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
}

function formatDate(str) {
  return new Date(str).toLocaleDateString('it-IT', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export function ProgramCard({ program, onDelete, onDownload }) {
  const { user } = useAuth();
  const [showRunModal, setShowRunModal] = useState(false);
  const [downloading, setDownloading]   = useState(false);

  const tags = program.tags
    ? program.tags.split(',').map(t => t.trim()).filter(Boolean)
    : [];

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const a = document.createElement('a');
      a.href = `/api/programs/${program.id}/download`;
      a.download = program.original_name;
      a.click();
      onDownload?.();
    } finally {
      setTimeout(() => setDownloading(false), 1500);
    }
  };

  return (
    <>
      <div className="card fade-up" style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.iconWrap}>
            <span style={styles.icon}>☕</span>
          </div>
          <div style={styles.meta}>
            <h3 style={styles.name}>{program.name}</h3>
            <span style={styles.version}>v{program.version}</span>
          </div>
          {user?.is_admin && (
            <button
              className="btn btn-danger btn-sm"
              onClick={() => onDelete?.(program.id)}
              style={{ marginLeft: 'auto' }}
              title="Elimina"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>

        {/* Description */}
        {program.description && (
          <p style={styles.description}>{program.description}</p>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div style={styles.tags}>
            {tags.map((tag, i) => (
              <span key={i} className="badge badge-purple">{tag}</span>
            ))}
          </div>
        )}

        <div className="glow-line" style={{ margin: '14px 0' }} />

        {/* Footer */}
        <div style={styles.footer}>
          <div style={styles.stats}>
            <span style={styles.stat}>
              <HardDrive size={12} /> {formatSize(program.file_size)}
            </span>
            <span style={styles.stat}>
              <Download size={12} /> {program.download_count}
            </span>
            <span style={styles.stat}>
              <Calendar size={12} /> {formatDate(program.created_at)}
            </span>
          </div>
          <div style={styles.actions}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowRunModal(true)}
            >
              <Terminal size={14} />
              Come usare
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Download size={14} />}
              Download
            </button>
          </div>
        </div>
      </div>

      {/* Run modal */}
      {showRunModal && (
        <div style={styles.overlay} onClick={() => setShowRunModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'var(--font-mono)', marginBottom: 16 }}>
              Come eseguire {program.name}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>
              Scarica il file e poi eseguilo con Java dalla cartella dove si trova:
            </p>
            <code style={{ display: 'block', padding: '14px 16px', background: 'var(--bg-base)', borderRadius: 'var(--radius-sm)', fontSize: 13 }}>
              java -jar {program.original_name}
            </code>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 10 }}>
              Assicurati di avere Java installato:{' '}
              <a href="https://adoptium.net" target="_blank" rel="noreferrer">
                adoptium.net
              </a>
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowRunModal(false)}>
                Chiudi
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => { handleDownload(); setShowRunModal(false); }}>
                <Download size={14} /> Scarica ora
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const styles = {
  card: {
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 10,
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    fontSize: 20,
  },
  icon: {},
  meta: { flex: 1 },
  name: {
    fontFamily: 'var(--font-mono)',
    fontSize: 15,
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: 2,
  },
  version: {
    fontSize: 12,
    color: 'var(--accent)',
    fontFamily: 'var(--font-mono)',
  },
  description: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
    marginBottom: 10,
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  stats: {
    display: 'flex',
    gap: 12,
  },
  stat: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 12,
    color: 'var(--text-muted)',
  },
  actions: {
    display: 'flex',
    gap: 8,
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(4px)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modal: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: 28,
    maxWidth: 480,
    width: '100%',
    boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
  },
};
