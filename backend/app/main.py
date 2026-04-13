from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database import connect_db, close_db
from app.routes import auth, chat, mood, user
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up Mental Health Chatbot API...")
    await connect_db()
    yield
    logger.info("Shutting down...")
    await close_db()


app = FastAPI(
    title="Mental Health Chatbot API",
    description="AI-powered mental health support with emotion detection",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://mental-health-chatbot-qr85.onrender.com",
        "http://localhost:3000",
        "http://localhost:80",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(mood.router, prefix="/api/mood", tags=["Mood Tracking"])
app.include_router(user.router, prefix="/api/user", tags=["User"])


@app.get("/")
async def root():
    return {"message": "Mental Health Chatbot API", "status": "running", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
