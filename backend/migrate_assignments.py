from sqlalchemy import create_engine, text
from app.database import DATABASE_URL
from app.models import Base, Course, User, course_assignments
from sqlalchemy.orm import sessionmaker

def migrate():
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    print("Checking for course_assignments table...")
    
    # Create table if not exists
    Base.metadata.create_all(bind=engine)
    print("Ensured course_assignments table exists.")
    
    # Migrate existing assignments
    print("Migrating existing assigned_teacher_id to course_assignments...")
    courses = db.query(Course).filter(Course.assigned_teacher_id != None).all()
    
    count = 0
    for course in courses:
        # Check if already in association (to avoid duplicate PK error if re-run)
        # We can just access course.assignees and append if not present
        
        teacher = db.query(User).filter(User.id == course.assigned_teacher_id).first()
        if teacher:
            # Check if already assigned via M2M
            if teacher not in course.assignees:
                course.assignees.append(teacher)
                count += 1
    
    db.commit()
    print(f"Migrated {count} assignments.")
    db.close()

if __name__ == "__main__":
    migrate()
