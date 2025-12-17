
import os
import sys

# Force Postgres
os.environ["DATABASE_URL"] = "postgresql://ideas2it@localhost:5432/skillup2dev"

# Add parent directory to path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import models, database
from sqlalchemy.orm import Session

def list_orgs():
    db = database.SessionLocal()
    try:
        orgs = db.query(models.Organization).all()
        print(f"Found {len(orgs)} organizations:")
        for o in orgs:
            print(f"ID: {o.id} | Name: {o.name} | Code: {o.code} | Status: {o.status}")
            print("-" * 40)
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    list_orgs()
