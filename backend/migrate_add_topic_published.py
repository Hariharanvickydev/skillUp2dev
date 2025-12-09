"""
Database Migration: Add is_published to topics table

This migration adds the is_published column to the topics table
to enable module-wise publishing.

Usage:
    python migrate_add_topic_published.py
"""

import sqlite3
import os

def migrate():
    """Add is_published column to topics table"""
    # Try multiple possible database locations
    possible_paths = [
        "skillup2dev.db",
        "skillup.db",
        "app.db",
        "instance/app.db"
    ]
    
    db_path = None
    for path in possible_paths:
        if os.path.exists(path):
            db_path = path
            break
    
    if not db_path:
        print(f"❌ Database not found in any of these locations:")
        for path in possible_paths:
            print(f"   - {path}")
        print("   Please ensure the database exists before running migration.")
        return False
    
    print(f"🔄 Running migration on: {db_path}")
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if column already exists
        cursor.execute("PRAGMA table_info(topics)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'is_published' in columns:
            print("⏭️  Column 'is_published' already exists in topics table")
            print("   Migration already applied, skipping.")
            return True
        
        # Add the column
        print("📝 Adding 'is_published' column to topics table...")
        cursor.execute("""
            ALTER TABLE topics 
            ADD COLUMN is_published BOOLEAN DEFAULT 0
        """)
        
        conn.commit()
        print("✅ Migration completed successfully!")
        print("   Added 'is_published' column to topics table")
        print("   Default value: False (0)")
        
        # Show stats
        cursor.execute("SELECT COUNT(*) FROM topics")
        topic_count = cursor.fetchone()[0]
        print(f"\n📊 Updated {topic_count} existing topics")
        
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        conn.rollback()
        return False
    finally:
        conn.close()

if __name__ == "__main__":
    print("=" * 60)
    print("Database Migration: Add is_published to topics")
    print("=" * 60)
    print()
    
    success = migrate()
    
    print()
    if success:
        print("✅ Migration completed successfully!")
        print("   You can now use module-wise publishing.")
    else:
        print("❌ Migration failed!")
        print("   Please check the error messages above.")
    print("=" * 60)
