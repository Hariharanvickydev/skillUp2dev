from app.database import engine
from sqlalchemy import text

def add_column_if_not_exists(connection, table_name, column_name, column_type):
    try:
        connection.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}"))
        print(f"Added column {column_name} to {table_name}")
    except Exception as e:
        if "duplicate column" in str(e).lower() or "already exists" in str(e).lower():
            print(f"Column {column_name} already exists in {table_name}")
        else:
            print(f"Error adding {column_name}: {e}")

with engine.connect() as connection:
    # force_password_reset
    add_column_if_not_exists(connection, "users", "force_password_reset", "BOOLEAN DEFAULT 0")
    
    # phone
    add_column_if_not_exists(connection, "users", "phone", "VARCHAR")

    # year
    add_column_if_not_exists(connection, "users", "year", "VARCHAR")

    # roll_number
    add_column_if_not_exists(connection, "users", "roll_number", "VARCHAR")

    # last_login_at
    add_column_if_not_exists(connection, "users", "last_login_at", "DATETIME")
    
    connection.commit()
    print("Schema update complete.")
