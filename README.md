# 🌿 Aria — AI Mental Health Chatbot

A full-stack mental wellness application with emotion detection, AI-powered empathetic responses, mood analytics, and crisis support — containerized with Docker.

---

## 🚀 Quick Start (5 minutes)

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- That's it!

### 1. Clone / download the project
```bash
cd mental-health-chatbot
```

### 2. Configure environment
```bash
cp .env.example .env
# Optional: open .env and add your ANTHROPIC_API_KEY for Claude-powered responses
# The app works without it using built-in empathetic responses
```

### 3. Launch everything
```bash
docker compose up --build
```

First build takes ~5–10 minutes (downloads Python packages + React dependencies).

### 4. Open the app
| Service     | URL                        |
|-------------|----------------------------|
| 🌐 App      | http://localhost           |
| 🔌 Frontend | http://localhost:3000      |
| ⚙️ API      | http://localhost:8000      |
| 📚 API Docs | http://localhost:8000/docs |
| 🗄️ MongoDB  | localhost:27017            |

---

## 🏗️ Architecture

```
┌─────────────┐    ┌──────────────────────────────────────────┐
│   Browser   │───▶│              Nginx (port 80)              │
└─────────────┘    └──────────┬──────────────┬────────────────┘
                              │              │
                   ┌──────────▼──┐    ┌──────▼──────┐
                   │   React.js  │    │   FastAPI   │
                   │  (port 3000)│    │  (port 8000)│
                   └─────────────┘    └──────┬──────┘
                                             │
                              ┌──────────────┼──────────────┐
                              │              │              │
                     ┌────────▼──┐  ┌────────▼──┐  ┌───────▼────┐
                     │  MongoDB  │  │  NLTK/    │  │ Anthropic  │
                     │           │  │  VADER ML │  │ Claude API │
                     └───────────┘  └───────────┘  └────────────┘
```

---

## 🧠 ML Pipeline

Each message goes through:

1. **Emotion Detection** — VADER sentiment analysis + keyword matching → `happy / sad / anxious / angry / neutral`
2. **Risk Assessment** — Regex pattern matching for crisis/distress indicators → `low / medium / high`
3. **Response Generation** — Claude API (if key set) or rule-based empathetic templates
4. **Safety Filter** — High-risk messages trigger crisis resources display

---

## 📁 Project Structure

```
mental-health-chatbot/
├── docker-compose.yml
├── .env.example
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py              # FastAPI app + lifespan
│       ├── database.py          # MongoDB connection
│       ├── config.py            # Settings from env
│       ├── ml/
│       │   └── analyzer.py      # Emotion + risk detection
│       ├── services/
│       │   ├── auth.py          # JWT + bcrypt
│       │   └── response_generator.py  # Claude + fallback
│       ├── models/
│       │   └── schemas.py       # Pydantic models
│       └── routes/
│           ├── auth.py          # /api/auth/*
│           ├── chat.py          # /api/chat/*
│           ├── mood.py          # /api/mood/*
│           └── user.py          # /api/user/*
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── App.js               # Router + auth guards
│       ├── context/AuthContext.js
│       ├── pages/
│       │   ├── Login.js
│       │   ├── Register.js
│       │   ├── Chat.js          # Main chat interface
│       │   └── Dashboard.js     # Mood analytics
│       ├── components/Layout.js # Sidebar navigation
│       └── utils/
│           ├── api.js           # Axios instance
│           └── emotions.js      # Emotion helpers
└── nginx/
    ├── Dockerfile
    └── nginx.conf               # Reverse proxy config
```

---

## 🔌 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Get JWT token |
| POST | `/api/chat/message` | Send message, get AI response |
| GET | `/api/chat/history` | Message history |
| GET | `/api/chat/sessions` | List all sessions |
| GET | `/api/chat/session/{id}` | Get session messages |
| POST | `/api/mood/log` | Manual mood entry |
| GET | `/api/mood/history` | Mood entries |
| GET | `/api/mood/analytics` | Emotion distribution + trend |
| GET | `/api/user/profile` | User profile + stats |

Full interactive docs: http://localhost:8000/docs

---

## ⚙️ Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | (empty) | Enables Claude responses |
| `SECRET_KEY` | change-me | JWT signing key |
| `MONGODB_URL` | mongodb://mongo:27017 | MongoDB connection |
| `DB_NAME` | mental_health_db | Database name |

---

## 🛠️ Development

### Rebuild a single service
```bash
docker compose up --build backend
```

### View logs
```bash
docker compose logs -f backend
docker compose logs -f frontend
```

### Stop everything
```bash
docker compose down
```

### Stop and remove data (fresh start)
```bash
docker compose down -v
```

### Access MongoDB shell
```bash
docker exec -it mhchat_mongo mongosh mental_health_db
```

---

## 🔐 Ethical Notes

- ⚠️ **Not a replacement for professional mental healthcare**
- All crisis messages surface verified helpline numbers
- User passwords hashed with bcrypt
- JWT tokens expire after 7 days
- No data sold or shared

---

## 🚀 Upgrading to Production

1. Set a strong `SECRET_KEY` in `.env`
2. Use `HTTPS` (add SSL cert to nginx config)
3. Add MongoDB authentication
4. Set `--reload` flag off in backend CMD
5. Use Docker secrets for API keys
