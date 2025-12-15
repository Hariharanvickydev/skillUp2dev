from sqlalchemy import create_engine, text
import os

# Correct DB URL Attempt 3
DATABASE_URL = "postgresql://ideas2it:password@localhost:5432/skillup2dev_v2"
engine = create_engine(DATABASE_URL)

try:
    with engine.connect() as conn:
        print("--- Org Groups ---")
        result = conn.execute(text("SELECT id, name, type, parent_id, organization_id FROM org_groups"))
        groups = result.fetchall()
        for g in groups:
            print(f"ID: {g.id} | Name: {g.name} | Type: {g.type} | Parent: {g.parent_id}")
        
        if not groups:
            print("No groups found.")

        print("\n--- Testing Recursion ---")
        for g in groups:
            if g.id == g.parent_id:
                print(f"CRITICAL: Self-referencing group found! {g.name} ({g.id})")

except Exception as e:
    print(f"Error connecting: {e}")
