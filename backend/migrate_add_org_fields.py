
import os
import psycopg2

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://ideas2it@localhost:5432/skillup2dev")

def migrate():
    print(f"Connecting to {DATABASE_URL}...")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        cur = conn.cursor()
        
        # Add new columns if they don't exist
        columns = [
            ("code", "VARCHAR"),
            ("type", "VARCHAR DEFAULT 'College'"),
            ("logo_url", "VARCHAR"),
            ("status", "VARCHAR DEFAULT 'ACTIVE'"),
            ("address", "VARCHAR"),
            ("city", "VARCHAR"),
            ("state", "VARCHAR"),
            ("country", "VARCHAR"),
            ("contact_email", "VARCHAR"),
            ("contact_phone", "VARCHAR"),
            ("updated_at", "TIMESTAMP DEFAULT NOW()")
        ]

        print("Adding new columns to 'organizations' table...")
        for col_name, col_type in columns:
            try:
                cur.execute(f"ALTER TABLE organizations ADD COLUMN {col_name} {col_type};")
                print(f"Added column: {col_name}")
            except psycopg2.errors.DuplicateColumn:
                print(f"Column '{col_name}' already exists.")
            except Exception as e:
                print(f"Error adding {col_name}: {e}")

        cur.close()
        conn.close()
        print("Migration complete.")
        
    except Exception as e:
        print(f"Migration failed: {e}")

if __name__ == "__main__":
    migrate()
