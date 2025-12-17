import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app import models, database
from sqlalchemy import text

def main():
    db = next(database.get_db())
    
    try:
        # Find the GE3151 course
        course = db.query(models.Course).filter(
            models.Course.title.contains("GE3151")
        ).first()
        
        if not course:
            print("No GE3151 course found!")
            return
        
        print(f"Found course: {course.title}")
        print(f"Course ID: {course.id}")
        
        # Count topics
        topic_count = db.query(models.Topic).filter(
            models.Topic.course_id == course.id
        ).count()
        print(f"Topics: {topic_count}")
        
        course_id = str(course.id)
        
        print("\nDeleting course and all related data...")
        
        # Delete topic contents first
        db.execute(
            text("DELETE FROM topic_contents WHERE topic_id IN (SELECT id FROM topics WHERE course_id = :course_id)"),
            {"course_id": course_id}
        )
        
        # Delete topics (handles parent-child relationships)
        db.execute(
            text("UPDATE topics SET parent_topic_id = NULL WHERE course_id = :course_id"),
            {"course_id": course_id}
        )
        db.execute(
            text("DELETE FROM topics WHERE course_id = :course_id"),
            {"course_id": course_id}
        )
        
        # Delete the course
        db.execute(
            text("DELETE FROM courses WHERE id = :course_id"),
            {"course_id": course_id}
        )
        
        db.commit()
        
        print(f"✅ Successfully deleted GE3151 course!")
        print("\nNow run the seeder script to create it with correct status:")
        print("  python3 scripts/seed_courses/ge3151_python_programming.py")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        db.rollback()
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
