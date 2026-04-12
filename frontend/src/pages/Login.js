import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Heart, Mail, Lock, AlertCircle } from 'lucide-react';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/login', form);
      login(data.access_token, { username: data.username, user_id: data.user_id });
      navigate('/chat');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.left}>
        <div style={styles.brand}>
          <div style={styles.brandIcon}><Heart size={28} strokeWidth={2} /></div>
          <div style={styles.brandName}>Aria</div>
        </div>
        <div style={styles.tagline}>
          <h1 style={styles.headline}>A safe space<br /><em>for your mind.</em></h1>
          <p style={styles.sub}>AI-powered emotional support, mood tracking, and personalized wellness — always here when you need it.</p>
        </div>
        <div style={styles.testimonial}>
          <div style={styles.testimonialText}>"Aria helped me understand my emotions better than I ever had before."</div>
          <div style={styles.testimonialAuthor}>— Community Member</div>
        </div>
      </div>

      <div style={styles.right}>
        <div style={styles.formCard}>
          <h2 style={styles.title}>Welcome back</h2>
          <p style={styles.subtitle}>Sign in to continue your wellness journey</p>

          {error && (
            <div style={styles.error}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>Email</label>
              <div style={styles.inputWrap}>
                <Mail size={16} style={styles.inputIcon} />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  required
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Password</label>
              <div style={styles.inputWrap}>
                <Lock size={16} style={styles.inputIcon} />
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  style={styles.input}
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p style={styles.switchText}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--sage)', fontWeight: 500 }}>Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { display: 'flex', minHeight: '100vh' },
  left: {
    flex: 1,
    background: 'linear-gradient(160deg, var(--sage-dark) 0%, var(--sage) 60%, var(--sage-light) 100%)',
    padding: '48px 56px',
    display: 'flex',
    flexDirection: 'column',
    color: 'white',
  },
  brand: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 'auto' },
  brandIcon: { width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  brandName: { fontFamily: 'var(--font-display)', fontSize: 26, color: 'white' },
  tagline: { margin: 'auto 0' },
  headline: { fontFamily: 'var(--font-display)', fontSize: 52, lineHeight: 1.15, marginBottom: 20, fontWeight: 400 },
  sub: { fontSize: 17, opacity: 0.85, lineHeight: 1.7, maxWidth: 380 },
  testimonial: { marginTop: 'auto', paddingTop: 40, borderTop: '1px solid rgba(255,255,255,0.25)' },
  testimonialText: { fontSize: 15, opacity: 0.9, fontStyle: 'italic', marginBottom: 8, lineHeight: 1.6 },
  testimonialAuthor: { fontSize: 13, opacity: 0.7 },
  right: { width: 460, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 32px', background: 'var(--surface)' },
  formCard: { width: '100%', maxWidth: 380 },
  title: { fontFamily: 'var(--font-display)', fontSize: 30, color: 'var(--charcoal)', marginBottom: 6 },
  subtitle: { fontSize: 15, color: 'var(--charcoal-soft)', marginBottom: 28 },
  error: { display: 'flex', alignItems: 'center', gap: 8, background: 'var(--blush-pale)', color: 'var(--blush)', border: '1px solid var(--blush-light)', borderRadius: 10, padding: '10px 14px', fontSize: 14, marginBottom: 18 },
  form: { display: 'flex', flexDirection: 'column', gap: 18 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 500, color: 'var(--charcoal-mid)' },
  inputWrap: { position: 'relative' },
  inputIcon: { position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--charcoal-soft)' },
  input: { width: '100%', padding: '11px 14px 11px 40px', border: '1px solid var(--border)', borderRadius: 10, fontSize: 15, color: 'var(--charcoal)', background: 'var(--white)', transition: 'border-color var(--transition)' },
  switchText: { textAlign: 'center', fontSize: 14, color: 'var(--charcoal-soft)', marginTop: 24 },
};
