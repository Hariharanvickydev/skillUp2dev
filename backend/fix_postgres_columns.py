from app.database import engine
from sqlalchemy import text
import sqlalchemy.exc

def add_column(connection, table, col_name, col_type):
    try:
        connection.execute(text(f"ALTER TABLE {table} ADD COLUMN {col_name} {col_type}"))
        print(f"Added {col_name} to {table}")
    except sqlalchemy.exc.ProgrammingError as e:
        # Check for duplicate column error code/message for Postgres
        if "already exists" in str(e):
             print(f"Column {col_name} already exists.")
        else:
             print(f"Error adding {col_name}: {e}")
    except Exception as e:
        print(f"Unexpected error for {col_name}: {e}")

with engine.connect() as conn:
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
