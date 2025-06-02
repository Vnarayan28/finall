from pydantic import BaseModel
from typing import Optional

class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str


class TokenData(BaseModel):
    user_id: Optional[str] = None 
    email: Optional[str] = None