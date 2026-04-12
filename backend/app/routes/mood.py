from fastapi import APIRouter, Depends
from app.models.schemas import MoodEntry
from app.services.auth import get_current_user
from app.database import get_db
from datetime import datetime, timedelta

router = APIRouter()


@router.post("/log")
async def log_mood(data: MoodEntry, current_user: dict = Depends(get_current_user)):
    db = get_db()
    entry = {
        "user_id": current_user["id"],
        "emotion": data.emotion,
        "note": data.note or "",
        "intensity": data.intensity,
        "source": "manual",
        "valence": _emotion_to_valence(data.emotion),
        "created_at": datetime.utcnow(),
    }
    result = await db.mood_entries.insert_one(entry)
    return {"id": str(result.inserted_id), "message": "Mood logged successfully"}


@router.get("/history")
async def mood_history(days: int = 30, current_user: dict = Depends(get_current_user)):
    db = get_db()
    since = datetime.utcnow() - timedelta(days=days)
    cursor = db.mood_entries.find(
        {"user_id": current_user["id"], "created_at": {"$gte": since}}
    ).sort("created_at", 1)

    entries = []
    async for e in cursor:
        e["id"] = str(e["_id"])
        del e["_id"]
        entries.append(e)
    return {"entries": entries, "count": len(entries)}


@router.get("/analytics")
async def mood_analytics(days: int = 30, current_user: dict = Depends(get_current_user)):
    db = get_db()
    since = datetime.utcnow() - timedelta(days=days)

    pipeline = [
        {"$match": {"user_id": current_user["id"], "created_at": {"$gte": since}}},
        {"$group": {
            "_id": "$emotion",
            "count": {"$sum": 1},
            "avg_intensity": {"$avg": "$intensity"},
            "avg_valence": {"$avg": "$valence"},
        }},
        {"$sort": {"count": -1}},
    ]

    distribution = []
    async for item in db.mood_entries.aggregate(pipeline):
        item["emotion"] = item["_id"]
        del item["_id"]
        distribution.append(item)

    # Daily trend
    trend_pipeline = [
        {"$match": {"user_id": current_user["id"], "created_at": {"$gte": since}}},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
            "avg_valence": {"$avg": "$valence"},
            "dominant_emotion": {"$last": "$emotion"},
            "count": {"$sum": 1},
        }},
        {"$sort": {"_id": 1}},
    ]

    trend = []
    async for item in db.mood_entries.aggregate(trend_pipeline):
        item["date"] = item["_id"]
        del item["_id"]
        trend.append(item)

    return {
        "emotion_distribution": distribution,
        "daily_trend": trend,
        "period_days": days,
    }


def _emotion_to_valence(emotion: str) -> float:
    mapping = {
        "happy": 0.8,
        "neutral": 0.0,
        "sad": -0.6,
        "anxious": -0.4,
        "angry": -0.5,
    }
    return mapping.get(emotion, 0.0)
