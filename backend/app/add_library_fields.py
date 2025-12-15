from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os

# Try to get DB URL from env, else defaults
# Note: In this env, we might need to be specific if 'localhost' vs 'db'
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://ideas2it@localhost/skillup2dev")

def add_columns():
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        try:
            print("Adding 'category' column...")
            conn.execute(text("ALTER TABLE courses ADD COLUMN IF NOT EXISTS category VARCHAR;"))
            
            print("Adding 'tags' column...")
            conn.execute(text("ALTER TABLE courses ADD COLUMN IF NOT EXISTS tags JSON DEFAULT '[]';"))
            
            print("Adding 'difficulty' column...")
            conn.execute(text("ALTER TABLE courses ADD COLUMN IF NOT EXISTS difficulty VARCHAR DEFAULT 'Beginner';"))
            
            print("Adding 'outcomes' column...")
            conn.execute(text("ALTER TABLE courses ADD COLUMN IF NOT EXISTS outcomes JSON DEFAULT '[]';"))
            
            conn.commit()
            print("Successfully added new columns to 'courses' table.")
        except Exception as e:
            print(f"Error adding columns: {e}")
            conn.rollback()

if __name__ == "__main__":
    add_columns()
