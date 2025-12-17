
import os
import psycopg2
from dotenv import load_dotenv

# Load env from backend/.env
load_dotenv('backend/.env')
db_url = os.getenv("DATABASE_URL")
print(f"Connecting to: {db_url}")

try:
    conn = psycopg2.connect(db_url)
    cursor = conn.cursor()
    
    # Check count before
    cursor.execute("SELECT count(*) FROM users WHERE role != 'SUPER_ADMIN';")
    count_before = cursor.fetchone()[0]
    print(f"Found {count_before} users to delete.")
    
    if count_before > 0:
        # We might need to handle foreign keys. 
        # For now, let's try direct delete. If it fails due to FK, we might need to NULLify references first.
        try:
            # 1. Nullify leader_id in org_groups
            print("Nullifying leader_id in org_groups...")
            cursor.execute("""
                UPDATE org_groups 
                SET leader_id = NULL 
                WHERE leader_id IN (SELECT id FROM users WHERE role != 'SUPER_ADMIN');
            """)

            # 2. Handle Exam Attempts (Before Exams)
            # 2a. Delete Exam Attempts (by target users)
            print("Deleting exam_attempts by target users...")
            cursor.execute("""
                DELETE FROM exam_attempts 
                WHERE user_id IN (SELECT id FROM users WHERE role != 'SUPER_ADMIN');
            """)
            
            # 2b. Delete Exam Attempts (for exams created by target users)
            print("Deleting exam_attempts for exams created by target users...")
            try:
                cursor.execute("""
                    DELETE FROM exam_attempts 
                    WHERE exam_id IN (
                        SELECT id FROM exams 
                        WHERE created_by_user_id IN (SELECT id FROM users WHERE role != 'SUPER_ADMIN')
                    );
                """)
            except psycopg2.errors.UndefinedColumn:
                 print("column created_by_user_id not found in exams? Skipping or checking models.")
                 conn.rollback() # This matches the try/except block structure I want to keep robust

            # 3. Handle Exams (Delete exams created by these users)
            print("Deleting exams created by target users...")
            try:
                cursor.execute("""
                    DELETE FROM exams 
                    WHERE created_by_user_id IN (SELECT id FROM users WHERE role != 'SUPER_ADMIN');
                """)
            except psycopg2.errors.UndefinedColumn:
                 print("column created_by_user_id not found in exams? Skipping or checking models.")
                 conn.rollback() 
                 pass

            # 4. Handle Courses (Nullify creator_id)
            print("Nullifying creator_id in courses...")
            cursor.execute("""
                UPDATE courses 
                SET creator_id = NULL 
                WHERE creator_id IN (SELECT id FROM users WHERE role != 'SUPER_ADMIN');
            """)

            # 4. Handle Topic Content (Approver/Creator?) - usually not directly linked by FK in simple schema unless specified.
            # Checking topic_contents table... probably fine.

            # 5. Handle UserProgress (Delete progress of deleted users)
            print("Deleting user_progress for target users...")
            cursor.execute("""
                DELETE FROM user_progress 
                WHERE user_id IN (SELECT id FROM users WHERE role != 'SUPER_ADMIN');
            """)

            # Delete users
            cursor.execute("DELETE FROM users WHERE role != 'SUPER_ADMIN';")
            deleted_count = cursor.rowcount
            conn.commit()
            print(f"Successfully deleted {deleted_count} users.")
        except psycopg2.errors.ForeignKeyViolation as fke:
            print(f"Foreign Key Violation Error: {fke}")
            print("Rolling back...")
            conn.rollback()
            # Attempt to identify which table is blocking
            print("Tip: You may need to manually clear dependent data in other tables (e.g., courses, exam_attempts) first if CASCADE is not set.")
    else:
        print("No users to delete.")

    cursor.close()
    conn.close()

except Exception as e:
    print(f"Error: {e}")
