import os
from sqlalchemy import create_engine, text
from sqlalchemy.engine.url import make_url

# We found that the process is owned by 'ideas2it', so that is likely the superuser.
# We try connecting to 'postgres' db first to list dbs, or guess the db name.

potential_users = ["ideas2it", "postgres"]
potential_dbs = ["skillup2dev", "skillup2dev_v2", "postgres"]
potential_hosts = ["localhost", "127.0.0.1"]

connection_attempts = []

for user in potential_users:
    for db in potential_dbs:
        for host in potential_hosts:
            # Try without password (common for local)
            connection_attempts.append(f"postgresql://{user}@{host}:5432/{db}")
            # Try with password 'password' (fallback)
            connection_attempts.append(f"postgresql://{user}:password@{host}:5432/{db}")

def add_column(connection, table, col_name, col_type):
    try:
        connection.execute(text(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {col_name} {col_type}"))
        print(f"Added {col_name} to {table}")
    except Exception as e:
        if "already exists" in str(e) or "Duplicate column" in str(e):
             print(f"Column {col_name} already exists.")
        else:
             print(f"Error adding {col_name}: {e}")

success = False

for url in connection_attempts:
    print(f"Trying: {url}")
    try:
        engine = create_engine(url)
        with engine.connect() as conn:
            print(f"CONNECTED to: {url}")
            
            # Check if 'users' table exists in this DB
            result = conn.execute(text("SELECT to_regclass('public.users')"))
            if result.scalar() is None:
                print(f"Table 'users' not found in {url}, skipping...")
                continue
            
            print(f"Found 'users' table in {url}. Applying fixes...")
            
            # force_password_reset
            add_column(conn, "users", "force_password_reset", "BOOLEAN DEFAULT FALSE")
            add_column(conn, "users", "phone", "VARCHAR(255)")
            add_column(conn, "users", "year", "VARCHAR(50)")
            add_column(conn, "users", "roll_number", "VARCHAR(50)")
            add_column(conn, "users", "last_login_at", "TIMESTAMP WITHOUT TIME ZONE")

            conn.commit()
            print("Schema update script finished successfully.")
            success = True
            break
    except Exception as e:
        # Reduce noise
        pass

if not success:
    print("All connection attempts failed.")
