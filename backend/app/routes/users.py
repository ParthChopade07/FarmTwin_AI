import uuid
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.orm import User
from app.schemas import UserCreate, UserLogin, UserOut
from app.auth import hash_password, verify_password, create_access_token, get_current_user, get_current_user_id
from app.limiter import limiter

router = APIRouter(prefix="/api/users", tags=["users"])


@router.post("/login")
@limiter.limit("60/minute")
def login_user(request: Request, payload: UserLogin, db: Session = Depends(get_db)):
    """Authenticate a user and return a JWT access token + safe user profile."""
    query = db.query(User)
    user = None
    if payload.email:
        user = query.filter(User.email.ilike(payload.email.strip())).first()
    elif payload.phone:
        user = query.filter(User.phone == payload.phone.strip()).first()
    else:
        raise HTTPException(status_code=400, detail="Email or phone is required to sign in")

    if not user:
        raise HTTPException(status_code=404, detail="Account not found. Please create an account first.")

    # Verify password — support legacy SHA-256 hashes transparently
    if payload.password and user.password_hash:
        import hashlib
        legacy_hash = hashlib.sha256(payload.password.encode()).hexdigest()
        bcrypt_ok = False
        try:
            bcrypt_ok = verify_password(payload.password, user.password_hash)
        except Exception:
            pass

        if not bcrypt_ok and user.password_hash != legacy_hash:
            raise HTTPException(status_code=401, detail="Incorrect password. Please try again.")

        # Upgrade legacy SHA-256 hash to bcrypt on successful login
        if user.password_hash == legacy_hash:
            user.password_hash = hash_password(payload.password)
            db.commit()

    token = create_access_token(str(user.id), role=user.role or "farmer")
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "role": user.role,
            "language": user.language,
            "district": user.district,
            "state": user.state,
        },
    }


@router.post("", status_code=201)
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    """Register a new user. If email/phone already exists, update the record."""
    existing = None
    if payload.email:
        existing = db.query(User).filter(User.email.ilike(payload.email.strip())).first()
    elif payload.phone:
        existing = db.query(User).filter(User.phone == payload.phone.strip()).first()

    if existing:
        if payload.name:
            existing.name = payload.name
        if payload.phone and not existing.phone:
            existing.phone = payload.phone
        if payload.password:
            existing.password_hash = hash_password(payload.password)
        if payload.language:
            existing.language = payload.language
        if payload.role:
            existing.role = payload.role
        if payload.district:
            existing.district = payload.district
        if payload.state:
            existing.state = payload.state
        db.commit()
        db.refresh(existing)
        token = create_access_token(str(existing.id), role=existing.role or "farmer")
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": str(existing.id),
                "name": existing.name,
                "email": existing.email,
                "phone": existing.phone,
                "role": existing.role,
                "language": existing.language,
                "district": existing.district,
                "state": existing.state,
            },
        }

    user = User(
        name=payload.name,
        email=payload.email.strip() if payload.email else None,
        phone=payload.phone.strip() if payload.phone else None,
        password_hash=hash_password(payload.password) if payload.password else None,
        language=payload.language,
        role=payload.role,
        district=payload.district,
        state=payload.state,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(str(user.id), role=user.role or "farmer")
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "role": user.role,
            "language": user.language,
            "district": user.district,
            "state": user.state,
        },
    }


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    """Return the authenticated user's own profile."""
    return current_user


@router.get("/{user_id}", response_model=UserOut)
def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
):
    """Return a user profile — only the owner may access their own profile."""
    if str(user_id) != str(current_user_id):
        raise HTTPException(status_code=403, detail="Access denied. You can only view your own profile.")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
