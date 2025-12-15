
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

COURSE_TITLE = "react native course with out module"
DB_URLS = [
    "postgresql://user:password@localhost:5432/skillup2dev",
    "postgresql://user:password@localhost:5432/skillup2dev_v2"
]

def delete_course_postgres():
    for db_url in DB_URLS:
        print(f"Checking database: {db_url}")
        try:
            engine = create_engine(db_url)
            with engine.connect() as connection:
                # Check if courses table exists
                result = connection.execute(text("SELECT to_regclass('public.courses');"))
                if not result.scalar():
                    print("  'courses' table not found.")
                    continue

                # Search for the course
                result = connection.execute(text("SELECT id, title FROM courses WHERE title = :title"), {"title": COURSE_TITLE})
                courses = result.fetchall()
                
                if not courses:
                    print(f"  No course found with title: '{COURSE_TITLE}'")
                    continue

                print(f"  Found {len(courses)} course(s).")
                for course in courses:
                    print(f"  Deleting course: {course.title} (ID: {course.id})")
                    connection.execute(text("DELETE FROM courses WHERE id = :id"), {"id": course.id})
                    connection.commit()
                    print("  Deletion successful.")
                    
        except Exception as e:
            print(f"  Error connecting or deleting: {e}")

if __name__ == "__main__":
    delete_course_postgres()
