
import os
import psycopg2

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://ideas2it@localhost:5432/skillup2dev")

def check():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        cur.execute("SELECT count(*) FROM courses WHERE parent_course_id IS NOT NULL")
        count = cur.fetchone()[0]
        print(f"Imported courses count: {count}")
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check()
