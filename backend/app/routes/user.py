from fastapi import APIRouter, Depends
from app.services.auth import get_current_user
from app.database import get_db

router = APIRouter()


@router.get("/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    db = get_db()
    total_messages = await db.messages.count_documents({"user_id": current_user["id"]})
    total_sessions_pipeline = [
        {"$match": {"user_id": current_user["id"]}},
        {"$group": {"_id": "$session_id"}},
        {"$count": "total"},
    ]
    sessions_result = []
    async for r in db.messages.aggregate(total_sessions_pipeline):
        sessions_result.append(r)
    total_sessions = sessions_result[0]["total"] if sessions_result else 0

    return {
        "username": current_user["username"],
        "email": current_user["email"],
        "full_name": current_user.get("full_name", ""),
        "created_at": current_user["created_at"],
        "total_messages": total_messages,
        "total_sessions": total_sessions,
        "streak_days": current_user.get("streak_days", 0),
        "last_active": current_user.get("last_active"),
    }
