"""
PostgreSQL Migration Script

This script migrates data from SQLite to PostgreSQL.
It creates tables using SQLAlchemy models and copies all data.
"""

import sys
import os

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app import models

# SQLite connection
SQLITE_DB = "skillup2dev.db"
sqlite_url = f"sqlite:///{SQLITE_DB}"

# PostgreSQL connection
POSTGRES_URL = "postgresql://skillup_user:skillup_password@localhost:5432/skillup2dev"

def migrate_data():
    """Migrate all data from SQLite to PostgreSQL"""
    
    print("🔄 Starting migration from SQLite to PostgreSQL...")
    
    # Create engines
    sqlite_engine = create_engine(sqlite_url)
    postgres_engine = create_engine(POSTGRES_URL)
    
    # Create all tables in PostgreSQL using models
    print("📋 Creating tables in PostgreSQL...")
    Base.metadata.create_all(postgres_engine)
    
    # Create sessions
    SqliteSession = sessionmaker(bind=sqlite_engine)
    PostgresSession = sessionmaker(bind=postgres_engine)
    
    sqlite_session = SqliteSession()
    postgres_session = PostgresSession()
    
    try:
        # Define migration order (respecting foreign keys)
        migrations = [
            ("Users", models.User),
            ("Courses", models.Course),
            ("Topics", models.Topic),
            ("Topic Contents", models.TopicContent),
            ("Exams", models.Exam),
            ("Exam Attempts", models.ExamAttempt),
            ("User Progress", models.UserProgress),
        ]
        
        for name, model_class in migrations:
            print(f"  ➡️  Migrating {name}...")
            
            # Read from SQLite
            sqlite_data = sqlite_session.query(model_class).all()
            
            if sqlite_data:
                # Add to PostgreSQL
                for item in sqlite_data:
                    # Make transient to avoid session conflicts
                    postgres_session.expunge(item) if item in postgres_session else None
                    postgres_session.merge(item)
                
                postgres_session.commit()
                print(f"     ✅ Migrated {len(sqlite_data)} rows")
            else:
                print(f"     ⚠️  No data to migrate")
        
        print("\n✅ Migration completed successfully!")
        print(f"📊 Database: skillup2dev")
        print(f"🔗 Connection: postgresql://skillup_user:***@localhost:5432/skillup2dev")
        
    except Exception as e:
        postgres_session.rollback()
        raise e
    finally:
        sqlite_session.close()
        postgres_session.close()

if __name__ == "__main__":
    try:
        migrate_data()
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
