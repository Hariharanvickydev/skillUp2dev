# PostgreSQL Migration Guide

## Overview
Migrate SkillUp2Dev from SQLite to PostgreSQL for production readiness.

## Prerequisites
✅ PostgreSQL 15 installed and running
✅ Database 'skillup2dev' created
✅ User 'skillup_user' created with permissions
✅ psycopg2-binary installed

## Step 1: Update .env File

Edit `backend/.env` and update the DATABASE_URL:

```bash
# OLD (SQLite)
# DATABASE_URL=sqlite:///./skillup2dev.db

# NEW (PostgreSQL)
DATABASE_URL=postgresql://skillup_user:skillup_password@localhost:5432/skillup2dev
```

## Step 2: Backup Current SQLite Data

```bash
cd backend
python backup_data.py
```

This creates a backup in `backend/backups/backup_YYYYMMDD_HHMMSS/`

## Step 3: Run Migration Script

```bash
cd backend
python migrate_to_postgres.py
```

This will:
- Create all tables in PostgreSQL
- Copy all data from SQLite
- Preserve UUIDs and relationships

## Step 4: Verify Migration

```bash
# Check tables created
psql -d skillup2dev -c "\dt"

# Check data counts
psql -d skillup2dev -c "SELECT COUNT(*) FROM courses;"
psql -d skillup2dev -c "SELECT COUNT(*) FROM topics;"
psql -d skillup2dev -c "SELECT COUNT(*) FROM users;"
```

## Step 5: Restart Backend

```bash
cd backend
python -m uvicorn app.main:app --reload
```

## Step 6: Test Application

1. Login to admin panel
2. Check courses load correctly
3. Test module publishing
4. Test content generation
5. Verify consumer view

## Rollback (if needed)

If something goes wrong:

```bash
# 1. Stop backend server

# 2. Restore .env to SQLite
DATABASE_URL=sqlite:///./skillup2dev.db

# 3. Restart backend
python -m uvicorn app.main:app --reload
```

## Benefits of PostgreSQL

✅ Better performance at scale
✅ Better concurrency handling
✅ Production-ready
✅ Cloud deployment ready
✅ ACID compliant
✅ Better data integrity

## Connection String Format

```
postgresql://[user]:[password]@[host]:[port]/[database]
```

Example:
```
postgresql://skillup_user:skillup_password@localhost:5432/skillup2dev
```

## Troubleshooting

**Issue:** Connection refused
**Fix:** Ensure PostgreSQL is running: `brew services list`

**Issue:** Permission denied
**Fix:** Grant permissions:
```bash
psql -d skillup2dev -c "GRANT ALL ON SCHEMA public TO skillup_user;"
psql -d skillup2dev -c "GRANT ALL ON ALL TABLES IN SCHEMA public TO skillup_user;"
psql -d skillup2dev -c "GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO skillup_user;"
```

**Issue:** Tables not created
**Fix:** Run migration script again - it's idempotent

## Production Deployment

For cloud deployment (Render, Railway, etc.):

1. Create PostgreSQL database on cloud platform
2. Get connection string from platform
3. Update DATABASE_URL in environment variables
4. Deploy application
5. Run migration script on cloud

## Next Steps

After successful migration:
- ✅ Keep SQLite backup for safety
- ✅ Test all features thoroughly
- ✅ Monitor performance
- ✅ Set up automated backups
- ✅ Consider cloud PostgreSQL (Supabase, Neon)
