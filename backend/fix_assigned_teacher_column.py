
import os
import sys
from sqlalchemy import create_engine, text

# Add parent directory to path to import app modules if needed
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv

load_dotenv()
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://ideas2it:password@localhost:5432/skillup2dev")

def add_assigned_teacher_column():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    with engine.connect() as conn:
        print("Checking for assigned_teacher_id column in courses table...")
        try:
            # Check if column exists
            result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='courses' AND column_name='assigned_teacher_id'"))
            if result.fetchone():
                print("Column 'assigned_teacher_id' already exists.")
            else:
                print("Adding 'assigned_teacher_id' column...")
                conn.execute(text("ALTER TABLE courses ADD COLUMN assigned_teacher_id UUID REFERENCES users(id)"))
                conn.commit()
                print("Column added successfully.")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    add_assigned_teacher_column()
