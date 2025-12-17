from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import User, Course, Topic, Exam, ImportantQuestions, Base
from app.database import DATABASE_URL
import sys

def delete_cloned_courses(email):
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        user = session.query(User).filter(User.email == email).first()
        if not user:
            print(f"User {email} not found.")
            return

        print(f"User belongs to Organization ID: {user.organization_id}")

        # Find cloned courses
        cloned_courses = session.query(Course).filter(
            Course.organization_id == user.organization_id,
            Course.parent_course_id.isnot(None)
        ).all()

        if not cloned_courses:
            print("No cloned courses found.")
            return

        print(f"Found {len(cloned_courses)} cloned courses. cleaning up...")

        for course in cloned_courses:
            print(f"Processing Course: {course.title} ({course.id})")

            # 1. Delete Exams
            exams = session.query(Exam).filter(Exam.course_id == course.id).all()
            for e in exams:
                session.delete(e)
            print(f" - Deleted {len(exams)} exams.")

            # 2. Delete Important Questions
            iqs = session.query(ImportantQuestions).filter(ImportantQuestions.course_id == course.id).all()
            for iq in iqs:
                session.delete(iq)
            print(f" - Deleted {len(iqs)} IQ sets.")

            # 3. Delete Subtopics (Children)
            subtopics = session.query(Topic).filter(
                Topic.course_id == course.id, 
                Topic.parent_topic_id.isnot(None)
            ).all()
            for t in subtopics:
                session.delete(t)
            print(f" - Deleted {len(subtopics)} subtopics.")

            # 4. Delete Modules (Parents)
            modules = session.query(Topic).filter(
                Topic.course_id == course.id, 
                Topic.parent_topic_id.is_(None)
            ).all()
            for t in modules:
                session.delete(t)
            print(f" - Deleted {len(modules)} modules.")

            # 5. Delete Course
            session.delete(course)
            print(" - Course deleted.")

        session.commit()
        print("Successfully cleaned up all cloned courses.")

    except Exception as e:
        print(f"Error: {e}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    delete_cloned_courses("hariharan@klu.com")
