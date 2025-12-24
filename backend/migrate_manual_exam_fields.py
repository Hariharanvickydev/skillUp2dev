"""
Database migration script for Manual Exam Editor features
Adds creation_mode, is_locked, and locked_at fields to exams table

Run with: python migrate_manual_exam_fields.py
"""

import sys
sys.path.insert(0, '/Users/ideas2it/Documents/AI agent/backend')

from app import database, models
from sqlalchemy import text

def migrate():
    db = next(database.get_db())
    
    try:
        print("🔄 Starting manual exam fields migration...")
        
        # Step 1: Create creation_mode enum
        print("\n1️⃣ Creating creation_mode enum...")
        db.execute(text("""
            DO $$ BEGIN
                CREATE TYPE creation_mode AS ENUM ('AI', 'MANUAL', 'IMPORT');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        """))
        db.commit()
        print("   ✅ creation_mode enum created")
        
        # Step 2: Add columns
        print("\n2️⃣ Adding new columns...")
        db.execute(text("""
            ALTER TABLE exams 
            ADD COLUMN IF NOT EXISTS creation_mode creation_mode DEFAULT 'AI',
            ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP NULL;
        """))
        db.commit()
        print("   ✅ Columns added")
        
        # Step 3: Set creation_mode for existing exams
        print("\n3️⃣ Setting creation_mode for existing exams...")
        result = db.execute(text("""
            UPDATE exams 
            SET creation_mode = 'AI'::creation_mode
            WHERE creation_mode IS NULL;
        """))
        db.commit()
        print(f"   ✅ Updated {result.rowcount} exams")
        
        # Step 4: Lock exams that have attempts
        print("\n4️⃣ Locking exams with existing attempts...")
        result = db.execute(text("""
            UPDATE exams e
            SET is_locked = TRUE,
                locked_at = NOW()
            WHERE EXISTS (
                SELECT 1 FROM exam_attempts ea
                WHERE ea.exam_id = e.id
            )
            AND is_locked = FALSE;
        """))
        db.commit()
        print(f"   ✅ Locked {result.rowcount} exams")
        
        # Step 5: Create indexes
        print("\n5️⃣ Creating indexes...")
        db.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_exams_creation_mode ON exams(creation_mode);
        """))
        db.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_exams_is_locked ON exams(is_locked);
        """))
        db.commit()
        print("   ✅ Indexes created")
        
        # Step 6: Verify migration
        print("\n6️⃣ Verifying migration...")
        result = db.execute(text("""
            SELECT 
                creation_mode,
                is_locked,
                COUNT(*) as count
            FROM exams
            GROUP BY creation_mode, is_locked
            ORDER BY creation_mode, is_locked;
        """))
        
        print("\n   📊 Exam Distribution:")
        for row in result:
            locked_status = "Locked" if row.is_locked else "Unlocked"
            print(f"      {row.creation_mode} / {locked_status}: {row.count} exams")
        
        print("\n✅ Migration completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Migration failed: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
