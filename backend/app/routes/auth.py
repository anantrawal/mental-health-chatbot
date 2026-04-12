from fastapi import APIRouter, HTTPException, status
from app.models.schemas import UserRegister, UserLogin, TokenResponse
from app.services.auth import hash_password, verify_password, create_access_token
from app.database import get_db
from datetime import datetime

router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(data: UserRegister):
    db = get_db()

    if await db.users.find_one({"email": data.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    if await db.users.find_one({"username": data.username}):
        raise HTTPException(status_code=400, detail="Username already taken")

    user_doc = {
        "username": data.username,
        "email": data.email,
        "full_name": data.full_name or "",
        "hashed_password": hash_password(data.password),
        "created_at": datetime.utcnow(),
        "total_sessions": 0,
        "streak_days": 0,
        "last_active": datetime.utcnow(),
    }

    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    token = create_access_token({"sub": user_id})

    return TokenResponse(
        access_token=token,
        user_id=user_id,
        username=data.username,
    )


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin):
    db = get_db()
    user = await db.users.find_one({"email": data.email})

    if not user or not verify_password(data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    user_id = str(user["_id"])
    token = create_access_token({"sub": user_id})

    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"last_active": datetime.utcnow()}},
    )

    return TokenResponse(
        access_token=token,
        user_id=user_id,
        username=user["username"],
    )
