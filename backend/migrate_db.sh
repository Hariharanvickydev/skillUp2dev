#!/bin/bash

# Database Migration Helper for Exam System
# This script helps reset the database to apply new schema changes

echo "🔄 Resetting Database for Exam System Migration..."
echo ""
echo "This will:"
echo "  1. Delete the existing database"
echo "  2. Restart backend to recreate tables with new columns"
echo ""

# Navigate to backend directory
cd "$(dirname "$0")"

# Remove existing database
if [ -f "skillup2dev.db" ]; then
    echo "📦 Removing old database..."
    rm skillup2dev.db
    echo "✅ Database removed"
else
    echo "ℹ️  No existing database found"
fi

echo ""
echo "✅ Migration preparation complete!"
echo ""
echo "Next steps:"
echo "  1. Start the backend server:"
echo "     cd backend && source venv/bin/activate && uvicorn app.main:app --reload"
echo ""
echo "  2. The new database will be created automatically with all new columns"
echo "  3. You'll need to create a new user account"
echo ""
