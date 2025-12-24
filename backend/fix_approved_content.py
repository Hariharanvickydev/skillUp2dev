from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv
import sys

# Add backend directory to python path
sys.path.append('/Users/ideas2it/Documents/AI agent/backend')
from app.database import SessionLocal, engine

load_dotenv()

def fix_approved_content():
    db = SessionLocal()
    try:
        print("Starting content repair...")
        
        # Find all content records where topic is APPROVED but approved_content is NULL/Empty
        # We need to join with topics to check status
        sql = text("""
            SELECT tc.id, tc.topic_id, tc.content, t.title 
            FROM topic_contents tc
            JOIN topics t ON tc.topic_id = t.id
            WHERE t.status = 'APPROVED' 
            AND (tc.approved_content IS NULL OR length(tc.approved_content) = 0)
            AND length(tc.content) > 0
        """)
        
        records = db.execute(sql).fetchall()
        
        if not records:
            print("No broken content records found.")
            return

        print(f"Found {len(records)} topics with missing approved content.")
        
        for rec in records:
            print(f"Fixing Topic: {rec.title} (ID: {rec.topic_id})")
            
            # Update the record
            update_sql = text("""
                UPDATE topic_contents 
                SET approved_content = content, is_approved = true 
                WHERE id = :rid
            """)
            db.execute(update_sql, {"rid": rec.id})
            
        db.commit()
        print("Successfully repaired all records.")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_approved_content()
