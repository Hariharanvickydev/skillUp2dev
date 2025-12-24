import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load env variables from .env file
load_dotenv()

# Build list of potential connection strings
connection_strings = [
    os.getenv("DATABASE_URL"),
    "postgresql://user:password@127.0.0.1:5432/skillup2dev_v2",
    "postgresql://user:password@127.0.0.1:5432/skillup2dev",
    "postgresql://postgres:postgres@127.0.0.1:5432/skillup2dev",
]

# Filter out None and duplicate values
connection_strings = list(set([cs for cs in connection_strings if cs]))

def add_column(connection, table, col_name, col_type):
    try:
        # Postgres supports IF NOT EXISTS for ADD COLUMN in newer versions (9.6+)
        connection.execute(text(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {col_name} {col_type}"))
        print(f"Added {col_name} to {table}")
    except Exception as e:
        if "already exists" in str(e) or "Duplicate column" in str(e):
             print(f"Column {col_name} already exists.")
        else:
             print(f"Error adding {col_name}: {e}")

success = False

for url in connection_strings:
    print(f"Trying to connect to: {url}")
    try:
        # Avoid issues with localhost vs 127.0.0.1
        if "localhost" in url:
            url = url.replace("localhost", "127.0.0.1")
            
        engine = create_engine(url)
        with engine.connect() as conn:
            print(f"Successfully connected to: {url}")
            
            # Add remediation_notes to exams table
            add_column(conn, "exams", "remediation_notes", "TEXT")
            
            conn.commit()
            print("Schema update script finished successfully.")
            success = True
            break
    except Exception as e:
        print(f"Failed to connect using {url}: {e.orig if hasattr(e, 'orig') else e}")

if not success:
    print("All connection attempts failed.")
    exit(1)
