import sys
import os

# Add backend/app directory to sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app import models, database
from sqlalchemy.orm import Session

def main():
    db = next(database.get_db())
    
    # Find the specific teacher
    teacher = db.query(models.User).filter(
        models.User.email == "cs_teacher_one@skillup2dev.com"
    ).first()
    
    if not teacher:
        print("Teacher not found!")
        return
        
    print(f"Teacher: {teacher.full_name} ({teacher.email})")
    print(f"  ID: {teacher.id}")
    
    # Method 1: Check assigned_teacher_id (primary assignment)
    assigned_primary = db.query(models.Course).filter(
        models.Course.assigned_teacher_id == teacher.id
    ).all()
    
    print(f"\n  Courses via assigned_teacher_id: {len(assigned_primary)}")
    if assigned_primary:
        for course in assigned_primary:
            print(f"    - {course.title} (ID: {course.id})")
    
    # Method 2: Check assignees (M2M relationship)
    # Need to check if teacher is in the assignees list
    all_courses = db.query(models.Course).all()
    assigned_m2m = []
    for course in all_courses:
        if teacher in course.assignees:
            assigned_m2m.append(course)
    
    print(f"\n  Courses via assignees (M2M): {len(assigned_m2m)}")
    if assigned_m2m:
        for course in assigned_m2m:
            print(f"    - {course.title} (ID: {course.id})")
    
    # Check what the backend endpoint would return
    print(f"\n  Total courses (both methods): {len(set(assigned_primary + assigned_m2m))}")

if __name__ == "__main__":
    main()
