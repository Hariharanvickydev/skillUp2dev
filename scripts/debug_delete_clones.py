
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.database import engine, SessionLocal
from backend.app import models

def debug_delete():
    db = SessionLocal()
    try:
        user_email = "hariharan@klu.com"
        user = db.query(models.User).filter(models.User.email == user_email).first()
        
        if not user:
            print(f"User {user_email} not found.")
            return

        print(f"User: {user.full_name} ({user.id})")
        print(f"User Org ID: {user.organization_id}")
        
        if not user.organization_id:
            print("User has no organization.")
            return

        # Find clones by ORGANIZATION, not just creator
        courses = db.query(models.Course).filter(
            models.Course.organization_id == user.organization_id,
            models.Course.parent_course_id.isnot(None)
        ).all()
        
        print(f"Found {len(courses)} cloned courses for Org {user.organization_id}:")
        
        for course in courses:
            print(f" - [TO DELETE] {course.title} (ID: {course.id})")
            
            # --- Deletion Logic ---
            # 1. Delete Exams
            db.query(models.Exam).filter(models.Exam.course_id == course.id).delete()
            
            # 2. Delete Topic Content
            topic_ids = [t.id for t in course.topics]
            if topic_ids:
                db.query(models.TopicContent).filter(models.TopicContent.topic_id.in_(topic_ids)).delete(synchronize_session=False)

            # 3. Delete Subtopics
            db.query(models.Topic).filter(
                models.Topic.course_id == course.id,
                models.Topic.parent_topic_id.isnot(None)
            ).delete(synchronize_session=False)
            
            # 4. Delete Parent Topics
            db.query(models.Topic).filter(
                models.Topic.course_id == course.id
            ).delete(synchronize_session=False)
            
            # 5. Delete Course
            db.delete(course)
            
        if courses:
            db.commit()
            print("Successfully deleted all clones.")
        else:
            print("Nothing to delete.")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    debug_delete()
