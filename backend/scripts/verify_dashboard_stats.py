
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv('backend/.env')
db_url = os.getenv("DATABASE_URL")

try:
    conn = psycopg2.connect(db_url)
    cursor = conn.cursor()
    
    # 1. Real Count (All)
    cursor.execute("SELECT count(*) FROM users;")
    real_total = cursor.fetchone()[0]
    
    # 2. Filtered Count (Non-Super Admin)
    cursor.execute("SELECT count(*) FROM users WHERE role != 'SUPER_ADMIN';")
    filtered_total = cursor.fetchone()[0]
    
    print(f"Total Users in DB: {real_total}")
    print(f"Filtered Total (Dashboard Expectation): {filtered_total}")
    
    if filtered_total == 0 and real_total > 0:
        print("PASS: Logic correct (Super Admin excluded).")
    else:
        print("FAIL or Ambiguous: Check logic.")

    cursor.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
