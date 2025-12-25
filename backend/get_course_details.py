
from sqlalchemy import create_engine, text
from app.database import SessionLocal
import uuid

def get_ge3151_details():
    db = SessionLocal()
    try:
        # Find Course
        result = db.execute(text("SELECT id, title FROM courses WHERE title LIKE '%GE3151%'"))
        courses = result.fetchall()
        
        if not courses:
            print("No course found for GE3151")
            return

        course_id = courses[0][0]
        course_title = courses[0][1]
        print(f"Course: {course_title} ({course_id})")

        # Find Topics for this course
        # Assuming topics table has course_id
        result = db.execute(text(f"SELECT id, title FROM topics WHERE course_id = '{course_id}' AND parent_topic_id IS NULL"))
        topics = result.fetchall()
        
        print("\nModules:")
        for t in topics:
            print(f"- {t[1]}: {t[0]}")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    get_ge3151_details()
