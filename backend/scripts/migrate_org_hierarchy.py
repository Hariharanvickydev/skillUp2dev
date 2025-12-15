
import sys
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Add parent directory to path to import app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import DATABASE_URL

def migrate():
    print(f"Connecting to database...")
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        # 1. Create org_groups table
        print("Creating org_groups table...")
        try:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS org_groups (
                    id UUID PRIMARY KEY,
                    organization_id UUID NOT NULL REFERENCES organizations(id),
                    parent_id UUID REFERENCES org_groups(id),
                    name VARCHAR NOT NULL,
                    type VARCHAR DEFAULT 'GROUP',
                    leader_id UUID REFERENCES users(id),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """))
            print("org_groups table created (or already exists).")
        except Exception as e:
            print(f"Error creating org_groups table: {e}")

        # 2. Add columns to organizations
        print("Altering organizations table...")
        try:
            conn.execute(text("ALTER TABLE organizations ADD COLUMN IF NOT EXISTS type VARCHAR DEFAULT 'COLLEGE'"))
            conn.execute(text("ALTER TABLE organizations ADD COLUMN IF NOT EXISTS hierarchy_settings JSON DEFAULT '{}'"))
            print("organizations table updated.")
        except Exception as e:
            print(f"Error updating organizations table: {e}")

        # 3. Add columns to users
        print("Altering users table...")
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS org_group_id UUID REFERENCES org_groups(id)"))
            print("users table updated.")
        except Exception as e:
            print(f"Error updating users table: {e}")
            
        print("Migration complete.")

if __name__ == "__main__":
    migrate()
