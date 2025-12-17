
import sys
from sqlalchemy import create_engine, text

configs = [
    "postgresql://ideas2it@localhost:5432/skillup2dev",
    "postgresql://postgres@localhost:5432/skillup2dev",
    "postgresql://ideas2it@localhost:5432/postgres",
    "postgresql://postgres@localhost:5432/postgres",
    "postgresql://user:password@localhost:5432/skillup2dev",
    "postgresql://postgres:postgres@localhost:5432/skillup2dev"
]

for url in configs:
    try:
        engine = create_engine(url)
        with engine.connect() as conn:
            print(f"SUCCESS: Connected with {url}")
            # Check for tables
            result = conn.execute(text("SELECT tablename FROM pg_tables WHERE schemaname='public'"))
            tables = [row[0] for row in result]
            print(f"  Tables: {tables}")
            break
    except Exception as e:
        print(f"FAILED: {url} -> {str(e).splitlines()[0]}")
