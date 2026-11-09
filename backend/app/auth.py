"""
JWT Authentication & Password Hashing utilities for FarmTwin.

Provides:
  - Direct bcrypt password hashing / verification
  - JWT access-token creation & verification
  - FastAPI dependency  get_current_user(token)  for protected endpoints
  - FastAPI dependency  get_current_user_id(token)
"""

import os
import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.database import get_db

# ── Config ──────────────────────────────────────────────────────────────────
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "farmtwin-dev-secret-CHANGE-IN-PRODUCTION-32chars+")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "1440"))  # 24 hrs

# ── Direct Bcrypt password helpers ───────────────────────────────────────────
def hash_password(plain: str) -> str:
    """Hash a plaintext password with bcrypt (salted, adaptive)."""
    pwd_bytes = plain.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    """Return True if plain matches the stored bcrypt hash."""
    pwd_bytes = plain.encode("utf-8")[:72]
    try:
        return bcrypt.checkpw(pwd_bytes, hashed.encode("utf-8"))
    except Exception:
        return False

# ── JWT helpers ──────────────────────────────────────────────────────────────
def create_access_token(user_id: str, role: str = "farmer") -> str:
    """Create a signed JWT token containing user_id and role."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": str(user_id),
        "role": role,
        "exp": expire,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def _decode_token(token: str) -> dict:
    """Decode and validate a JWT; raises HTTPException on failure."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if not payload.get("sub"):
            raise HTTPException(status_code=401, detail="Invalid token")
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is invalid or expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

# ── FastAPI dependencies ─────────────────────────────────────────────────────
_bearer = HTTPBearer(auto_error=False)

def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
    db: Session = Depends(get_db),
):
    """
    FastAPI dependency. Returns the User ORM object for the authenticated caller.
    Raises 401 if the bearer token is missing or invalid.
    """
    from app.models.orm import User

    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = _decode_token(credentials.credentials)
    user_id = payload.get("sub")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return user

def get_current_user_id(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
) -> str:
    """Lightweight dependency — returns only the user_id string."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = _decode_token(credentials.credentials)
    return payload["sub"]
