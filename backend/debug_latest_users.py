
import os
import sys

# Force Postgres
os.environ["DATABASE_URL"] = "postgresql://ideas2it@localhost:5432/skillup2dev"

# Add parent directory to path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import models, database
from sqlalchemy.orm import Session

def list_latest_users():
    db = database.SessionLocal()
    try:
        users = db.query(models.User).order_by(models.User.created_at.desc()).limit(5).all()
        print(f"Found {len(users)} users. Listing latest 5:")
        for u in users:
            print(f"ID: {u.id} | Email: {u.email} | Role: {u.role} | OrgID: {u.organization_id} | Active: {u.is_active}")
            print(f"Pass Hash Start: {u.password_hash[:10]}...")
            print("-" * 40)
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    list_latest_users()
