import os
import sys

# Add the parent directory to the Python path to allow imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from sqlalchemy import create_engine, text
from app.database import DATABASE_URL

def migrate():
    engine = create_engine(DATABASE_URL)
    with engine.connect() as connection:
        try:
            # Check if column exists
            result = connection.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='user_progress' AND column_name='is_bookmarked'"))
            if result.fetchone():
                print("Column 'is_bookmarked' already exists in 'user_progress'.")
            else:
                print("Adding 'is_bookmarked' column to 'user_progress' table...")
                connection.execute(text("ALTER TABLE user_progress ADD COLUMN is_bookmarked BOOLEAN DEFAULT FALSE"))
                connection.commit()
                print("Migration successful.")
        except Exception as e:
            print(f"Error during migration: {e}")

if __name__ == "__main__":
    migrate()
