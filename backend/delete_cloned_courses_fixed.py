"""
Delete cloned courses with proper cascade handling.
This script handles the hierarchical topic structure correctly.
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app import models, database
from sqlalchemy import text

def main():
    db = next(database.get_db())
    
    try:
        # Get all cloned courses
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
        
        # Delete courses using raw SQL to handle cascades properly
        deleted_count = 0
        for course in cloned_courses:
            print(f"Deleting: {course.title}...")
            
            # Use raw SQL to delete with proper cascade
            # First delete all related data manually
            course_id = str(course.id)
            
            # Delete user progress
            db.execute(text("DELETE FROM user_progress WHERE course_id = :course_id"), {"course_id": course_id})
            
            # Delete exam attempts (via exams)
            db.execute(text("""
                DELETE FROM exam_attempts 
                WHERE exam_id IN (SELECT id FROM exams WHERE course_id = :course_id)
            """), {"course_id": course_id})
            
            # Delete exams
            db.execute(text("DELETE FROM exams WHERE course_id = :course_id"), {"course_id": course_id})
            
            # Delete important questions
            db.execute(text("DELETE FROM important_questions WHERE course_id = :course_id"), {"course_id": course_id})
            
            # Delete topic contents (for all topics in this course)
            db.execute(text("""
                DELETE FROM topic_contents 
                WHERE topic_id IN (SELECT id FROM topics WHERE course_id = :course_id)
            """), {"course_id": course_id})
            
            # Delete child topics first (topics with parent_topic_id)
            db.execute(text("""
                DELETE FROM topics 
                WHERE course_id = :course_id AND parent_topic_id IS NOT NULL
            """), {"course_id": course_id})
            
            # Delete parent topics (modules)
            db.execute(text("""
                DELETE FROM topics 
                WHERE course_id = :course_id AND parent_topic_id IS NULL
            """), {"course_id": course_id})
            
            # Delete course assignments
            db.execute(text("DELETE FROM course_assignments WHERE course_id = :course_id"), {"course_id": course_id})
            
            # Finally delete the course
            db.execute(text("DELETE FROM courses WHERE id = :course_id"), {"course_id": course_id})
            
            deleted_count += 1
        
        db.commit()
        print(f"\n✅ Successfully deleted {deleted_count} cloned courses and all related data!")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        db.rollback()
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    main()
