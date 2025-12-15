"""
Database Backup Script

This script exports AI-generated content from the database to JSON files.
It backs up courses, topics, topic content, and exams to avoid costly regeneration.

Usage:
    python backup_data.py [--output-dir DIRECTORY]

Example:
    python backup_data.py
    python backup_data.py --output-dir /path/to/backups
"""

import os
import json
import argparse
from datetime import datetime
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app import models

def serialize_datetime(obj):
    """Convert datetime objects to ISO format strings"""
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")

def backup_users(db: Session):
    """Backup all users"""
    users = db.query(models.User).all()
    return [{
        "id": str(user.id),
        "email": user.email,
        "password_hash": user.password_hash,
        "full_name": user.full_name,
        "role": user.role,
        "is_active": user.is_active,
        "created_at": user.created_at.isoformat() if user.created_at else None
    } for user in users]

def backup_courses(db: Session):
    """Backup all courses"""
    courses = db.query(models.Course).all()
    return [{
        "id": str(course.id),
        "title": course.title,
        "description": course.description,
        "settings": course.settings,
        "status": course.status,
        "creator_id": str(course.creator_id) if course.creator_id else None,
        "is_published": course.is_published,
        "created_at": course.created_at.isoformat() if course.created_at else None,
        "updated_at": course.updated_at.isoformat() if course.updated_at else None
    } for course in courses]

def backup_topics(db: Session):
    """Backup all topics"""
    topics = db.query(models.Topic).all()
    return [{
        "id": str(topic.id),
        "course_id": str(topic.course_id),
        "title": topic.title,
        "description": topic.description,
        "order": topic.order,
        "status": topic.status,
        "parent_topic_id": str(topic.parent_topic_id) if topic.parent_topic_id else None,
        "is_published": topic.is_published,
        "created_at": topic.created_at.isoformat() if topic.created_at else None
    } for topic in topics]

def backup_topic_contents(db: Session):
    """Backup all topic content (AI-generated markdown)"""
    contents = db.query(models.TopicContent).all()
    return [{
        "id": str(content.id),
        "topic_id": str(content.topic_id),
        "content": content.content,
        "is_approved": content.is_approved,
        "created_at": content.created_at.isoformat() if content.created_at else None,
        "updated_at": content.updated_at.isoformat() if content.updated_at else None
    } for content in contents]

def backup_exams(db: Session):
    """Backup all exams (AI-generated questions)"""
    exams = db.query(models.Exam).all()
    return [{
        "id": str(exam.id),
        "topic_id": str(exam.topic_id),
        "created_by_user_id": str(exam.created_by_user_id),
        "questions": exam.questions,
        "difficulty": exam.difficulty,
        "duration_minutes": exam.duration_minutes,
        "passing_score": exam.passing_score,
        "is_published": exam.is_published,
        "is_public": exam.is_public,
        "num_attempts": exam.num_attempts,
        "created_at": exam.created_at.isoformat() if exam.created_at else None
    } for exam in exams]

def create_backup(output_dir: str = "backups"):
    """Create a complete backup of AI-generated content"""
    # Create backup directory with timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_dir = os.path.join(output_dir, f"backup_{timestamp}")
    os.makedirs(backup_dir, exist_ok=True)
    
    print(f"Creating backup in: {backup_dir}")
    
    db = SessionLocal()
    try:
        # Backup each table
        print("Backing up users...")
        users_data = backup_users(db)
        with open(os.path.join(backup_dir, "users.json"), "w") as f:
            json.dump(users_data, f, indent=2)
        print(f"  ✓ Backed up {len(users_data)} users")
        
        print("Backing up courses...")
        courses_data = backup_courses(db)
        with open(os.path.join(backup_dir, "courses.json"), "w") as f:
            json.dump(courses_data, f, indent=2)
        print(f"  ✓ Backed up {len(courses_data)} courses")
        
        print("Backing up topics...")
        topics_data = backup_topics(db)
        with open(os.path.join(backup_dir, "topics.json"), "w") as f:
            json.dump(topics_data, f, indent=2)
        print(f"  ✓ Backed up {len(topics_data)} topics")
        
        print("Backing up topic content...")
        contents_data = backup_topic_contents(db)
        with open(os.path.join(backup_dir, "topic_contents.json"), "w") as f:
            json.dump(contents_data, f, indent=2)
        print(f"  ✓ Backed up {len(contents_data)} topic contents")
        
        print("Backing up exams...")
        exams_data = backup_exams(db)
        with open(os.path.join(backup_dir, "exams.json"), "w") as f:
            json.dump(exams_data, f, indent=2)
        print(f"  ✓ Backed up {len(exams_data)} exams")
        
        # Create metadata file
        metadata = {
            "backup_date": datetime.now().isoformat(),
            "total_users": len(users_data),
            "total_courses": len(courses_data),
            "total_topics": len(topics_data),
            "total_contents": len(contents_data),
            "total_exams": len(exams_data)
        }
        with open(os.path.join(backup_dir, "metadata.json"), "w") as f:
            json.dump(metadata, f, indent=2)
        
        print(f"\n✅ Backup completed successfully!")
        print(f"📁 Location: {backup_dir}")
        print(f"\nBackup summary:")
        print(f"  - Admin users: {len(users_data)}")
        print(f"  - Courses: {len(courses_data)}")
        print(f"  - Topics: {len(topics_data)}")
        print(f"  - Topic contents: {len(contents_data)}")
        print(f"  - Exams: {len(exams_data)}")
        
        return backup_dir
        
    except Exception as e:
        print(f"\n❌ Backup failed: {str(e)}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Backup AI-generated content from database")
    parser.add_argument("--output-dir", default="backups", help="Output directory for backups")
    args = parser.parse_args()
    
    create_backup(args.output_dir)
