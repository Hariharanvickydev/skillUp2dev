# Database Backup and Restore Scripts

This directory contains scripts to backup and restore AI-generated content from the database. This is useful to avoid costly regeneration of content when recreating the database in the cloud.

## 📦 What Gets Backed Up

The backup scripts preserve:
- **Admin Users** - Your admin accounts
- **Courses** - All course metadata
- **Topics** - Topic hierarchy and structure
- **Topic Content** - AI-generated markdown content (the expensive part!)
- **Exams** - AI-generated quiz questions

## 🔧 Usage

### Creating a Backup

```bash
cd backend
python backup_data.py
```

This creates a timestamped backup directory in `backups/backup_YYYYMMDD_HHMMSS/` containing:
- `users.json` - Admin users
- `courses.json` - Course data
- `topics.json` - Topic structure
- `topic_contents.json` - AI-generated content
- `exams.json` - AI-generated exams
- `metadata.json` - Backup information

**Custom output directory:**
```bash
python backup_data.py --output-dir /path/to/backups
```

### Restoring from Backup

```bash
cd backend
python restore_data.py backups/backup_20241209_120000
```

The restore script:
- ✅ Preserves original UUIDs (maintains relationships)
- ✅ Skips existing data (idempotent - safe to run multiple times)
- ✅ Restores in correct order (respects foreign keys)

## 🚀 Common Workflows

### Workflow 1: Backup Before Cloud Migration

```bash
# 1. Create backup of local data
python backup_data.py

# 2. Deploy to cloud and create fresh database
# (your cloud deployment process)

# 3. Restore the backup to cloud database
python restore_data.py backups/backup_YYYYMMDD_HHMMSS
```

### Workflow 2: Regular Backups

```bash
# Create daily backups (add to cron/scheduler)
python backup_data.py --output-dir /backups/daily
```

### Workflow 3: Fresh Development Database

```bash
# 1. Delete old database
rm instance/app.db

# 2. Create fresh schema
python -c "from app.database import engine, Base; Base.metadata.create_all(bind=engine)"

# 3. Restore from backup
python restore_data.py backups/backup_YYYYMMDD_HHMMSS
```

## 💰 Cost Savings

**Without backups:**
- Regenerating 10 courses with 50 topics = ~500 AI API calls
- At $0.01 per call = **$5.00**

**With backups:**
- Backup once, restore unlimited times = **$0.00**

## 📝 Backup File Structure

```
backups/
└── backup_20241209_120000/
    ├── metadata.json         # Backup info
    ├── users.json           # Admin users
    ├── courses.json         # Courses
    ├── topics.json          # Topics
    ├── topic_contents.json  # AI-generated content
    └── exams.json           # AI-generated exams
```

## ⚠️ Important Notes

1. **Backup regularly** - Create backups before major changes
2. **Version control** - Keep multiple backup versions
3. **Test restores** - Verify backups work before you need them
4. **Secure storage** - Backup files contain your data, store securely
5. **Git ignore** - The `backups/` directory is git-ignored by default

## 🔍 Troubleshooting

**"Backup directory not found"**
- Check the path to your backup directory
- Use absolute paths if relative paths don't work

**"Foreign key constraint failed"**
- The restore script handles this automatically
- If you see this, ensure you're restoring to a fresh database

**"Already exists, skipping"**
- This is normal - the script is idempotent
- It won't duplicate existing data

## 📚 Examples

**Check what's in a backup:**
```bash
cat backups/backup_20241209_120000/metadata.json
```

**List all backups:**
```bash
ls -la backups/
```

**Backup to external drive:**
```bash
python backup_data.py --output-dir /Volumes/ExternalDrive/backups
```
