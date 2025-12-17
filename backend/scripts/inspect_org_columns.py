
import sys
import os
from sqlalchemy import create_engine, inspect, text

# Add parent dir to path to find app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import Base, engine, get_db

def inspect_columns():
    inspector = inspect(engine)
    columns = inspector.get_columns('organizations')
    print("Columns in 'organizations' table:")
    found_cols = []
    for column in columns:
        print(f"- {column['name']} ({column['type']})")
        found_cols.append(column['name'])
    
    expected = [
        'max_students', 'max_teachers', 'max_courses', 
        'storage_limit_gb', 'storage_used_gb', 
        'ai_credits_limit', 'ai_credits_used'
    ]
    
    print("\nMissing expected columns:")
    for col in expected:
        if col not in found_cols:
            print(f"- {col}")

if __name__ == "__main__":
    inspect_columns()
