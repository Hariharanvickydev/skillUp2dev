
import sys
import os

# Add parent directory to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.database import engine
from sqlalchemy import text

def migrate():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE topics ADD COLUMN last_synced_at TIMESTAMP"))
            conn.commit()
            print("Successfully added last_synced_at column to topics table")
        except Exception as e:
            print(f"Error (column might already exist): {e}")

if __name__ == "__main__":
    migrate()
