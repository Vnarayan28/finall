from fastapi import APIRouter, HTTPException
from datetime import datetime

from app.models.schemas import UserCreate, UserLogin
from app.core.security import hash_password, verify_password, create_token
from app.db.setup import users_collection

router = APIRouter()

@router.post("/signup", summary="Create new user")
async def signup(user: UserCreate):
    if users_collection.find_one({"$or": [{"email": user.email}, {"username": user.username}]}):
        raise HTTPException(status_code=400, detail="Email or username already registered")

    user_data = {
        "username": user.username,
        "email": user.email,
        "password": hash_password(user.password),
        "created_at": datetime.utcnow()
    }
    result = users_collection.insert_one(user_data)
    user_id = str(result.inserted_id)
    
    return {
        "message": "User registered successfully",
        "user_id": user_id,
        "token": create_token(
            {"sub": user_id, "email": user.email}
        )
    }

@router.post("/login", summary="Login user")
async def login(user: UserLogin):
    db_user = users_collection.find_one({"email": user.email})
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user_id = str(db_user["_id"])
    return {
        "message": "Login successful",
        "user_id": user_id, 
        "token": create_token(
            {"sub": user_id, "email": db_user["email"]}
        )
    }