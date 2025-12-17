from sqlalchemy import create_engine, text
import os

DATABASE_URL = "postgresql://ideas2it:password@localhost:5432/skillup2dev_v2"
engine = create_engine(DATABASE_URL)

try:
    with engine.connect() as conn:
        print("--- Tables in DB ---")
        result = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema='public'"))
        tables = result.fetchall()
        for t in tables:
            print(t[0])
            
        print("\n--- Checking for Organization 'Kalasalingam' ---")
        # Check if we can allow case-insensitive search if needed, but let's try direct first
        try:
            result = conn.execute(text("SELECT id, name FROM organizations WHERE name ILIKE '%Kalasalingam%'"))
            orgs = result.fetchall()
            for o in orgs:
                print(f"Found Org: {o.name} ({o.id})")
        except Exception as e:
            print(f"Could not query organizations: {e}")

except Exception as e:
    print(f"Basic Connection/Query Error: {e}")
