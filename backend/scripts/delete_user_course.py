
import sys
import os

# Add the parent directory to sys.path to allow imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app import models
from sqlalchemy import select

def delete_user_course(email):
    db = SessionLocal()
    try:
        # Find user
        stmt = select(models.User).where(models.User.email == email)
        user = db.execute(stmt).scalars().first()
        
        if not user:
            print(f"User with email {email} not found.")
            return

        print(f"Found user: {user.full_name} ({user.id})")

        # Find courses created by user
        stmt = select(models.Course).where(models.Course.creator_id == user.id)
        courses = db.execute(stmt).scalars().all()

        if not courses:
            print("No courses found for this user.")
            return

        print(f"Found {len(courses)} courses:")
        courses_to_delete = []
        for course in courses:
            print(f"- {course.title} (ID: {course.id}, Is Library: {course.is_library_course})")
            # Assuming we want to delete non-library courses (cloned ones)
            if not course.is_library_course:
                courses_to_delete.append(course)

        if not courses_to_delete:
            print("No cloned (non-library) courses found to delete.")
            return

        # Delete the courses
        for course in courses_to_delete:
            print(f"Deleting course: {course.title}...")
            
            # Break parent-child relationships in topics first
            print("  Breaking topic hierarchy...")
            stmt = select(models.Topic).where(models.Topic.course_id == course.id)
            topics = db.execute(stmt).scalars().all()
            for topic in topics:
                topic.parent_topic_id = None
            db.flush() # Flush changes to DB
            
            # Now delete the course (cascade should work)
            print("  Deleting course object...")
            db.delete(course)
        
        db.commit()
        print("Deletion complete.")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    email = "hariharan@klu.com"
    delete_user_course(email)
