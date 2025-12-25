
import json
import uuid
from app.database import SessionLocal
from app.models import ImportantQuestions, Course, User, UserRole
from sqlalchemy import text

def seed_data():
    db = SessionLocal()
    try:
        # 1. Get Admin User
        user = db.query(User).filter(User.role == UserRole.SUPER_ADMIN).first()
        if not user:
            user = db.query(User).first()
            if not user:
                print("No users found in database.")
                return
        
        user_id = user.id
        print(f"Using Creator ID: {user_id} ({user.email})")

        # 2. Get Course ID for GE3151
        course = db.query(Course).filter(Course.title.ilike('%GE3151%')).first()
        if not course:
            print("Course GE3151 not found.")
            return
        
        course_id = course.id
        print(f"Target Course: {course.title} ({course_id})")

        # 3. Read JSON Data
        json_path = "/Users/ideas2it/.gemini/antigravity/brain/462109e1-5b68-4393-b800-20142c250c75/GE3151_sample_questions.json"
        with open(json_path, 'r') as f:
            questions_data = json.load(f)

        print(f"Found {len(questions_data)} questions to import.")

        # 4. DELETE Existing Questions for this course (Reset)
        deleted = db.query(ImportantQuestions).filter(ImportantQuestions.course_id == course_id).delete()
        print(f"Deleted {deleted} existing questions for cleanup.")

        # 5. Insert Questions
        count = 0
        for q in questions_data:
            # Check if exists to avoid duplicates (optional, based on title)
            # existing = db.query(ImportantQuestions).filter(
            #     ImportantQuestions.course_id == course_id,
            #     ImportantQuestions.title == q['title']
            # ).first()
            
            # if existing:
            #     print(f"Skipping existing: {q['title']}")
            #     continue

            new_q = ImportantQuestions(
                id=uuid.uuid4(),
                title=q['title'],
                course_id=course_id,
                module_id=uuid.UUID(q['module_id']) if q.get('module_id') else None,
                created_by_user_id=user_id,
                content=q['content'],
                is_public=q.get('is_public', False)
            )
            db.add(new_q)
            count += 1

        db.commit()
        print(f"Successfully seeded {count} questions!")

    except Exception as e:
        print(f"Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
