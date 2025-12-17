
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv('backend/.env')
db_url = os.getenv("DATABASE_URL")
print(f"Connecting to: {db_url}")

try:
    conn = psycopg2.connect(db_url)
    cursor = conn.cursor()
    
    # 1. Create org_groups table if not exists
    print("Checking org_groups table...")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS org_groups (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id),
        parent_id UUID REFERENCES org_groups(id),
        name VARCHAR NOT NULL,
        type VARCHAR DEFAULT 'GROUP',
        leader_id UUID REFERENCES users(id),
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
    );
    """)
    conn.commit()
    print("org_groups table check/creation done.")

    # 2. Add org_group_id to users
    print("Checking org_group_id in users...")
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN org_group_id UUID REFERENCES org_groups(id);")
        conn.commit()
        print("Added org_group_id to users.")
    except psycopg2.errors.DuplicateColumn:
        print("Column org_group_id already exists in users.")
        conn.rollback()
    except Exception as e:
        print(f"Error adding org_group_id: {e}")
        conn.rollback()

    # 3. Add type and hierarchy_settings to organizations
    print("Checking columns in organizations...")
    columns_to_add = [
        ("type", "VARCHAR DEFAULT 'COLLEGE'"),
        ("hierarchy_settings", "JSON DEFAULT '{}'"),
        ("code", "VARCHAR UNIQUE")
    ]
    
    for col_name, col_def in columns_to_add:
        try:
            cursor.execute(f"ALTER TABLE organizations ADD COLUMN {col_name} {col_def};")
            conn.commit()
            print(f"Added {col_name} to organizations.")
        except psycopg2.errors.DuplicateColumn:
            print(f"Column {col_name} already exists in organizations.")
            conn.rollback()
        except Exception as e:
            print(f"Error adding {col_name}: {e}")
            conn.rollback()

    cursor.close()
    conn.close()
    print("Migration fix completed.")

except Exception as e:
    print(f"Critical Error: {e}")
