"""
Database migration to add author tracking fields to courses table.
Run this script to add last_modified_by_user_id and approved_by_user_id columns.
"""

from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def migrate():
    print("Starting migration to add author tracking fields...")
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        try:
            # Add last_modified_by_user_id column
            print("Adding last_modified_by_user_id column...")
            conn.execute(text("""
                ALTER TABLE courses 
                ADD COLUMN IF NOT EXISTS last_modified_by_user_id UUID REFERENCES users(id)
            """))
            conn.commit()
            print("✓ Added last_modified_by_user_id column")
            
            # Add approved_by_user_id column
            print("Adding approved_by_user_id column...")
            conn.execute(text("""
                ALTER TABLE courses 
                ADD COLUMN IF NOT EXISTS approved_by_user_id UUID REFERENCES users(id)
            """))
            conn.commit()
            print("✓ Added approved_by_user_id column")
            
            print("\n✅ Migration completed successfully!")
            print("\nNote: Existing courses will have NULL values for these fields.")
            print("They will be populated as courses are edited and approved.")
            
        except Exception as e:
            print(f"\n❌ Migration failed: {e}")
            conn.rollback()
            raise

if __name__ == "__main__":
    migrate()
