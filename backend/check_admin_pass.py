
import os
import sys

# Force Postgres
os.environ["DATABASE_URL"] = "postgresql://ideas2it@localhost:5432/skillup2dev"

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import models, database, auth
from sqlalchemy.orm import Session

def check_admin():
    db = database.SessionLocal()
    try:
        email = "admin@skillup2dev.com"
        password = "admin123"
        
        user = db.query(models.User).filter(models.User.email == email).first()
        
        if not user:
            print(f"❌ User {email} not found!")
            return

        print(f"User found: {user.email} (Role: {user.role})")
        print(f"Stored Hash: {user.password_hash}")
        
        is_valid = auth.verify_password(password, user.password_hash)
        
        if is_valid:
            print(f"✅ Password '{password}' is CORRECT.")
        else:
            print(f"❌ Password '{password}' is INCORRECT.")
            
            # Reset it
            print("Resetting password to 'admin123'...")
            new_hash = auth.hash_password(password)
            user.password_hash = new_hash
            db.commit()
            print("✅ Password reset successful.")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_admin()
