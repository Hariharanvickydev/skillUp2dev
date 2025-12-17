# Server Startup Guide

This document provides instructions to manually start the backend and frontend servers for the AI Agent application.

## Prerequisites

- Python 3.10+ installed
- Node.js and npm installed
- Virtual environment set up for backend
- Dependencies installed for both backend and frontend

---

## Starting the Backend Server

### Option 1: Using the Launcher Script (Recommended)

The launcher script lets you choose the database at runtime.

#### SQLite (Development/Testing)
```bash
./start-backend.sh sqlite
```

#### PostgreSQL (Production)
```bash
./start-backend.sh postgres
```

**Expected Output**:
```
🚀 SkillUp2Dev Backend Launcher

✓ Using PostgreSQL
  Database: skillup2dev
  Host: localhost:5432

Starting backend server...

INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
```

**Backend will be available at**: `http://localhost:8000`

---

### Option 2: Manual Start (Traditional)

#### 1. Navigate to Backend Directory
```bash
cd /Users/ideas2it/Documents/AI\ agent/backend
```

#### 2. Activate Virtual Environment
```bash
source venv/bin/activate
```

#### 3. Start Uvicorn Server
```bash
python -m uvicorn app.main:app --reload
```

**Note**: This uses the database configured in `backend/.env` file.

---

## Starting the Frontend Server

### 1. Open New Terminal Tab/Window

### 2. Navigate to Frontend Directory
```bash
cd /Users/ideas2it/Documents/AI\ agent/frontend
```

### 3. Start Next.js Development Server
```bash
npm run dev
```

**Expected Output**:
```
▲ Next.js 16.0.7
- Local:        http://localhost:3000
- Turbopack:    enabled

✓ Starting...
✓ Ready in 2.3s
```

**Frontend will be available at**: `http://localhost:3000`

---

## Quick Start Commands

### Terminal 1 (Backend with SQLite)
```bash
./start-backend.sh sqlite
```

### Terminal 1 (Backend with PostgreSQL)
```bash
./start-backend.sh postgres
```

### Terminal 2 (Frontend)
```bash
cd /Users/ideas2it/Documents/AI\ agent/frontend && npm run dev
```

---

## Stopping the Servers

### Stop Backend
- Press `CTRL+C` in the backend terminal

### Stop Frontend
- Press `CTRL+C` in the frontend terminal

---

## Troubleshooting

### Port Already in Use

If you get "Address already in use" errors:

**Backend (Port 8000)**:
```bash
lsof -ti:8000 | xargs kill -9
```

**Frontend (Port 3000)**:
```bash
lsof -ti:3000 | xargs kill -9
```

### Backend Dependencies Missing
```bash
cd /Users/ideas2it/Documents/AI\ agent/backend
source venv/bin/activate
pip install -r requirements.txt
```

### Frontend Dependencies Missing
```bash
cd /Users/ideas2it/Documents/AI\ agent/frontend
npm install
```

### Environment Variables

**Required**:
- `GEMINI_API_KEY`: Set in `backend/.env` for AI content generation

**Database Configuration**:
- Use launcher script: `./start-backend.sh [sqlite|postgres]`
- Or set `DATABASE_URL` in `backend/.env`:
  - SQLite: `sqlite:///./skillup2dev.db`
  - PostgreSQL: `postgresql://skillup_user:skillup_password@localhost:5432/skillup2dev`

---

## Verification

### Check Backend Health
```bash
curl http://localhost:8000/courses/
```

### Check Frontend
Open browser and navigate to: `http://localhost:3000`
