# FarmTwin AI — Setup Guide

Follow these steps on **any machine** to get the project running with all features (including the Service Hub operators map).

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Python | 3.11 – 3.13 | https://python.org |
| PostgreSQL | 14+ | https://www.postgresql.org/download/ |
| Node.js | 18+ | https://nodejs.org |

---

## 1. Database Setup

Open **psql** (or pgAdmin) and run:

```sql
CREATE USER agritwin WITH PASSWORD 'agritwin';
CREATE DATABASE agritwin OWNER agritwin;
-- PostGIS extension (needed for geometry columns)
\c agritwin
CREATE EXTENSION IF NOT EXISTS postgis;
```

> **Note:** The app auto-creates all tables and seeds 72 verified operators on first startup — no SQL scripts to run manually.

---

## 2. Backend Setup

```bash
cd agritwin/backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy and edit environment file
copy .env.example .env
# Edit .env — at minimum set DATABASE_URL and GROQ_API_KEY
```

### `.env` minimum settings

```
DATABASE_URL=postgresql+pg8000://agritwin:agritwin@localhost:5432/agritwin
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
JWT_SECRET_KEY=generate_a_random_string_here
GROQ_API_KEY=get_free_key_from_console.groq.com
```

Generate `JWT_SECRET_KEY`:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

### Start the backend

```bash
# From the backend/ directory
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

On first start you will see in the console:
```
[seed] ✅ Seeded 72 operators into the database.
```

---

## 3. Frontend Setup

```bash
cd agritwin/frontend
npm install
npm run dev
```

Open http://localhost:5173

---

## 4. Verify Service Hub Works

After both servers are running:

1. Open http://localhost:5173
2. Log in (demo credentials are pre-filled on the login page)
3. Go to **Service Hub**
4. You should see the map populated with operator pins across Maharashtra

If operators don't appear, check:
- Backend is running on port 8000
- DB seeding ran (check backend console for `[seed] ✅`)
- No CORS errors in the browser console

---

## 5. Optional: Groq API Key (AI Assistant)

1. Go to https://console.groq.com
2. Sign up (free)
3. Create an API key
4. Set `GROQ_API_KEY=gsk_...` in `backend/.env`

Without the key the AI Advisor falls back to the built-in ICAR rule engine — all other features still work.

---

## Architecture Overview

```
agritwin/
├── backend/          FastAPI + SQLAlchemy + PostgreSQL
│   ├── app/
│   │   ├── main.py   Entry point (startup seeding happens here)
│   │   ├── seed.py   72 operator seed records (auto-runs if table empty)
│   │   ├── auth.py   JWT authentication
│   │   ├── routes/   API endpoints
│   │   ├── models/   ORM models
│   │   └── services/ Business logic
│   ├── .env.example  Copy to .env and fill in your values
│   └── requirements.txt
└── frontend/         React + Vite + Tailwind + Leaflet
    ├── src/
    │   ├── pages/    ServiceHub, Dashboard, Marketplace, …
    │   └── services/ api.js (auto-attaches JWT to all requests)
    └── package.json
```
