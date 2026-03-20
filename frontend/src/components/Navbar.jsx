import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { Package, Shield, LogOut, Home } from 'lucide-react';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav style={styles.nav}>
      <div style={styles.inner}>
        {/* Logo */}
        <Link to="/" style={styles.logo}>
          <Package size={20} color="var(--accent)" />
          <span style={styles.logoText}>JarStore</span>
        </Link>

        {/* Links */}
        <div style={styles.links}>
          {user && (
            <Link
              to="/"
              style={{ ...styles.link, ...(isActive('/') ? styles.linkActive : {}) }}
            >
              <Home size={15} />
              Programmi
            </Link>
          )}
          {user?.is_admin && (
            <Link
              to="/admin"
              style={{ ...styles.link, ...(isActive('/admin') ? styles.linkActive : {}) }}
            >
              <Shield size={15} />
              Admin
            </Link>
          )}
        </div>

        {/* User area */}
        {user ? (
          <div style={styles.userArea}>
            <img
              src={user.avatar_url}
              alt={user.github_username}
              style={styles.avatar}
            />
            <span style={styles.username}>
              {user.github_username}
              {user.is_admin && (
                <span className="badge badge-cyan" style={{ fontSize: 10, marginLeft: 6 }}>
                  admin
                </span>
              )}
            </span>
            <button onClick={handleLogout} className="btn btn-ghost btn-sm" title="Logout">
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          <Link to="/login" className="btn btn-primary btn-sm">
            Accedi
          </Link>
        )}
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    background: 'rgba(6, 10, 15, 0.85)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid var(--border)',
  },
  inner: {
    maxWidth: 1280,
    margin: '0 auto',
    padding: '0 24px',
    height: 58,
    display: 'flex',
    alignItems: 'center',
    gap: 24,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    textDecoration: 'none',
    marginRight: 8,
  },
  logoText: {
    fontFamily: 'var(--font-mono)',
    fontSize: 16,
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  links: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  link: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    borderRadius: 'var(--radius-sm)',
    fontSize: 14,
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    transition: 'all var(--transition)',
  },
  linkActive: {
    color: 'var(--accent)',
    background: 'var(--accent-dim)',
  },
  userArea: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginLeft: 'auto',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: '50%',
    border: '2px solid var(--border)',
  },
  username: {
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'center',
  },
};
