import sys
import os

# Add backend/app directory to sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app import models, database
from sqlalchemy.orm import Session

def main():
    db = next(database.get_db())
    
    # Find TEACHER users
    teachers = db.query(models.User).filter(models.User.role == models.UserRole.TEACHER).all()
    
    if not teachers:
        print("No TEACHER users found!")
        return
        
    for teacher in teachers:
        print(f"\nTeacher: {teacher.full_name} ({teacher.email})")
        print(f"  ID: {teacher.id}")
        
        # Find courses assigned to this teacher
        assigned_courses = db.query(models.Course).filter(
            models.Course.assigned_teacher_id == teacher.id
        ).all()
        
        print(f"  Assigned Courses: {len(assigned_courses)}")
        if assigned_courses:
            for course in assigned_courses:
                print(f"    - {course.title} (ID: {course.id})")
        else:
            print(f"    (No courses assigned)")

if __name__ == "__main__":
    main()
