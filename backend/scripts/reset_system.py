
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv('backend/.env')
db_url = os.getenv("DATABASE_URL")
print(f"Connecting to: {db_url}")

try:
    conn = psycopg2.connect(db_url)
    cursor = conn.cursor()
    
    # helper to execute and print
    def exec_sql(label, sql):
        print(f"Running: {label}...")
        try:
            cursor.execute(sql)
            print(f"  -> Rows affected: {cursor.rowcount}")
        except Exception as e:
            print(f"  -> Error: {e}")
            conn.rollback() # Important for transaction block if any
            raise e

    # 1. Clear Dependent User Data first
    exec_sql("Deleting User Progress", "DELETE FROM user_progress;")
    exec_sql("Deleting Exam Attempts", "DELETE FROM exam_attempts;")
    
    # 2. Clear Org Hierarchy (Groups) - Nullify Leader first
    exec_sql("Nullifying Org Group Leaders", "UPDATE org_groups SET leader_id = NULL;")
    # Delete children first? Or rely on CASCADE? Let's try direct delete if cascade is set, or delete distinct levels.
    # Safe approach: Delete all. If self-referencing FK prevents, we might need recursive CTE or multiple passes.
    # Trying simple delete, assuming constraints allow or we nullify parent_id first.
    exec_sql("Nullifying Org Group Parents", "UPDATE org_groups SET parent_id = NULL;")
    exec_sql("Deleting Org Groups", "DELETE FROM org_groups;")

    # 3. Handle Courses & Content
    # We want to KEEP Library Courses. 
    # Assume 'is_library_course' = TRUE for Central Library.
    
    # Identify non-library courses
    exec_sql("Identifying Non-Library Courses", "SELECT count(*) FROM courses WHERE is_library_course = FALSE;")
    
    # Delete Exams linked to Non-Library Courses OR created by users (who will be deleted)
    # Safest: Delete exams NOT linked to a Library Course directly or indirectly.
    # For simplicity/robustness: Delete exams where course_id IN (Non-Library) OR course_id is NULL/User created?
    # Actually, simpler: Delete exams where course_id IS NULL OR course_id IN (SELECT id FROM courses WHERE is_library_course = FALSE);
    
    exec_sql("Deleting Exams (Non-Library)", """
        DELETE FROM exams 
        WHERE course_id IS NULL 
           OR course_id IN (SELECT id FROM courses WHERE is_library_course = FALSE);
    """)

    # Delete Topics & Content for Non-Library Courses
    # Note: TopicContent is linked to Topic. Topic is linked to Course.
    
    exec_sql("Deleting Topic Contents (Non-Library)", """
        DELETE FROM topic_contents 
        WHERE topic_id IN (
            SELECT id FROM topics 
            WHERE course_id IN (SELECT id FROM courses WHERE is_library_course = FALSE)
        );
    """)

    exec_sql("Deleting Topics (Non-Library)", """
        DELETE FROM topics 
        WHERE course_id IN (SELECT id FROM courses WHERE is_library_course = FALSE);
    """)

    # Finally Delete Non-Library Courses
    exec_sql("Deleting Non-Library Courses", "DELETE FROM courses WHERE is_library_course = FALSE;")
    
    # 4. Delete Users (Except Super Admin)
    # First unlink from Organizations if necessary (though Org deletion will handle if cascading, or we delete users first)
    # Unlink organization_id to be safe?
    # exec_sql("Unlinking Users from Orgs", "UPDATE users SET organization_id = NULL WHERE role != 'SUPER_ADMIN';")

    exec_sql("Deleting Users (Non-Super Admin)", "DELETE FROM users WHERE role != 'SUPER_ADMIN';")

    # 5. Delete Organizations
    # Super Admin is not linked to any org (verified).
    exec_sql("Deleting Organizations", "DELETE FROM organizations;")

    conn.commit()
    print("\nSystem Reset Completed Successfully.")
    print("Preserved: Super Admin & Library Courses.")

    cursor.close()
    conn.close()

except Exception as e:
    print(f"\nCRITICAL FAIL: {e}")
