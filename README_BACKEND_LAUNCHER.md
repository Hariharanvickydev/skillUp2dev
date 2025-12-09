# Backend Launcher

## Quick Start

Choose your database at runtime:

```bash
# Development (SQLite)
./start-backend.sh sqlite

# Production (PostgreSQL)
./start-backend.sh postgres
```

## How It Works

The script sets the `DATABASE_URL` environment variable before starting the backend:

- **SQLite**: `sqlite:///./skillup2dev.db`
- **PostgreSQL**: `postgresql://skillup_user:skillup_password@localhost:5432/skillup2dev`

## Benefits

✅ No need to edit `.env` file  
✅ Easy to switch between databases  
✅ Perfect for development/testing  
✅ Same data available in both databases (via backups)

## Examples

```bash
# Test with SQLite (faster startup)
./start-backend.sh sqlite

# Deploy with PostgreSQL (production-ready)
./start-backend.sh postgres
```

## Alternative: Use .env file

If you prefer to use `.env` file permanently:

1. Edit `backend/.env`
2. Set `DATABASE_URL=postgresql://...` or `DATABASE_URL=sqlite://...`
3. Run: `cd backend && python -m uvicorn app.main:app --reload`

## Database Migration

Both databases have the same data (migrated on 2025-12-09):
- 2 users
- 3 courses
- 199 topics
- 10 topic contents
- 2 exams

Switch freely between them!
