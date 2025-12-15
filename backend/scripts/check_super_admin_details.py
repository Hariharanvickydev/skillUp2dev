
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv('backend/.env')
db_url = os.getenv("DATABASE_URL")

try:
    conn = psycopg2.connect(db_url)
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, email, organization_id FROM users WHERE role = 'SUPER_ADMIN';")
    admin = cursor.fetchone()
    
    if admin:
        print(f"Super Admin: {admin[1]}")
        print(f"Organization ID: {admin[2]}")
    else:
        print("No Super Admin found.")

    cursor.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
