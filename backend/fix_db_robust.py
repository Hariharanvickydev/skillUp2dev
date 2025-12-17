import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load env variables from .env file
load_dotenv()

# Common connection strings to try
# We FORCE 127.0.0.1 to avoid IPv6 issues
# We prioritize the default app fallback 
connection_strings = [
    os.getenv("DATABASE_URL").replace("localhost", "127.0.0.1") if os.getenv("DATABASE_URL") and "postgresql" in os.getenv("DATABASE_URL") else None,
    "postgresql://user:password@127.0.0.1:5432/skillup2dev_v2", # Default in code (IPv4)
    "postgresql://user:password@127.0.0.1:5432/skillup2dev", # Docker default (IPv4)
    "postgresql://postgres:postgres@127.0.0.1:5432/skillup2dev", 
    "postgresql://postgres:password@127.0.0.1:5432/skillup2dev",
    "postgresql://admin:admin@127.0.0.1:5432/skillup2dev",
]

# Filter out None values
connection_strings = [cs for cs in connection_strings if cs]

def add_column(connection, table, col_name, col_type):
    try:
        # Postgres supports IF NOT EXISTS for ADD COLUMN in newer versions (9.6+)
        connection.execute(text(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {col_name} {col_type}"))
        print(f"Added {col_name} to {table}")
    except Exception as e:
        # Fallback for older Postgres or other errors
        if "already exists" in str(e) or "Duplicate column" in str(e):
             print(f"Column {col_name} already exists.")
        else:
             print(f"Error adding {col_name}: {e}")

success = False

for url in connection_strings:
    print(f"Trying to connect to: {url}")
    try:
        engine = create_engine(url)
        with engine.connect() as conn:
            print(f"Successfully connected to: {url}")
            
            # force_password_reset
            add_column(conn, "users", "force_password_reset", "BOOLEAN DEFAULT FALSE")
            
            # phone
            add_column(conn, "users", "phone", "VARCHAR(255)")
            
            # year
            add_column(conn, "users", "year", "VARCHAR(50)")
            
            # roll_number
            add_column(conn, "users", "roll_number", "VARCHAR(50)")
            
            # last_login_at
            add_column(conn, "users", "last_login_at", "TIMESTAMP WITHOUT TIME ZONE")

            conn.commit()
            print("Schema update script finished successfully.")
            success = True
            break
    except Exception as e:
        print(f"Failed to connect using {url}: {e.orig if hasattr(e, 'orig') else e}")

if not success:
    print("All connection attempts failed.")
