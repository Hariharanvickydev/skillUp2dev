import sys
import os

# Add backend/app directory to sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app import models, database
from sqlalchemy import delete, text

def main():
    db = next(database.get_db())
    
    try:
        # Get all cloned course IDs
        cloned_courses = db.query(models.Course).filter(
            models.Course.is_library_course == False,
            models.Course.organization_id != None
        ).all()
        
        print(f"\nFound {len(cloned_courses)} cloned courses to delete:")
        
        if not cloned_courses:
            print("No cloned courses found!")
            return
        
        course_ids = []
        for course in cloned_courses:
            print(f"  - {course.title} (ID: {course.id})")
            course_ids.append(str(course.id))
        
        print("\nDeleting all related data...")
        
        # Step 1: Delete course_assignments (M2M relationship)
        assignments_deleted = db.execute(
            text("DELETE FROM course_assignments WHERE course_id IN :ids"),
            {"ids": tuple(course_ids)}
        ).rowcount
        print(f"  Deleted {assignments_deleted} course assignments")
        
        # Step 2: Delete topic content
        db.execute(
            text("DELETE FROM topic_contents WHERE topic_id IN (SELECT id FROM topics WHERE course_id IN :ids)"),
            {"ids": tuple(course_ids)}
        )
        print(f"  Deleted topic contents")
        
        # Step 3: Delete topics (need to handle parent_topic_id)
        # First nullify parent_topic_id references
        db.execute(
            text("UPDATE topics SET parent_topic_id = NULL WHERE course_id IN :ids"),
            {"ids": tuple(course_ids)}
        )
        # Then delete all topics
        topics_deleted = db.execute(
            text("DELETE FROM topics WHERE course_id IN :ids"),
            {"ids": tuple(course_ids)}
        ).rowcount
        print(f"  Deleted {topics_deleted} topics")
        
        # Step 4: Delete courses
        courses_deleted = db.execute(
            text("DELETE FROM courses WHERE id IN :ids"),
            {"ids": tuple(course_ids)}
        ).rowcount
        print(f"  Deleted {courses_deleted} courses")
        
        db.commit()
        print(f"\n✅ Successfully deleted all cloned courses and their data!")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        db.rollback()
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
