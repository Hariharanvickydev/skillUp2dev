import os
from app.database import DATABASE_URL, engine
from sqlalchemy import text

print(f"--- DIAGNOSTIC INFO ---")
print(f"Loaded DATABASE_URL: {DATABASE_URL}")

try:
    with engine.connect() as connection:
        print("Connection successful.")
        result = connection.execute(text("SELECT id, title, is_library_course, is_published FROM courses"))
        rows = result.fetchall()
        print(f"Total courses found: {len(rows)}")
        for row in rows:
            print(f" - Title: '{row[1]}', ID: {row[0]}, Library: {row[2]}, Published: {row[3]}")
            
except Exception as e:
    print(f"Connection failed: {e}")
