
import os
import sys

# Force Postgres
os.environ["DATABASE_URL"] = "postgresql://ideas2it@localhost:5432/skillup2dev"

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import models, database
from sqlalchemy import text

def run_migration():
    print("Running migration: Adding phone, year, roll_number to users table...")
    
    db = database.SessionLocal()
    try:
        # Check if column exists to avoid error
        # Postgres specific check, or just try/except
         
        # Phone
        try:
            db.execute(text("ALTER TABLE users ADD COLUMN phone VARCHAR"))
            print("Added column: phone")
        except Exception as e:
            print(f"Skipped phone (might exist): {e}")

        # Year
        try:
            db.execute(text("ALTER TABLE users ADD COLUMN year VARCHAR"))
            print("Added column: year")
        except Exception as e:
            print(f"Skipped year (might exist): {e}")
            
        # Roll Number
        try:
            db.execute(text("ALTER TABLE users ADD COLUMN roll_number VARCHAR"))
            print("Added column: roll_number")
        except Exception as e:
            print(f"Skipped roll_number (might exist): {e}")

        db.commit()
        print("✅ Migration complete.")

    except Exception as e:
         print(f"❌ Migration failed: {e}")
         db.rollback()
    finally:
         db.close()

if __name__ == "__main__":
    run_migration()
