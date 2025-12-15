from sqlalchemy import create_engine, text
import os

# TRY THE OTHER DB
DATABASE_URL = "postgresql://ideas2it:password@localhost:5432/skillup2dev"
engine = create_engine(DATABASE_URL)

try:
    with engine.connect() as conn:
        print("--- Checking 'skillup2dev' ---")
        
        # 1. Check for Org 'Kalasalingam'
        print("Checking for Org 'Kalasalingam'...")
        result = conn.execute(text("SELECT id, name FROM organizations WHERE name ILIKE '%Kalasalingam%'"))
        orgs = result.fetchall()
        for o in orgs:
            print(f"FOUND ORG: {o.name} ({o.id})")
            
        if not orgs:
            print("Org 'Kalasalingam' NOT found in this DB.")

        # 2. Check for 'org_groups' table
        print("\nChecking for 'org_groups' table...")
        result = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_name='org_groups'"))
        if result.fetchone():
            print("TABLE 'org_groups' EXISTS!")
            
            # 3. Check Data
            result = conn.execute(text("SELECT count(*) FROM org_groups"))
            count = result.scalar()
            print(f"Row count: {count}")
        else:
            print("TABLE 'org_groups' DOES NOT EXIST.")

except Exception as e:
    print(f"Error: {e}")
