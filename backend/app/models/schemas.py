from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=30)
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: Optional[str] = ""


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    username: str


class ChatMessage(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)
    session_id: Optional[str] = None


class EmotionResult(BaseModel):
    emotion: str
    confidence: float
    valence: float


class RiskResult(BaseModel):
    risk_level: str
    is_crisis: bool
    requires_immediate_support: bool


class ChatResponse(BaseModel):
    message_id: str
    user_message: str
    ai_response: str
    emotion: EmotionResult
    risk: RiskResult
    session_id: str
    created_at: datetime


class MoodEntry(BaseModel):
    emotion: str
    note: Optional[str] = ""
    intensity: int = Field(default=5, ge=1, le=10)


class MoodEntryResponse(BaseModel):
    id: str
    emotion: str
    note: str
    intensity: int
    created_at: datetime


class UserProfile(BaseModel):
    username: str
    email: str
    full_name: str
    created_at: datetime
    total_sessions: int
    streak_days: int
