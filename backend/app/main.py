import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from dotenv import load_dotenv

from app.database import Base, engine
from app.models import orm  # noqa: F401 - ensures models are registered on Base
from app.routes import (
    farms,
    users,
    satellite,
    weather,
    health,
    recommendations,
    assistant,
    marketplace,
    services,
    market,
    disease,
    notifications,
    xai,
    weekly_report,
    memory,
    agent,
    alerts,
)

load_dotenv()

from app.limiter import limiter

app = FastAPI(title="AgriTwin AI API", version="0.1.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS ─────────────────────────────────────────────────────────────────────
_raw_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

# Guard: never allow wildcard with credentials — force explicit list
if "*" in origins:
    # In dev-only fallback, use the two known local origins
    origins = ["http://localhost:5173", "http://127.0.0.1:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "X-Requested-With"],
)

app.include_router(users.router)
app.include_router(farms.router)
app.include_router(satellite.router)
app.include_router(weather.router)
app.include_router(health.router)
app.include_router(recommendations.router)
app.include_router(assistant.router)
app.include_router(assistant.medicine_router)
app.include_router(marketplace.router)
app.include_router(services.router)
app.include_router(market.router)
app.include_router(disease.router)
app.include_router(notifications.router)
app.include_router(xai.router)
app.include_router(weekly_report.router)
app.include_router(memory.router)
app.include_router(agent.router)
app.include_router(alerts.router)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    # Auto-seed reference data so the app works on any fresh install
    from app.seed import run_all_seeds
    run_all_seeds()


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "agritwin-ai-backend"}
