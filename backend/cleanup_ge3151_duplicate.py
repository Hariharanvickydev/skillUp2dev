import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app import models, database
from sqlalchemy import text

def main():
    db = next(database.get_db())
    
    try:
        # Find all GE3151 courses
        courses = db.query(models.Course).filter(
            models.Course.title.contains("GE3151")
        ).all()
        
        print(f"Found {len(courses)} GE3151 courses:\n")
        
        course_info = []
        for course in courses:
            # Count topics
            topic_count = db.query(models.Topic).filter(
                models.Topic.course_id == course.id
            ).count()
            
            course_info.append({
                'course': course,
                'topic_count': topic_count
            })
            
            print(f"Course: {course.title}")
            print(f"  ID: {course.id}")
            print(f"  Topics: {topic_count}")
            print(f"  Created: {course.created_at}")
            print()
        
        # Find the course with fewer topics (26 modules = 20 topics + 6 modules)
        if len(course_info) >= 2:
            course_to_delete = min(course_info, key=lambda x: x['topic_count'])
            course_to_keep = max(course_info, key=lambda x: x['topic_count'])
            
            print(f"Will DELETE: {course_to_delete['course'].title} ({course_to_delete['topic_count']} topics)")
            print(f"Will KEEP: {course_to_keep['course'].title} ({course_to_keep['topic_count']} topics)")
            print()
            
            # Delete the course with fewer topics
            course_id = str(course_to_delete['course'].id)
            
            print("Deleting course and all related data...")
            
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
            
            print(f"\n✅ Successfully deleted course with {course_to_delete['topic_count']} topics!")
            print(f"✅ Kept course with {course_to_keep['topic_count']} topics")
            
        else:
            print("Not enough courses to compare. No action taken.")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        db.rollback()
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
