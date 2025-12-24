from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv
import sys

# Add backend directory to python path to allow imports
sys.path.append('/Users/ideas2it/Documents/AI agent/backend')
from app.database import SessionLocal, engine

load_dotenv()

# The course ID provided by the user in the URL (Updated for fresh run)
COURSE_ID = 'f4911dd4-34d3-4dd4-a953-a9c40ac69289'

def delete_course_data():
    db = SessionLocal()
    try:
        print(f"Attempting to delete course: {COURSE_ID}")
        
        # We need to verify it exists first
        check_sql = text("SELECT id, title FROM courses WHERE id = :cid")
        course = db.execute(check_sql, {"cid": COURSE_ID}).fetchone()
        
        if not course:
            print("Course not found!")
            return

        print(f"Found course: {course.title}")
        
        # Cascading deletes might be handled by foreign keys, but to be safe and clean:
        
        # 1. Delete Topic Contents
        # need to find topics first
        topics_sql = text("SELECT id FROM topics WHERE course_id = :cid")
        topics = db.execute(topics_sql, {"cid": COURSE_ID}).fetchall()
        topic_ids = [str(t.id) for t in topics]
        
        if topic_ids:
            print(f"Found {len(topic_ids)} topics. Deleting their content...")
            # Using raw SQL for safety if ORM is complex
            # Note: Tuple syntax for IN clause needs handling for single item
            if len(topic_ids) == 1:
                t_ids_tuple = f"('{topic_ids[0]}')"
            else:
                t_ids_tuple = tuple(topic_ids)
            
            del_content_sql = text(f"DELETE FROM topic_contents WHERE topic_id IN {t_ids_tuple}")
            db.execute(del_content_sql)
            
            # 2. Delete Exam Attempts and Exams related to these topics
            print("Deleting exam attempts and exams...")
            # We need to find exam IDs first to delete attempts
            exams_query = text(f"SELECT id FROM exams WHERE topic_id IN {t_ids_tuple}")
            exams_res = db.execute(exams_query).fetchall()
            exam_ids = [str(e.id) for e in exams_res]
            
            if exam_ids:
                if len(exam_ids) == 1:
                    e_ids_tuple = f"('{exam_ids[0]}')"
                else:
                    e_ids_tuple = tuple(exam_ids)
                
                print(f"Deleting attempts for {len(exam_ids)} exams...")
                del_attempts_sql = text(f"DELETE FROM exam_attempts WHERE exam_id IN {e_ids_tuple}")
                db.execute(del_attempts_sql)

            # Now delete exams
            del_exams_sql = text(f"DELETE FROM exams WHERE topic_id IN {t_ids_tuple}")
            db.execute(del_exams_sql)
            
            # 3. Delete Topics
            print("Deleting topics...")
            del_topics_sql = text("DELETE FROM topics WHERE course_id = :cid")
            db.execute(del_topics_sql, {"cid": COURSE_ID})

        # 4. Delete Course Assignments
        print("Deleting course assignments...")
        del_assign_sql = text("DELETE FROM course_assignments WHERE course_id = :cid")
        db.execute(del_assign_sql, {"cid": COURSE_ID})

        # 5. Delete Course
        print("Deleting course...")
        del_course_sql = text("DELETE FROM courses WHERE id = :cid")
        db.execute(del_course_sql, {"cid": COURSE_ID})
        
        db.commit()
        print("Successfully deleted course and all related data.")

    except Exception as e:
        print(f"Error deleting course: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    delete_course_data()
