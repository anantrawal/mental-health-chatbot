from fastapi import APIRouter, Depends, HTTPException
from app.models.schemas import ChatMessage, ChatResponse
from app.services.auth import get_current_user
from app.ml.analyzer import analyze_message
from app.services.response_generator import generate_response
from app.database import get_db
from datetime import datetime
from bson import ObjectId
import uuid

router = APIRouter()


@router.post("/message", response_model=ChatResponse)
async def send_message(data: ChatMessage, current_user: dict = Depends(get_current_user)):
    db = get_db()
    user_id = current_user["id"]
    session_id = data.session_id or str(uuid.uuid4())

    # Fetch conversation history for context
    history_cursor = db.messages.find(
        {"user_id": user_id, "session_id": session_id}
    ).sort("created_at", 1).limit(10)
    history = []
    async for msg in history_cursor:
        history.append({"role": "user", "content": msg["user_message"]})
        history.append({"role": "assistant", "content": msg["ai_response"]})

    # ML Analysis
    emotion_result, risk_result = analyze_message(data.content)

    # Generate AI response
    ai_response = await generate_response(
        user_message=data.content,
        emotion=emotion_result["emotion"],
        risk_level=risk_result["risk_level"],
        is_crisis=risk_result["is_crisis"],
        conversation_history=history,
    )

    # Store message
    message_doc = {
        "user_id": user_id,
        "session_id": session_id,
        "user_message": data.content,
        "ai_response": ai_response,
        "emotion": emotion_result["emotion"],
        "emotion_confidence": emotion_result["confidence"],
        "valence": emotion_result["valence"],
        "risk_level": risk_result["risk_level"],
        "is_crisis": risk_result["is_crisis"],
        "created_at": datetime.utcnow(),
    }

    result = await db.messages.insert_one(message_doc)

    # Auto-log mood entry
    await db.mood_entries.insert_one({
        "user_id": user_id,
        "emotion": emotion_result["emotion"],
        "valence": emotion_result["valence"],
        "source": "chat",
        "note": "",
        "intensity": max(1, min(10, int((emotion_result["valence"] + 1) * 5))),
        "created_at": datetime.utcnow(),
    })

    # Update session count
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"last_active": datetime.utcnow()}, "$inc": {"total_sessions": 0}},
    )

    return ChatResponse(
        message_id=str(result.inserted_id),
        user_message=data.content,
        ai_response=ai_response,
        emotion={
            "emotion": emotion_result["emotion"],
            "confidence": emotion_result["confidence"],
            "valence": emotion_result["valence"],
        },
        risk={
            "risk_level": risk_result["risk_level"],
            "is_crisis": risk_result["is_crisis"],
            "requires_immediate_support": risk_result["requires_immediate_support"],
        },
        session_id=session_id,
        created_at=message_doc["created_at"],
    )


@router.get("/history")
async def get_history(limit: int = 50, current_user: dict = Depends(get_current_user)):
    db = get_db()
    cursor = db.messages.find(
        {"user_id": current_user["id"]}
    ).sort("created_at", -1).limit(limit)

    messages = []
    async for msg in cursor:
        msg["id"] = str(msg["_id"])
        del msg["_id"]
        messages.append(msg)

    return {"messages": messages}


@router.get("/sessions")
async def get_sessions(current_user: dict = Depends(get_current_user)):
    db = get_db()
    pipeline = [
        {"$match": {"user_id": current_user["id"]}},
        {"$group": {
            "_id": "$session_id",
            "message_count": {"$sum": 1},
            "last_message": {"$last": "$user_message"},
            "started_at": {"$min": "$created_at"},
            "last_activity": {"$max": "$created_at"},
        }},
        {"$sort": {"last_activity": -1}},
        {"$limit": 20},
    ]
    sessions = []
    async for s in db.messages.aggregate(pipeline):
        s["session_id"] = s["_id"]
        del s["_id"]
        sessions.append(s)
    return {"sessions": sessions}


@router.get("/session/{session_id}")
async def get_session_messages(session_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    cursor = db.messages.find(
        {"user_id": current_user["id"], "session_id": session_id}
    ).sort("created_at", 1)

    messages = []
    async for msg in cursor:
        msg["id"] = str(msg["_id"])
        del msg["_id"]
        messages.append(msg)
    return {"messages": messages}
