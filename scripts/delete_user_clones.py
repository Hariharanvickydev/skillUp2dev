
import sys
import os

# Add parent directory to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.database import engine, SessionLocal
from backend.app import models

def delete_clones():
    db = SessionLocal()
    try:
        user_email = "hariharan@klu.com"
        user = db.query(models.User).filter(models.User.email == user_email).first()
        
        if not user:
            print(f"User {user_email} not found.")
            return

        print(f"Found User: {user.full_name} ({user.id})")

        # Find cloned courses (have parent_course_id) created by this user or in their org?
        # User implies "their" cloned course.
        courses = db.query(models.Course).filter(
            models.Course.creator_id == user.id,
            models.Course.parent_course_id.isnot(None)
        ).all()
        
        if not courses:
            print("No cloned courses found for this user.")
            
            print(f"Deleting Course: {course.title} (ID: {course.id})")
            
            # Manual Cleanup to avoid FK issues
            # 1. Delete Exams
            db.query(models.Exam).filter(models.Exam.course_id == course.id).delete()
            
            # 2. Delete Topic Content
            # Get all topic IDs
            topic_ids = [t.id for t in course.topics]
            if topic_ids:
                db.query(models.TopicContent).filter(models.TopicContent.topic_id.in_(topic_ids)).delete(synchronize_session=False)

            # 3. Delete Subtopics (those with parent_topic_id)
            db.query(models.Topic).filter(
                models.Topic.course_id == course.id,
                models.Topic.parent_topic_id.isnot(None)
            ).delete(synchronize_session=False)
            
            # 4. Delete Parent Topics
            db.query(models.Topic).filter(
                models.Topic.course_id == course.id
            ).delete(synchronize_session=False)
            
            # 5. Finally Delete Course
            db.delete(course)
            
        db.commit()
        print("Cleanup complete.")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    delete_clones()
