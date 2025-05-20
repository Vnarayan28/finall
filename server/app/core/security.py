import logging
from datetime import datetime, timedelta
from jose import jwt # JWTError might not be needed if get_current_user is gone
from passlib.context import CryptContext

from app.core.config import JWT_SECRET, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
# No longer importing TokenData for get_current_user
# from app.models.schemas import TokenData

logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_token(data: dict, expires_delta: timedelta = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)
    return encoded_jwt
