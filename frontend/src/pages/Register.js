import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Heart, Mail, Lock, User, AlertCircle } from 'lucide-react';

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '', full_name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/register', form);
      login(data.access_token, { username: data.username, user_id: data.user_id });
      navigate('/chat');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div style={styles.page}>
      <div style={styles.left}>
        <div style={styles.brand}>
          <div style={styles.brandIcon}><Heart size={28} strokeWidth={2} /></div>
          <div style={styles.brandName}>Aria</div>
        </div>
        <div style={styles.tagline}>
          <h1 style={styles.headline}>Begin your<br /><em>wellness journey.</em></h1>
          <p style={styles.sub}>Your emotions matter. Aria is here to listen, support, and help you track what you feel — privately and securely.</p>
        </div>
        <div style={styles.features}>
          {['Emotion detection from every message', 'Mood trends & analytics dashboard', 'Crisis support & safety resources', 'Fully private & encrypted'].map(f => (
            <div key={f} style={styles.feature}>
              <div style={styles.featureDot} />
              <span>{f}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.right}>
        <div style={styles.formCard}>
          <h2 style={styles.title}>Create account</h2>
          <p style={styles.subtitle}>Free to start. No credit card required.</p>

          {error && (
            <div style={styles.error}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.row}>
              <Field label="Full Name" icon={<User size={16} />}>
                <input type="text" placeholder="Jane Doe" value={form.full_name} onChange={set('full_name')} style={styles.input} />
              </Field>
              <Field label="Username" icon={<User size={16} />}>
                <input type="text" placeholder="jdoe" value={form.username} onChange={set('username')} required style={styles.input} />
              </Field>
            </div>
            <Field label="Email" icon={<Mail size={16} />}>
              <input type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required style={styles.input} />
            </Field>
            <Field label="Password" icon={<Lock size={16} />}>
              <input type="password" placeholder="••••••••" value={form.password} onChange={set('password')} required style={styles.input} />
            </Field>

            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p style={styles.switchText}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--sage)', fontWeight: 500 }}>Sign in</Link>
          </p>

          <p style={styles.disclaimer}>
            By signing up, you acknowledge this is a supportive tool — not a replacement for professional mental healthcare.
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, icon, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--charcoal-mid)' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--charcoal-soft)' }}>{icon}</div>
        {children}
      </div>
    </div>
  );
}

const inputBase = { width: '100%', padding: '11px 14px 11px 40px', border: '1px solid var(--border)', borderRadius: 10, fontSize: 15, color: 'var(--charcoal)', background: 'var(--white)' };

const styles = {
  page: { display: 'flex', minHeight: '100vh' },
  left: { flex: 1, background: 'linear-gradient(160deg, #4A7265 0%, #7C9E8F 55%, #A8C5B8 100%)', padding: '48px 56px', display: 'flex', flexDirection: 'column', color: 'white' },
  brand: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 'auto' },
  brandIcon: { width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  brandName: { fontFamily: 'var(--font-display)', fontSize: 26, color: 'white' },
  tagline: { margin: 'auto 0' },
  headline: { fontFamily: 'var(--font-display)', fontSize: 48, lineHeight: 1.15, marginBottom: 20, fontWeight: 400 },
  sub: { fontSize: 16, opacity: 0.85, lineHeight: 1.7, maxWidth: 360, marginBottom: 40 },
  features: { display: 'flex', flexDirection: 'column', gap: 12, marginTop: 'auto' },
  feature: { display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, opacity: 0.9 },
  featureDot: { width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.7)', flexShrink: 0 },
  right: { width: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 32px', background: 'var(--surface)' },
  formCard: { width: '100%', maxWidth: 420 },
  title: { fontFamily: 'var(--font-display)', fontSize: 30, color: 'var(--charcoal)', marginBottom: 6 },
  subtitle: { fontSize: 15, color: 'var(--charcoal-soft)', marginBottom: 28 },
  error: { display: 'flex', alignItems: 'center', gap: 8, background: 'var(--blush-pale)', color: 'var(--blush)', border: '1px solid var(--blush-light)', borderRadius: 10, padding: '10px 14px', fontSize: 14, marginBottom: 18 },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  row: { display: 'flex', gap: 12 },
  input: inputBase,
  switchText: { textAlign: 'center', fontSize: 14, color: 'var(--charcoal-soft)', marginTop: 24 },
  disclaimer: { fontSize: 12, color: 'var(--charcoal-soft)', textAlign: 'center', marginTop: 16, lineHeight: 1.6, opacity: 0.8 },
};
