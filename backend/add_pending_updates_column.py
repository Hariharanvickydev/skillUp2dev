import sys
import os

# Add backend/app directory to sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app import database
from sqlalchemy import text

def main():
    db = next(database.get_db())
    
    try:
        print("Adding has_pending_updates column to courses table...")
        
        # Add the column
        db.execute(text(
            "ALTER TABLE courses ADD COLUMN IF NOT EXISTS has_pending_updates BOOLEAN DEFAULT FALSE"
        ))
        
        db.commit()
        print("✅ Successfully added has_pending_updates column!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
