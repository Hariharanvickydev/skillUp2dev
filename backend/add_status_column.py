"""
Migration script to add status column to important_questions table
Run this script to add the status column for the Question Approval Workflow
"""

import psycopg2
from psycopg2 import sql

# Database connection parameters
DB_CONFIG = {
    'dbname': 'skillup2dev',
    'user': 'ideas2it',
    'password': 'password',
    'host': 'localhost',
    'port': '5432'
}

def add_status_column():
    """Add status column to important_questions table"""
    conn = None
    try:
        # Connect to database
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        print("Adding status column to important_questions table...")
        
        # Add status column with default value
        cur.execute("""
            ALTER TABLE important_questions 
            ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'PUBLISHED';
        """)
        
        # Update existing records based on is_public flag
        # If is_public is True, set status to PUBLISHED
        # If is_public is False, set status to DRAFT
        cur.execute("""
            UPDATE important_questions 
            SET status = CASE 
                WHEN is_public = TRUE THEN 'PUBLISHED'
                ELSE 'DRAFT'
            END
            WHERE status = 'PUBLISHED';
        """)
        
        conn.commit()
        
        # Verify the column was added
        cur.execute("""
            SELECT column_name, data_type, column_default 
            FROM information_schema.columns 
            WHERE table_name = 'important_questions' AND column_name = 'status';
        """)
        
        result = cur.fetchone()
        if result:
            print(f"✓ Status column added successfully!")
            print(f"  Column: {result[0]}")
            print(f"  Type: {result[1]}")
            print(f"  Default: {result[2]}")
        else:
            print("✗ Failed to add status column")
        
        # Show count of records by status
        cur.execute("""
            SELECT status, COUNT(*) 
            FROM important_questions 
            GROUP BY status;
        """)
        
        print("\nCurrent status distribution:")
        for row in cur.fetchall():
            print(f"  {row[0]}: {row[1]} questions")
        
        cur.close()
        
    except Exception as e:
        print(f"Error: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    add_status_column()
