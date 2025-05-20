from pydantic import BaseModel
from typing import Optional

class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

# TokenData is no longer used as a dependency type hint,
# but it can represent the structure of the data within the JWT token.
# It's not strictly necessary if create_token just takes a generic dict.
# Keeping it for conceptual clarity for the token payload.
class TokenData(BaseModel):
    user_id: Optional[str] = None # 'sub' in JWT
    email: Optional[str] = None