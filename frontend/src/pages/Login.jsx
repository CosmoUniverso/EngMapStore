import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { Package, Github, AlertCircle } from 'lucide-react';

export default function Login() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const error = params.get('error');

  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  const handleGitHubLogin = () => {
    window.location.href = '/auth/github';
  };

  return (
    <div style={styles.container}>
      {/* Glow blob */}
      <div style={styles.blob1} />
      <div style={styles.blob2} />

      <div style={styles.card} className="fade-up">
        {/* Logo */}
        <div style={styles.logoWrap}>
          <div style={styles.logoIcon}>
            <Package size={28} color="var(--accent)" />
          </div>
          <h1 style={styles.logoTitle}>JarStore</h1>
          <p style={styles.logoSub}>Software Repository</p>
        </div>

        <div className="glow-line" style={{ margin: '28px 0' }} />

        <h2 style={styles.heading}>Accedi al repository</h2>
        <p style={styles.subheading}>
          Scarica e prova i programmi Java. Accedi con GitHub per continuare.
        </p>

        {error && (
          <div style={styles.errorBox}>
            <AlertCircle size={16} />
            {error === 'auth_failed'
              ? 'Autenticazione fallita. Riprova.'
              : 'Si è verificato un errore.'}
          </div>
        )}

        <button onClick={handleGitHubLogin} style={styles.githubBtn}>
          <GithubIcon />
          Continua con GitHub
        </button>

        <p style={styles.note}>
          Usando JarStore accetti i termini del servizio.
          <br />
          L'account <code>CosmoUniverso</code> ha accesso admin.
        </p>
      </div>
    </div>
  );
}

function GithubIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  blob1: {
    position: 'absolute',
    width: 500,
    height: 500,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(0,210,255,0.08) 0%, transparent 70%)',
    top: '-20%',
    left: '10%',
    pointerEvents: 'none',
  },
  blob2: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%)',
    bottom: '-10%',
    right: '5%',
    pointerEvents: 'none',
  },
  card: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '40px 44px',
    width: '100%',
    maxWidth: 420,
    position: 'relative',
    boxShadow: '0 32px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
  },
  logoWrap: {
    textAlign: 'center',
  },
  logoIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 14px',
    boxShadow: '0 0 24px rgba(0,210,255,0.15)',
  },
  logoTitle: {
    fontFamily: 'var(--font-mono)',
    fontSize: 26,
    fontWeight: 700,
    letterSpacing: '-0.04em',
    color: 'var(--text-primary)',
  },
  logoSub: {
    fontSize: 13,
    color: 'var(--text-muted)',
    marginTop: 4,
  },
  heading: {
    fontFamily: 'var(--font-mono)',
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 8,
    color: 'var(--text-primary)',
  },
  subheading: {
    fontSize: 14,
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
    marginBottom: 24,
  },
  githubBtn: {
    width: '100%',
    padding: '13px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    fontSize: 15,
    fontWeight: 600,
    fontFamily: 'var(--font-sans)',
    cursor: 'pointer',
    transition: 'all var(--transition)',
    marginBottom: 20,
  },
  note: {
    fontSize: 12,
    color: 'var(--text-muted)',
    textAlign: 'center',
    lineHeight: 1.7,
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 14px',
    background: 'rgba(248,81,73,0.08)',
    border: '1px solid rgba(248,81,73,0.3)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--danger)',
    fontSize: 13,
    marginBottom: 16,
  },
};
