
import os
import sys
from sqlalchemy import create_engine, text

# Get URL from env or default
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/dbname") # Replace with actual if known or use env

# Since I don't know the exact env in this shell, I'll try to load it from a .env file or assume typical local dev defaults if not present.
# However, usually the agent environment has access to the app's config. 
# I will try to import the database config from app.database if possible.

sys.path.append(os.path.join(os.getcwd(), "backend"))
from app.database import engine

def add_column():
    with engine.connect() as conn:
        try:
            print("Attempting to add source_question_id to important_questions table...")
            conn.execute(text("ALTER TABLE important_questions ADD COLUMN IF NOT EXISTS source_question_id UUID"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_important_questions_source_id ON important_questions (source_question_id)"))
            conn.commit()
            print("Column added successfully.")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    add_column()
