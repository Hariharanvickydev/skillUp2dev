import sys
import os

# Add backend/app directory to sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app import models, database
from sqlalchemy.orm import Session

def main():
    db = next(database.get_db())
    
    try:
        # Get all courses that are NOT from library (is_from_library = False or NULL)
        # These are the cloned/imported courses
        cloned_courses = db.query(models.Course).filter(
            models.Course.source != 'LIBRARY'  # Not library courses
        ).all()
        
        print(f"\nFound {len(cloned_courses)} cloned courses to delete:")
        
        if not cloned_courses:
            print("No cloned courses found!")
            return
        
        for course in cloned_courses:
            print(f"  - {course.title} (ID: {course.id}, Source: {course.source})")
        
        confirm = input("\nAre you sure you want to delete all these courses? (yes/no): ")
        
        if confirm.lower() != 'yes':
            print("Deletion cancelled.")
            return
        
        # Delete all cloned courses
        deleted_count = 0
        for course in cloned_courses:
            # Topics will be deleted automatically due to CASCADE
            db.delete(course)
            deleted_count += 1
        
        db.commit()
        print(f"\n✅ Successfully deleted {deleted_count} cloned courses!")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        db.rollback()
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
