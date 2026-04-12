import { useState, useEffect } from 'react';
import api from '../utils/api';
import { EMOTIONS } from '../utils/emotions';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { TrendingUp, MessageCircle, Calendar, Smile } from 'lucide-react';

const PIE_COLORS = {
  happy: '#7C9E8F',
  sad: '#8E87B8',
  anxious: '#C4924A',
  angry: '#C9897A',
  neutral: '#9CA3AF',
};

const MANUAL_EMOTIONS = ['happy', 'sad', 'anxious', 'angry', 'neutral'];

export default function Dashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [profile, setProfile] = useState(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [logEmotion, setLogEmotion] = useState('');
  const [logNote, setLogNote] = useState('');
  const [logIntensity, setLogIntensity] = useState(5);
  const [logging, setLogging] = useState(false);
  const [logSuccess, setLogSuccess] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [analyticsRes, profileRes] = await Promise.all([
        api.get(`/api/mood/analytics?days=${days}`),
        api.get('/api/user/profile'),
      ]);
      setAnalytics(analyticsRes.data);
      setProfile(profileRes.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [days]);

  const handleLogMood = async (e) => {
    e.preventDefault();
    if (!logEmotion) return;
    setLogging(true);
    try {
      await api.post('/api/mood/log', {
        emotion: logEmotion,
        note: logNote,
        intensity: logIntensity,
      });
      setLogSuccess(true);
      setLogNote('');
      setLogEmotion('');
      setTimeout(() => setLogSuccess(false), 2500);
      load();
    } catch {}
    setLogging(false);
  };

  const trendData = analytics?.daily_trend?.map(d => ({
    date: format(parseISO(d.date), 'MMM d'),
    mood: parseFloat((((d.avg_valence || 0) + 1) * 50).toFixed(1)),
    emotion: d.dominant_emotion,
  })) || [];

  const pieData = analytics?.emotion_distribution?.map(e => ({
    name: EMOTIONS[e.emotion]?.label || e.emotion,
    value: e.count,
    emotion: e.emotion,
  })) || [];

  const topEmotion = analytics?.emotion_distribution?.[0];

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--sage)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 32, height: 32, border: '3px solid var(--sage)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        Loading insights...
      </div>
    </div>
  );

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Wellness Insights</h1>
          <p style={styles.subtitle}>Track your emotional patterns over time</p>
        </div>
        <div style={styles.periodSelector}>
          {[7, 14, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              style={{ ...styles.periodBtn, ...(days === d ? styles.periodBtnActive : {}) }}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div style={styles.statsRow}>
        <StatCard
          icon={<MessageCircle size={18} />}
          label="Total messages"
          value={profile?.total_messages ?? '—'}
          color="var(--sage)"
        />
        <StatCard
          icon={<Calendar size={18} />}
          label="Sessions"
          value={profile?.total_sessions ?? '—'}
          color="var(--lavender)"
        />
        <StatCard
          icon={<Smile size={18} />}
          label="Top emotion"
          value={topEmotion ? `${EMOTIONS[topEmotion.emotion]?.emoji} ${EMOTIONS[topEmotion.emotion]?.label}` : '—'}
          color="var(--amber-warm)"
        />
        <StatCard
          icon={<TrendingUp size={18} />}
          label="Entries this period"
          value={analytics?.emotion_distribution?.reduce((s, e) => s + e.count, 0) ?? 0}
          color="var(--blush)"
        />
      </div>

      <div style={styles.chartsRow}>
        {/* Mood trend */}
        <div className="card" style={{ ...styles.chartCard, flex: 2 }}>
          <h3 style={styles.chartTitle}>Mood trend</h3>
          <p style={styles.chartSub}>Daily average (0 = very low, 100 = very high)</p>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'var(--charcoal-soft)' }} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: 'var(--charcoal-soft)' }} tickLine={false} />
                <Tooltip
                  contentStyle={{ border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, boxShadow: 'var(--shadow-soft)' }}
                  formatter={(v) => [`${v}`, 'Mood score']}
                />
                <Line type="monotone" dataKey="mood" stroke="var(--sage)" strokeWidth={2.5} dot={{ fill: 'var(--sage)', r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState text="Start chatting to see your mood trend" />
          )}
        </div>

        {/* Emotion distribution */}
        <div className="card" style={{ ...styles.chartCard, flex: 1 }}>
          <h3 style={styles.chartTitle}>Emotion mix</h3>
          <p style={styles.chartSub}>Distribution for this period</p>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
                  {pieData.map((entry) => (
                    <Cell key={entry.emotion} fill={PIE_COLORS[entry.emotion] || '#9CA3AF'} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, name) => [v, name]} contentStyle={{ border: '1px solid var(--border)', borderRadius: 10, fontSize: 13 }} />
                <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 12, color: 'var(--charcoal-soft)' }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState text="No emotion data yet" />
          )}
        </div>
      </div>

      {/* Manual mood log */}
      <div className="card" style={styles.logCard}>
        <h3 style={styles.chartTitle}>Log a mood</h3>
        <p style={styles.chartSub}>Track how you're feeling right now</p>
        <form onSubmit={handleLogMood} style={styles.logForm}>
          <div style={styles.emotionPicker}>
            {MANUAL_EMOTIONS.map(em => {
              const e = EMOTIONS[em];
              return (
                <button
                  key={em}
                  type="button"
                  onClick={() => setLogEmotion(em)}
                  style={{
                    ...styles.emotionChoice,
                    background: logEmotion === em ? e.bg : 'var(--surface)',
                    border: `2px solid ${logEmotion === em ? e.color : 'var(--border)'}`,
                    color: logEmotion === em ? e.color : 'var(--charcoal-soft)',
                  }}
                >
                  <span style={{ fontSize: 22 }}>{e.emoji}</span>
                  <span style={{ fontSize: 12, fontWeight: 500 }}>{e.label}</span>
                </button>
              );
            })}
          </div>

          <div style={styles.intensityRow}>
            <label style={styles.intensityLabel}>Intensity: <strong>{logIntensity}/10</strong></label>
            <input
              type="range" min={1} max={10} value={logIntensity}
              onChange={e => setLogIntensity(Number(e.target.value))}
              style={{ flex: 1, accentColor: 'var(--sage)' }}
            />
          </div>

          <textarea
            value={logNote}
            onChange={e => setLogNote(e.target.value)}
            placeholder="Add a note (optional)..."
            style={styles.logTextarea}
            rows={2}
          />

          <button
            type="submit"
            className="btn-primary"
            disabled={!logEmotion || logging}
            style={{ alignSelf: 'flex-start' }}
          >
            {logSuccess ? '✓ Logged!' : logging ? 'Logging...' : 'Log mood'}
          </button>
        </form>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="card" style={styles.statCard}>
      <div style={{ ...styles.statIcon, color, background: color + '18' }}>{icon}</div>
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--charcoal-soft)', fontSize: 14 }}>
      {text}
    </div>
  );
}

const styles = {
  page: { padding: '32px', overflowY: 'auto', height: '100%', display: 'flex', flexDirection: 'column', gap: 24 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--charcoal)', marginBottom: 4 },
  subtitle: { fontSize: 14, color: 'var(--charcoal-soft)' },
  periodSelector: { display: 'flex', gap: 6, background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 10, padding: 4 },
  periodBtn: { padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, color: 'var(--charcoal-soft)', cursor: 'pointer', border: 'none', background: 'transparent', transition: 'all var(--transition)' },
  periodBtnActive: { background: 'var(--sage)', color: 'white' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 },
  statCard: { padding: '20px', display: 'flex', flexDirection: 'column', gap: 8 },
  statIcon: { width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 24, fontWeight: 600, color: 'var(--charcoal)', lineHeight: 1 },
  statLabel: { fontSize: 13, color: 'var(--charcoal-soft)' },
  chartsRow: { display: 'flex', gap: 16 },
  chartCard: { padding: '24px' },
  chartTitle: { fontSize: 16, fontWeight: 600, color: 'var(--charcoal)', marginBottom: 2 },
  chartSub: { fontSize: 13, color: 'var(--charcoal-soft)', marginBottom: 20 },
  logCard: { padding: 24 },
  logForm: { display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 },
  emotionPicker: { display: 'flex', gap: 10 },
  emotionChoice: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '12px 18px', borderRadius: 12, cursor: 'pointer', transition: 'all var(--transition)', fontFamily: 'var(--font-body)' },
  intensityRow: { display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: 'var(--charcoal-mid)' },
  intensityLabel: { minWidth: 120 },
  logTextarea: { padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, fontSize: 14, color: 'var(--charcoal)', resize: 'none', fontFamily: 'var(--font-body)', outline: 'none' },
};
