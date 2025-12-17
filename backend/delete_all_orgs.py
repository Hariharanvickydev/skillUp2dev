
import os
import sys

# Force Postgres
os.environ["DATABASE_URL"] = "postgresql://ideas2it@localhost:5432/skillup2dev"

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import models, database
from sqlalchemy.orm import Session
from sqlalchemy import text

def delete_all_orgs():
    db = database.SessionLocal()
    try:
        print("⚠ WARNING: This will delete ALL organizations and their associated data (Departments, etc).")
        
        # 1. Delete Users associated with Orgs first (to verify/ensure clean slate)
        # We assume users with organization_id are org members.
        deleted_users = db.query(models.User).filter(models.User.organization_id.isnot(None)).delete(synchronize_session=False)
        print(f"Deleted {deleted_users} users associated with organizations.")
        
        # 2. Delete Organizations (Departments should cascade via SQLAlchemy relationship if loaded, or DB FK)
        # Using simple delete from ORM
        deleted_orgs = db.query(models.Organization).delete(synchronize_session=False)
        print(f"Deleted {deleted_orgs} organizations.")
        
        db.commit()
        print("✅ Database cleaned of all organizations.")

    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    delete_all_orgs()
