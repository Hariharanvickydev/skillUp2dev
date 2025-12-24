"""
Delete cloned courses (courses with parent_course_id set).
This script will delete all courses that were imported from the library.
"""

import sys
import os

# Add backend/app directory to sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app import models, database
from sqlalchemy.orm import Session

def main():
    db = next(database.get_db())
    
    try:
        # Get all cloned courses (courses with parent_course_id)
        cloned_courses = db.query(models.Course).filter(
            models.Course.parent_course_id.isnot(None),
            models.Course.is_library_course == False
        ).all()
        
        print(f"\n{'='*60}")
        print(f"Found {len(cloned_courses)} cloned courses:")
        print(f"{'='*60}\n")
        
        if not cloned_courses:
            print("✓ No cloned courses found!")
            return
        
        for i, course in enumerate(cloned_courses, 1):
            # Get organization name
            if course.organization_id:
                org = db.query(models.Organization).filter(
                    models.Organization.id == course.organization_id
                ).first()
                org_name = org.name if org else "Unknown Org"
            else:
                org_name = "No Org"
            
            # Get creator name
            if course.creator_id:
                creator = db.query(models.User).filter(
                    models.User.id == course.creator_id
                ).first()
                creator_name = creator.full_name if creator and creator.full_name else (creator.email if creator else "Unknown")
            else:
                creator_name = "Unknown"
            
            print(f"{i}. {course.title}")
            print(f"   Organization: {org_name}")
            print(f"   Created by: {creator_name}")
            print(f"   Status: {course.status}")
            print(f"   ID: {course.id}")
            print()
        
        print(f"{'='*60}")
        confirm = input("\n⚠️  Delete ALL these courses? Type 'DELETE' to confirm: ")
        
        if confirm != 'DELETE':
            print("\n❌ Deletion cancelled.")
            return
        
        # Delete all cloned courses
        deleted_count = 0
        for course in cloned_courses:
            print(f"Deleting: {course.title}...")
            # Topics, content, exams will be deleted automatically due to CASCADE
            db.delete(course)
            deleted_count += 1
        
        db.commit()
        print(f"\n✅ Successfully deleted {deleted_count} cloned courses!")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        db.rollback()
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    main()
