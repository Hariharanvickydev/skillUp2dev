"""
Migration script to add 'scope' column to exams table.
This supports the new comprehensive exam system with Topic/Module/Course level practice exams.
"""

from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv
import sys

sys.path.append('/Users/ideas2it/Documents/AI agent/backend')
from app.database import SessionLocal

load_dotenv()

def migrate_exam_scope():
    db = SessionLocal()
    try:
        print("Starting exam scope migration...")
        
        # Step 1: Add scope column
        print("Adding 'scope' column to exams table...")
        db.execute(text("""
            ALTER TABLE exams 
            ADD COLUMN IF NOT EXISTS scope VARCHAR(20)
        """))
        db.commit()
        print("✓ Column added")
        
        # Step 2: Set default scope for existing PRACTICE exams
        print("Setting default scope for existing PRACTICE exams...")
        result = db.execute(text("""
            UPDATE exams 
            SET scope = 'TOPIC' 
            WHERE type = 'PRACTICE' AND scope IS NULL
        """))
        db.commit()
        print(f"✓ Updated {result.rowcount} existing PRACTICE exams to TOPIC scope")
        
        # Step 3: Verify migration
        print("\nVerifying migration...")
        result = db.execute(text("""
            SELECT type, scope, COUNT(*) as count
            FROM exams
            GROUP BY type, scope
            ORDER BY type, scope
        """))
        
        print("\nExam distribution:")
        for row in result:
            print(f"  Type: {row.type:15} Scope: {row.scope or 'NULL':10} Count: {row.count}")
        
        print("\n✅ Migration completed successfully!")
        
    except Exception as e:
        print(f"❌ Error during migration: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    migrate_exam_scope()
