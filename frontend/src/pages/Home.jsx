import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { useToast } from '../hooks/useToast.js';
import { ToastContainer } from '../components/ToastContainer.jsx';
import { ProgramCard } from '../components/ProgramCard.jsx';
import { Package, Search, RefreshCw, PlusCircle } from 'lucide-react';

export default function Home() {
  const { user, loading } = useAuth();
  const navigate          = useNavigate();
  const toast             = useToast();

  const [programs, setPrograms] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [query, setQuery]       = useState('');

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [user, loading, navigate]);

  const fetchPrograms = useCallback(async () => {
    setFetching(true);
    try {
      const res = await fetch('/api/programs');
      const data = await res.json();
      setPrograms(data);
    } catch {
      toast.error('Impossibile caricare i programmi');
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => { fetchPrograms(); }, [fetchPrograms]);

  const handleDelete = async (id) => {
    if (!confirm('Eliminare questo programma?')) return;
    try {
      const res = await fetch(`/api/programs/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('jwt')}` },
      });
      if (!res.ok) throw new Error();
      setPrograms(prev => prev.filter(p => p.id !== id));
      toast.success('Programma eliminato');
    } catch {
      toast.error('Errore durante l\'eliminazione');
    }
  };

  const filtered = programs.filter(p =>
    !query || p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.description?.toLowerCase().includes(query.toLowerCase()) ||
    p.tags?.toLowerCase().includes(query.toLowerCase())
  );

  if (loading) {
    return (
      <div style={styles.loading}>
        <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
      </div>
    );
  }

  return (
    <>
      <div className="page-wide">
        {/* Header */}
        <div style={styles.pageHeader} className="fade-up">
          <div>
            <h1 style={styles.title}>
              <span style={{ color: 'var(--accent)' }}>{'// '}</span>
              Programmi
            </h1>
            <p style={styles.subtitle}>
              {programs.length} programm{programs.length === 1 ? 'o' : 'i'} disponibil{programs.length === 1 ? 'e' : 'i'}
            </p>
          </div>

          <div style={styles.headerActions}>
            <button className="btn btn-ghost btn-sm" onClick={fetchPrograms} disabled={fetching}>
              <RefreshCw size={14} style={fetching ? { animation: 'spin 0.7s linear infinite' } : {}} />
              Aggiorna
            </button>
            {user?.is_admin && (
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/admin')}>
                <PlusCircle size={14} />
                Aggiungi
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div style={styles.searchWrap} className="fade-up">
          <Search size={16} color="var(--text-muted)" style={styles.searchIcon} />
          <input
            className="input"
            style={{ paddingLeft: 40 }}
            placeholder="Cerca per nome, descrizione, tag…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>

        {/* Content */}
        {fetching ? (
          <div style={styles.center}>
            <div className="spinner" style={{ width: 28, height: 28 }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={styles.empty}>
            <Package size={48} color="var(--text-muted)" />
            <p style={{ color: 'var(--text-secondary)', marginTop: 12, fontFamily: 'var(--font-mono)' }}>
              {query ? 'Nessun risultato trovato' : 'Nessun programma ancora'}
            </p>
            {!query && user?.is_admin && (
              <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/admin')}>
                <PlusCircle size={16} /> Carica il primo programma
              </button>
            )}
          </div>
        ) : (
          <div style={styles.grid}>
            {filtered.map(p => (
              <ProgramCard
                key={p.id}
                program={p}
                onDelete={handleDelete}
                onDownload={fetchPrograms}
              />
            ))}
          </div>
        )}
      </div>
      <ToastContainer toasts={toast.toasts} />
    </>
  );
}

const styles = {
  loading: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
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
    color: 'var(--text-primary)',
  },
  subtitle: {
    color: 'var(--text-muted)',
    fontSize: 13,
    marginTop: 4,
    fontFamily: 'var(--font-mono)',
  },
  headerActions: {
    display: 'flex',
    gap: 10,
    alignItems: 'center',
  },
  searchWrap: {
    position: 'relative',
    marginBottom: 28,
    maxWidth: 480,
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: 16,
  },
  center: {
    display: 'flex',
    justifyContent: 'center',
    padding: '60px 0',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '80px 0',
  },
};
