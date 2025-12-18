from app import models, database
from sqlalchemy import text

def migrate():
    db = next(database.get_db())
    print("Running migration to add approved_content to topic_contents...")
    
    try:
        # Add approved_content column
        db.execute(text("ALTER TABLE topic_contents ADD COLUMN approved_content TEXT"))
        print("Added approved_content column.")
    except Exception as e:
        print(f"Error adding column (might already exist): {e}")

    # Backfill: For existing records, assume content is approved (or copy it as a baseline)
    try:
        # If is_approved is true, copy content to approved_content
        db.execute(text("UPDATE topic_contents SET approved_content = content WHERE is_approved = true"))
        # If is_approved is false, maybe approved_content should be null? 
        # But for initial migration, safer to have a baseline.
        print("Backfilled approved_content.")
    except Exception as e:
        print(f"Error backfilling: {e}")
        
    db.commit()
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
