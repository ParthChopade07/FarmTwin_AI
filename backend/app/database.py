import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from pathlib import Path
from dotenv import load_dotenv

# Load .env from backend folder or project root
_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_env_path if _env_path.exists() else None)
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    if os.getenv("ENVIRONMENT", "development").lower() == "production":
        raise RuntimeError("CRITICAL: DATABASE_URL environment variable is required in production.")
    # Local dev fallback only (no credentials hardcoded in production)
    DATABASE_URL = "postgresql+pg8000://127.0.0.1:5432/agritwin"
else:
    DATABASE_URL = DATABASE_URL.replace("localhost", "127.0.0.1")

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI dependency that yields a DB session and always closes it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# trigger reload 2
