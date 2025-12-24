"""
Database migration script for Exam Module Refactor
Adds exam_status and owner_type enums to exams table

Run with: python migrate_exam_schema.py
"""

import sys
sys.path.insert(0, '/Users/ideas2it/Documents/AI agent/backend')

from app import database, models
from sqlalchemy import text

def migrate():
    db = next(database.get_db())
    
    try:
        print("🔄 Starting exam schema migration...")
        
        # Step 1: Create enum types
        print("\n1️⃣ Creating enum types...")
        db.execute(text("""
            DO $$ BEGIN
                CREATE TYPE exam_status AS ENUM ('DRAFT', 'ACTIVE', 'DISABLED', 'ARCHIVED');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        """))
        
        db.execute(text("""
            DO $$ BEGIN
                CREATE TYPE owner_type AS ENUM ('STUDENT', 'TEACHER', 'SYSTEM');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        """))
        db.commit()
        print("   ✅ Enum types created")
        
        # Step 2: Add columns
        print("\n2️⃣ Adding new columns...")
        db.execute(text("""
            ALTER TABLE exams 
            ADD COLUMN IF NOT EXISTS exam_status exam_status DEFAULT 'DRAFT',
            ADD COLUMN IF NOT EXISTS owner_type owner_type DEFAULT 'STUDENT';
        """))
        db.commit()
        print("   ✅ Columns added")
        
        # Step 3: Migrate existing data - Set status based on is_published
        print("\n3️⃣ Migrating existing exam statuses...")
        result = db.execute(text("""
            UPDATE exams 
            SET exam_status = CASE 
                WHEN is_published = true THEN 'ACTIVE'::exam_status
                ELSE 'DRAFT'::exam_status
            END
            WHERE exam_status = 'DRAFT';
        """))
        db.commit()
        print(f"   ✅ Updated {result.rowcount} exam statuses")
        
        # Step 4: Set owner_type based on creator role
        print("\n4️⃣ Setting owner types...")
        result = db.execute(text("""
            UPDATE exams e
            SET owner_type = CASE 
                WHEN u.role = 'STUDENT' THEN 'STUDENT'::owner_type
                WHEN u.role IN ('TEACHER', 'ORG_ADMIN', 'DEPT_HEAD') THEN 'TEACHER'::owner_type
                ELSE 'SYSTEM'::owner_type
            END
            FROM users u
            WHERE e.created_by_user_id = u.id
            AND e.owner_type = 'STUDENT';
        """))
        db.commit()
        print(f"   ✅ Updated {result.rowcount} owner types")
        
        # Step 5: Create indexes
        print("\n5️⃣ Creating indexes...")
        db.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_exams_status ON exams(exam_status);
        """))
        db.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_exams_owner_type ON exams(owner_type);
        """))
        db.commit()
        print("   ✅ Indexes created")
        
        # Step 6: Verify migration
        print("\n6️⃣ Verifying migration...")
        result = db.execute(text("""
            SELECT 
                exam_status,
                owner_type,
                COUNT(*) as count
            FROM exams
            GROUP BY exam_status, owner_type
            ORDER BY exam_status, owner_type;
        """))
        
        print("\n   📊 Exam Distribution:")
        for row in result:
            print(f"      {row.exam_status} / {row.owner_type}: {row.count} exams")
        
        print("\n✅ Migration completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Migration failed: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
