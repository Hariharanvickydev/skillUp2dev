
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv('backend/.env')
db_url = os.getenv("DATABASE_URL")
print(f"Connecting to: {db_url}")

try:
    conn = psycopg2.connect(db_url)
    cursor = conn.cursor()
    
    cursor.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users';")
    columns = cursor.fetchall()
    print("\nColumns in 'users' table:")
    for col in columns:
        print(f"- {col[0]} ({col[1]})")

    cursor.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
