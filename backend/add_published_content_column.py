from sqlalchemy import create_engine, text
import os

# Database URL (adjust if needed)
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/dbname") # Replace with actual logic or env var if known, usually provided in context or I can assume standard setup. 
# Looking at previous interactions, I can see I shouldn't guess, but I can use the existing `database.py` connection string if possible or just try standard generic logic for this script.
# Actually, I'll use the proper way: import verify_db_connection or similar if available, or just standard connection string.

# I will assume the standard connection string I've seen in other tasks or derived from environment.
# For now, I'll use a generic safe approach that tries to load env or defaults.
from app.database import engine

def add_column():
    with engine.connect() as conn:
        try:
            # Check if column exists
            result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='important_questions' AND column_name='published_content'"))
            if result.fetchone():
                print("Column 'published_content' already exists.")
            else:
                print("Adding 'published_content' column...")
                conn.execute(text("ALTER TABLE important_questions ADD COLUMN published_content JSON"))
                print("Column added.")
            
            # Backfill
            print("Backfilling published_content...")
            conn.execute(text("UPDATE important_questions SET published_content = content WHERE is_public = true AND published_content IS NULL"))
            conn.commit()
            print("Backfill complete.")
            
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    add_column()
