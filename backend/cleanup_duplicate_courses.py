from backend.app import database, models
import uuid

def delete_duplicates():
    db = next(database.get_db())
    
    # IDs identified from previous inspection
    ids_to_delete = [
        "10144aef-5e59-4ac8-b275-096fee6794e8",
        "b3cf5a97-9635-4e37-8e7e-bab295fc28b2"
    ]
    
    print(f"Attempting to delete {len(ids_to_delete)} duplicate courses...")
    
    deleted_count = 0
    for cid in ids_to_delete:
        course_id = uuid.UUID(cid)
        course = db.query(models.Course).filter(models.Course.id == course_id).first()
        
        if course:
            print(f"Deleting course: {course.title} ({course.id})")
            
            # 1. Delete Topic Content (Leaf nodes)
            # Find all topics for this course
            topics = db.query(models.Topic).filter(models.Topic.course_id == course_id).all()
            topic_ids = [t.id for t in topics]
            
            if topic_ids:
                db.query(models.TopicContent).filter(
                    models.TopicContent.topic_id.in_(topic_ids)
                ).delete(synchronize_session=False)
            
            # 2. Delete Child Topics (Sub-topics)
            db.query(models.Topic).filter(
                models.Topic.course_id == course_id,
                models.Topic.parent_topic_id.isnot(None)
            ).delete(synchronize_session=False)
            
            # 3. Delete Parent Topics (Modules)
            db.query(models.Topic).filter(
                models.Topic.course_id == course_id
            ).delete(synchronize_session=False)
            
            # 4. Delete Course
            db.delete(course)
            deleted_count += 1
            db.commit() # Commit per course
        else:
            print(f"Course not found: {cid}")
            
    print(f"Successfully deleted {deleted_count} courses.")

if __name__ == "__main__":
    try:
        delete_duplicates()
    except Exception as e:
        print(f"Error: {e}")
