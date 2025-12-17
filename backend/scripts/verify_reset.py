
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv('backend/.env')
db_url = os.getenv("DATABASE_URL")

try:
    conn = psycopg2.connect(db_url)
    cursor = conn.cursor()
    
    print("--- Verification Report ---")
    
    # 1. Users
    cursor.execute("SELECT count(*), role FROM users GROUP BY role;")
    users = cursor.fetchall()
    print("Users by Role:")
    for u in users:
        print(f"  {u[1]}: {u[0]}")
        
    # 2. Organizations
    cursor.execute("SELECT count(*) FROM organizations;")
    orgs = cursor.fetchone()[0]
    print(f"Organizations: {orgs}")
    
    # 3. Courses
    cursor.execute("SELECT count(*), is_library_course FROM courses GROUP BY is_library_course;")
    courses = cursor.fetchall()
    print("Courses:")
    for c in courses:
        label = "Library" if c[1] else "Regular"
        print(f"  {label}: {c[0]}")

    cursor.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
