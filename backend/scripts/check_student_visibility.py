import sys
import os

# Add the parent directory to sys.path to resolve imports content
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import models, database
from sqlalchemy.orm import Session

def check_visibility():
    db = database.SessionLocal()
    try:
        # 1. Get Student
        student = db.query(models.User).filter(models.User.email == "student@skillup2dev.com").first()
        if not student:
            print("❌ Student 'student@skillup2dev.com' NOT FOUND.")
            return
        
        print(f"✅ Student Found: {student.full_name} (ID: {student.id})")
        print(f"👉 Student Org ID: {student.organization_id}")
        
        # 2. Get Courses in that Org
        courses = db.query(models.Course).filter(models.Course.organization_id == student.organization_id).all()
        
        print("\n📚 Courses in Student's Org:")
        found_visible = False
        for c in courses:
            status_emoji = "🟢" if c.status in ["PUBLISHED", "PARTIALLY_PUBLISHED"] else "🔴"
            print(f"{status_emoji} [{c.status}] {c.title} (ID: {c.id})")
            if c.status in ["PUBLISHED", "PARTIALLY_PUBLISHED"]:
                found_visible = True
        
        if not courses:
            print("⚠️ No courses found in this organization.")

        if courses and not found_visible:
            print("\n❌ PROBLEM: Courses exist but none are PUBLISHED.")
            print("👉 Please log in as Org Admin/HOD and set status to Published.")

        if found_visible:
             print("\n✅ SUCCESS: There are visible courses. Frontend should show them.")
             
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_visibility()
