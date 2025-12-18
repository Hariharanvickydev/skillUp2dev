import sys
import os
from uuid import UUID

# Add backend directory to python path
sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))

from app import models, database, auth

def create_student():
    db = next(database.get_db())
    
    # 1. Get Org ID from Admin
    emails = ["hariharan@klu.com", "hariharan@aaa.com"]
    admin = None
    for e in emails:
        admin = db.query(models.User).filter(models.User.email == e).first()
        if admin:
            break
            
    if not admin:
        print("Error: Could not find Org Admin (Hariharan). cannot assign student to org.")
        return

    org_id = admin.organization_id
    print(f"Assigning Student to Org ID: {org_id} ({admin.organization.name if admin.organization else 'Unknown'})")

    # 2. Check/Create Student
    student_email = "student@skillup2dev.com"
    student = db.query(models.User).filter(models.User.email == student_email).first()
    
    if student:
        print(f"Student {student_email} already exists.")
        # Ensure org matches
        if student.organization_id != org_id:
             print(f"Updating Org ID from {student.organization_id} to {org_id}...")
             student.organization_id = org_id
             db.commit()
    else:
        print(f"Creating new student: {student_email}")
        hashed_pwd = auth.hash_password("password123")
        new_student = models.User(
            email=student_email,
            full_name="Test Student",
            password_hash=hashed_pwd,
            role=models.UserRole.STUDENT,
            organization_id=org_id,
            is_active=True
        )
        db.add(new_student)
        db.commit()
        db.refresh(new_student)
        print("Student created successfully.")
    
    print("\ncredentials:")
    print(f"Email: {student_email}")
    print("Password: password123")

if __name__ == "__main__":
    create_student()
