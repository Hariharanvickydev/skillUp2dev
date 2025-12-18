import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import models, database, auth

def create_test_user():
    db = database.SessionLocal()
    try:
        # 1. Find the Org with the course
        target_org_id = "8e0c787d-8d7a-45b6-90c4-2947177d1354" # From my previous check
        
        email = "test_student@skillup2dev.com"
        
        # Check if exists
        user = db.query(models.User).filter(models.User.email == email).first()
        if user:
            print(f"User {email} already exists. Updating Org...")
            user.organization_id = target_org_id
        else:
            print(f"Creating new user {email}...")
            user = models.User(
                email=email,
                password_hash=auth.hash_password("password123"),
                full_name="Test Student",
                role=models.UserRole.STUDENT,
                organization_id=target_org_id,
                phone="1234567890",
                year=1,
                roll_number="TEST001"
            )
            db.add(user)
        
        db.commit()
        print("✅ User ready: test_student@skillup2dev.com / password123")
        print(f"Linked to Org: {target_org_id}")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_test_user()
