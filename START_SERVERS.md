# Server Startup Guide

This document provides instructions to manually start the backend and frontend servers for the AI Agent application.

## Prerequisites

- Python 3.10+ installed
- Node.js and npm installed
- Virtual environment set up for backend
- Dependencies installed for both backend and frontend

---

## Starting the Backend Server

### 1. Navigate to Backend Directory
```bash
cd /Users/ideas2it/Documents/AI\ agent/backend
```

### 2. Activate Virtual Environment
```bash
source venv/bin/activate
```

### 3. Start Uvicorn Server
```bash
uvicorn app.main:app --reload
```

**Expected Output**:
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

**Backend will be available at**: `http://localhost:8000`

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

### Terminal 1 (Backend)
```bash
cd /Users/ideas2it/Documents/AI\ agent/backend && source venv/bin/activate && uvicorn app.main:app --reload
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

Ensure `GEMINI_API_KEY` is set in your environment or `.env` file for the backend to work properly.

---

## Verification

### Check Backend Health
```bash
curl http://localhost:8000/courses/
```

### Check Frontend
Open browser and navigate to: `http://localhost:3000`
