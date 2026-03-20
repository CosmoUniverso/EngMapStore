import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';

export default function AuthCallback() {
  const [params]  = useSearchParams();
  const { login } = useAuth();
  const navigate  = useNavigate();

  useEffect(() => {
    const token = params.get('token');
    if (token) {
      login(token);
      navigate('/', { replace: true });
    } else {
      navigate('/login?error=auth_failed', { replace: true });
    }
  }, []);

  return (
    <div style={styles.container}>
      <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
      <p style={styles.text}>Accesso in corso…</p>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  text: {
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-mono)',
    fontSize: 14,
  },
};
