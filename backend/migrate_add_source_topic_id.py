
import os
import psycopg2
from urllib.parse import urlparse

# Get Database URL
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://ideas2it@localhost:5432/skillup2dev")

def migrate():
    print(f"Connecting to {DATABASE_URL}...")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        cur = conn.cursor()
        
        # Check if column exists
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='topics' AND column_name='source_topic_id';
        """)
        
        if cur.fetchone():
            print("Column 'source_topic_id' already exists in 'topics' table.")
        else:
            print("Adding 'source_topic_id' column to 'topics' table...")
            cur.execute("ALTER TABLE topics ADD COLUMN source_topic_id UUID;")
            print("Migration successful: source_topic_id added.")
            
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"Migration failed: {e}")

if __name__ == "__main__":
    migrate()
