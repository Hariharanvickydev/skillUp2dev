from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

# Use the same database URL as the app
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/dbname") 
# Assuming standard local connection if env not set for this script context, 
# but best to rely on what the user's environment likely has or hardcode if known.
# Based on previous context, I'll try to find the URL or use a standard one.
# Wait, I don't have the password handy in the prompt. 
# I will use the app's `database.py` logic if possible, or just try the standard local one.
# Actually, I can just import from app.database if I can set the path correctly.

import sys
sys.path.append('/Users/ideas2it/Documents/AI agent/backend')
from app.database import SessionLocal, engine

title_target = '1467b09c-b7e9-40c5-b93c-bb2ec4f7caee'

def check_content():
    db = SessionLocal()
    try:
        sql = text("SELECT * FROM topic_contents WHERE topic_id = :tid")
        result = db.execute(sql, {"tid": title_target}).fetchone()
        
        if result:
            print(f"Found Content Row ID: {result.id}")
            print(f"Topic ID: {result.topic_id}")
            print(f"Content Length: {len(result.content) if result.content else 0}")
            print(f"Approved Content Length: {len(result.approved_content) if result.approved_content else 0}")
            print(f"Is Approved Content None? {result.approved_content is None}")
        else:
            print("No content found for this topic ID in topic_contents table.")
            
        # Also check topic status
        sql_topic = text("SELECT * FROM topics WHERE id = :tid")
        topic_res = db.execute(sql_topic, {"tid": title_target}).fetchone()
        if topic_res:
             print(f"Topic Status: {topic_res.status}")
             print(f"Topic Published: {topic_res.is_published}")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_content()
