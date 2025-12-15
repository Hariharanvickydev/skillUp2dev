import sqlite3
import os

databases = ["skillup.db", "skillup2dev.db"]

for db_file in databases:
    if not os.path.exists(db_file):
        print(f"Database file {db_file} not found.")
        continue
        
    print(f"\n--- Checking {db_file} ---")
    try:
        conn = sqlite3.connect(db_file)
        cursor = conn.cursor()
        
        # Check if courses table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='courses';")
        if not cursor.fetchone():
            print("  'courses' table not found.")
            conn.close()
            continue

        cursor.execute("SELECT id, title FROM courses")
        rows = cursor.fetchall()
        
        if not rows:
            print("  No courses found.")
        else:
            for row in rows:
                print(f"  Found course: '{row[1]}' (ID: {row[0]})")
                
        conn.close()
    except Exception as e:
        print(f"  Error reading {db_file}: {e}")
