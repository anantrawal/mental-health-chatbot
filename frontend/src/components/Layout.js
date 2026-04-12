import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MessageCircle, BarChart2, LogOut, Heart, User } from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={styles.root}>
      <aside style={styles.sidebar}>
        {/* Logo */}
        <div style={styles.logo}>
          <div style={styles.logoIcon}><Heart size={18} strokeWidth={2.5} /></div>
          <div>
            <div style={styles.logoText}>Aria</div>
            <div style={styles.logoSub}>Mental Wellness</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={styles.nav}>
          <NavItem to="/chat" icon={<MessageCircle size={18} />} label="Chat" />
          <NavItem to="/dashboard" icon={<BarChart2 size={18} />} label="Insights" />
        </nav>

        {/* User */}
        <div style={styles.userSection}>
          <div style={styles.avatar}>
            {user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div style={styles.userInfo}>
            <div style={styles.userName}>{user?.username}</div>
            <div style={styles.userEmail}>Member</div>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn} title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <main style={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}

function NavItem({ to, icon, label }) {
  return (
    <NavLink to={to} style={({ isActive }) => ({
      ...styles.navItem,
      ...(isActive ? styles.navItemActive : {}),
    })}>
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}

const styles = {
  root: {
    display: 'flex',
    height: '100vh',
    overflow: 'hidden',
    background: 'var(--surface)',
  },
  sidebar: {
    width: 220,
    flexShrink: 0,
    background: 'var(--white)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 0',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '0 20px 28px',
    borderBottom: '1px solid var(--border)',
    marginBottom: 20,
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: 'var(--sage)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontFamily: 'var(--font-display)',
    fontSize: 18,
    color: 'var(--charcoal)',
    lineHeight: 1.2,
  },
  logoSub: {
    fontSize: 11,
    color: 'var(--charcoal-soft)',
    letterSpacing: '0.04em',
  },
  nav: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    padding: '0 12px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--charcoal-soft)',
    transition: 'all var(--transition)',
  },
  navItemActive: {
    background: 'var(--sage-pale)',
    color: 'var(--sage-dark)',
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '16px 16px 0',
    borderTop: '1px solid var(--border)',
    marginTop: 'auto',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: '50%',
    background: 'var(--sage)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    fontWeight: 600,
    flexShrink: 0,
  },
  userInfo: { flex: 1, minWidth: 0 },
  userName: { fontSize: 13, fontWeight: 500, color: 'var(--charcoal)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  userEmail: { fontSize: 11, color: 'var(--charcoal-soft)' },
  logoutBtn: {
    color: 'var(--charcoal-soft)',
    padding: 6,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    transition: 'color var(--transition)',
  },
};
