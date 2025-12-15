from sqlalchemy import create_engine, text
import sqlalchemy.exc

# FORCE Postgres URL as per user's error context
DATABASE_URL = "postgresql://user:password@localhost:5432/skillup2dev_v2"
engine = create_engine(DATABASE_URL)

def add_column(connection, table, col_name, col_type):
    try:
        connection.execute(text(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {col_name} {col_type}"))
        print(f"Added {col_name} to {table}")
    except sqlalchemy.exc.ProgrammingError as e:
        # Postgres often handles IF NOT EXISTS, but older versions might not for ADD COLUMN
        # If it fails, we check the error
        if "already exists" in str(e):
             print(f"Column {col_name} already exists.")
        else:
             print(f"Error adding {col_name}: {e}")
    except Exception as e:
        print(f"Unexpected error for {col_name}: {e}")

try:
    with engine.connect() as conn:
        print(f"Connected to: {DATABASE_URL}")
        
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
        print("Schema update script finished.")
except Exception as e:
    print(f"Failed to connect or run script: {e}")
