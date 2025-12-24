from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv
import sys

# Add backend directory to python path
sys.path.append('/Users/ideas2it/Documents/AI agent/backend')
from app.database import SessionLocal, engine

load_dotenv()

def check_new_course_state():
    db = SessionLocal()
    try:
        # Get the most recent course
        course_sql = text("SELECT id, title, created_at FROM courses ORDER BY created_at DESC LIMIT 1")
        course = db.execute(course_sql).fetchone()
        
        if not course:
            print("No courses found!")
            return

        print(f"Checking Most Recent Course: {course.title} (ID: {course.id})")
        
        # Get topics
        topics_sql = text("SELECT id, title, status FROM topics WHERE course_id = :cid")
        topics = db.execute(topics_sql, {"cid": course.id}).fetchall()
        
        print(f"Found {len(topics)} topics.")
        
        for topic in topics:
            print(f"\nTopic: {topic.title} | Status: {topic.status}")
            
            # Check content
            content_sql = text("SELECT id, length(content) as draft_len, length(approved_content) as app_len FROM topic_contents WHERE topic_id = :tid")
            content = db.execute(content_sql, {"tid": topic.id}).fetchone()
            
            if content:
                print(f"  -> Draft Content Length: {content.draft_len}")
                print(f"  -> Approved Content Length: {content.app_len}")
                if content.app_len is None or content.app_len == 0:
                    print("  -> WARNING: APPROVED CONTENT IS EMPTY!")
            else:
                print("  -> NO CONTENT RECORD FOUND!")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_new_course_state()
