import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../utils/api';
import { EMOTIONS } from '../utils/emotions';
import { Send, Plus, AlertTriangle, Phone } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const CRISIS_NUMBERS = [
  { name: 'iCall India', number: '9152987821' },
  { name: 'Vandrevala Foundation', number: '1860-2662-345' },
  { name: 'AASRA', number: '9820466627' },
];

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [showCrisis, setShowCrisis] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => {
    loadSessions();
    // Welcome message
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: "Hi, I'm **Aria** — your mental wellness companion 💚\n\nI'm here to listen without judgment. How are you feeling today?",
      emotion: null,
      created_at: new Date().toISOString(),
    }]);
  }, []);

  const loadSessions = async () => {
    try {
      const { data } = await api.get('/api/chat/sessions');
      setSessions(data.sessions || []);
    } catch {}
  };

  const loadSession = async (sid) => {
    try {
      const { data } = await api.get(`/api/chat/session/${sid}`);
      setSessionId(sid);
      const msgs = data.messages.flatMap(m => ([
        { id: m.id + '_u', role: 'user', content: m.user_message, emotion: null, created_at: m.created_at },
        { id: m.id + '_a', role: 'assistant', content: m.ai_response, emotion: { emotion: m.emotion, confidence: m.emotion_confidence }, risk_level: m.risk_level, created_at: m.created_at },
      ]));
      setMessages(msgs);
    } catch {}
  };

  const newChat = () => {
    setSessionId(null);
    setMessages([{
      id: 'welcome-new',
      role: 'assistant',
      content: "Starting a new session 🌱\n\nWhat's on your mind?",
      emotion: null,
      created_at: new Date().toISOString(),
    }]);
  };

  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setLoading(true);

    const userBubble = {
      id: Date.now() + '_u',
      role: 'user',
      content: userMsg,
      emotion: null,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userBubble]);

    try {
      const { data } = await api.post('/api/chat/message', {
        content: userMsg,
        session_id: sessionId,
      });

      setSessionId(data.session_id);
      if (data.risk?.is_crisis) setShowCrisis(true);

      const aiBubble = {
        id: data.message_id + '_a',
        role: 'assistant',
        content: data.ai_response,
        emotion: data.emotion,
        risk: data.risk,
        created_at: data.created_at,
      };
      setMessages(prev => [...prev, aiBubble]);
      loadSessions();
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now() + '_err',
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        emotion: null,
        created_at: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [input, loading, sessionId]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div style={styles.root}>
      {/* Sessions sidebar */}
      <aside style={styles.sessionsSidebar}>
        <button onClick={newChat} style={styles.newChatBtn}>
          <Plus size={16} /> New conversation
        </button>
        <div style={styles.sessionsList}>
          {sessions.map(s => (
            <button
              key={s.session_id}
              onClick={() => loadSession(s.session_id)}
              style={{ ...styles.sessionItem, ...(s.session_id === sessionId ? styles.sessionItemActive : {}) }}
            >
              <div style={styles.sessionPreview}>{s.last_message?.slice(0, 45) || 'Chat session'}...</div>
              <div style={styles.sessionMeta}>{s.message_count} messages</div>
            </button>
          ))}
          {sessions.length === 0 && (
            <div style={styles.noSessions}>Your conversations will appear here</div>
          )}
        </div>
      </aside>

      {/* Main chat */}
      <div style={styles.chatArea}>
        {/* Crisis banner */}
        {showCrisis && (
          <div style={styles.crisisBanner}>
            <AlertTriangle size={18} />
            <div>
              <strong>If you're in crisis, please reach out for help:</strong>
              <div style={styles.crisisNumbers}>
                {CRISIS_NUMBERS.map(c => (
                  <span key={c.name} style={styles.crisisNumber}>
                    <Phone size={12} /> {c.name}: <strong>{c.number}</strong>
                  </span>
                ))}
              </div>
            </div>
            <button onClick={() => setShowCrisis(false)} style={styles.closeCrisis}>✕</button>
          </div>
        )}

        {/* Messages */}
        <div style={styles.messages}>
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {loading && (
            <div style={styles.typingWrap}>
              <div style={styles.typingBubble}>
                <TypingDots />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={styles.inputArea}>
          <div style={styles.inputWrap}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Share what's on your mind... (Enter to send)"
              style={styles.textarea}
              rows={1}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              style={{ ...styles.sendBtn, ...(input.trim() && !loading ? styles.sendBtnActive : {}) }}
            >
              <Send size={18} />
            </button>
          </div>
          <div style={styles.inputHint}>
            Aria is an AI companion — not a therapist. In an emergency, call your local crisis line.
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  const emotionData = message.emotion ? EMOTIONS[message.emotion.emotion] : null;

  return (
    <div style={{ ...styles.msgRow, ...(isUser ? styles.msgRowUser : {}) }} className="animate-fade">
      {!isUser && <div style={styles.aiAvatar}>A</div>}
      <div style={{ maxWidth: '72%' }}>
        <div style={{ ...styles.bubble, ...(isUser ? styles.bubbleUser : styles.bubbleAI) }}>
          <ReactMarkdown components={{
            p: ({children}) => <p style={{ margin: 0, lineHeight: 1.65 }}>{children}</p>,
            strong: ({children}) => <strong style={{ fontWeight: 600 }}>{children}</strong>,
          }}>
            {message.content}
          </ReactMarkdown>
        </div>
        {emotionData && !isUser && (
          <div style={styles.emotionTag}>
            <span style={{ ...styles.emotionBadge, background: emotionData.bg, color: emotionData.color }}>
              {emotionData.emoji} {emotionData.label}
              {message.emotion.confidence && (
                <span style={{ opacity: 0.7, marginLeft: 4 }}>
                  {Math.round(message.emotion.confidence * 100)}%
                </span>
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '4px 0' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 8, height: 8, borderRadius: '50%',
          background: 'var(--sage)',
          animation: 'pulse 1.4s ease infinite',
          animationDelay: `${i * 0.2}s`,
        }} />
      ))}
    </div>
  );
}

const styles = {
  root: { display: 'flex', height: '100vh', overflow: 'hidden' },
  sessionsSidebar: {
    width: 220,
    borderRight: '1px solid var(--border)',
    background: 'var(--white)',
    display: 'flex',
    flexDirection: 'column',
    padding: 12,
    gap: 12,
    flexShrink: 0,
  },
  newChatBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 14px',
    border: '1px dashed var(--border-dark)',
    borderRadius: 10,
    fontSize: 14,
    color: 'var(--sage)',
    fontWeight: 500,
    cursor: 'pointer',
    background: 'var(--sage-mist)',
    transition: 'all var(--transition)',
  },
  sessionsList: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 },
  sessionItem: {
    width: '100%',
    textAlign: 'left',
    padding: '10px 12px',
    borderRadius: 10,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    transition: 'background var(--transition)',
  },
  sessionItemActive: { background: 'var(--sage-pale)' },
  sessionPreview: { fontSize: 13, color: 'var(--charcoal)', lineHeight: 1.4, marginBottom: 2 },
  sessionMeta: { fontSize: 11, color: 'var(--charcoal-soft)' },
  noSessions: { fontSize: 13, color: 'var(--charcoal-soft)', textAlign: 'center', padding: '24px 12px', lineHeight: 1.6 },
  chatArea: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  crisisBanner: {
    background: '#FEF2F2',
    borderBottom: '1px solid #FECACA',
    padding: '12px 20px',
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
    color: '#DC2626',
    fontSize: 14,
  },
  crisisNumbers: { display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 6 },
  crisisNumber: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 },
  closeCrisis: { marginLeft: 'auto', color: '#DC2626', cursor: 'pointer', background: 'none', border: 'none', fontSize: 16 },
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '24px 32px',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  msgRow: { display: 'flex', gap: 10, alignItems: 'flex-end' },
  msgRowUser: { flexDirection: 'row-reverse' },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: 'var(--sage)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    fontWeight: 600,
    flexShrink: 0,
    marginBottom: 4,
  },
  bubble: {
    padding: '12px 16px',
    borderRadius: 16,
    fontSize: 15,
    lineHeight: 1.65,
    animation: 'messageIn 0.25s ease forwards',
  },
  bubbleUser: {
    background: 'var(--sage)',
    color: 'white',
    borderBottomRightRadius: 4,
  },
  bubbleAI: {
    background: 'var(--white)',
    border: '1px solid var(--border)',
    color: 'var(--charcoal)',
    borderBottomLeftRadius: 4,
  },
  emotionTag: { marginTop: 6, paddingLeft: 2 },
  emotionBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '3px 10px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 500,
  },
  typingWrap: { display: 'flex', gap: 10, alignItems: 'flex-end' },
  typingBubble: {
    background: 'var(--white)',
    border: '1px solid var(--border)',
    padding: '12px 16px',
    borderRadius: 16,
    borderBottomLeftRadius: 4,
  },
  inputArea: {
    padding: '16px 32px 20px',
    borderTop: '1px solid var(--border)',
    background: 'var(--white)',
  },
  inputWrap: {
    display: 'flex',
    gap: 10,
    alignItems: 'flex-end',
    background: 'var(--surface)',
    border: '1px solid var(--border-dark)',
    borderRadius: 14,
    padding: '10px 10px 10px 16px',
  },
  textarea: {
    flex: 1,
    border: 'none',
    background: 'transparent',
    fontSize: 15,
    color: 'var(--charcoal)',
    resize: 'none',
    lineHeight: 1.5,
    maxHeight: 120,
    outline: 'none',
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--border)',
    color: 'var(--charcoal-soft)',
    flexShrink: 0,
    transition: 'all var(--transition)',
    border: 'none',
    cursor: 'default',
  },
  sendBtnActive: {
    background: 'var(--sage)',
    color: 'white',
    cursor: 'pointer',
  },
  inputHint: {
    fontSize: 11,
    color: 'var(--charcoal-soft)',
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.8,
  },
};
