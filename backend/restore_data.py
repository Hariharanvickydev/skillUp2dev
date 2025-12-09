"""
Database Restore Script

This script restores AI-generated content from JSON backup files to the database.
It restores courses, topics, topic content, and exams with their original UUIDs.

Usage:
    python restore_data.py BACKUP_DIR

Example:
    python restore_data.py backups/backup_20241209_120000
"""

import os
import json
import argparse
import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app import models

def parse_datetime(date_str):
    """Parse ISO format datetime string"""
    if date_str:
        return datetime.fromisoformat(date_str)
    return None

def restore_users(db: Session, backup_dir: str):
    """Restore admin users"""
    filepath = os.path.join(backup_dir, "users.json")
    if not os.path.exists(filepath):
        print("  ⚠️  No users.json found, skipping users")
        return 0
    
    with open(filepath, "r") as f:
        users_data = json.load(f)
    
    count = 0
    for user_dict in users_data:
        # Check if user already exists
        existing = db.query(models.User).filter(
            models.User.id == uuid.UUID(user_dict["id"])
        ).first()
        
        if existing:
            print(f"  ⏭️  User {user_dict['email']} already exists, skipping")
            continue
        
        user = models.User(
            id=uuid.UUID(user_dict["id"]),
            email=user_dict["email"],
            password_hash=user_dict["password_hash"],
            full_name=user_dict.get("full_name"),
            role=user_dict["role"],
            is_active=user_dict.get("is_active", True),
            created_at=parse_datetime(user_dict.get("created_at"))
        )
        db.add(user)
        count += 1
    
    db.commit()
    return count

def restore_courses(db: Session, backup_dir: str):
    """Restore courses"""
    filepath = os.path.join(backup_dir, "courses.json")
    if not os.path.exists(filepath):
        print("  ⚠️  No courses.json found, skipping courses")
        return 0
    
    with open(filepath, "r") as f:
        courses_data = json.load(f)
    
    count = 0
    for course_dict in courses_data:
        # Check if course already exists
        existing = db.query(models.Course).filter(
            models.Course.id == uuid.UUID(course_dict["id"])
        ).first()
        
        if existing:
            print(f"  ⏭️  Course '{course_dict['title']}' already exists, skipping")
            continue
        
        course = models.Course(
            id=uuid.UUID(course_dict["id"]),
            title=course_dict["title"],
            description=course_dict.get("description"),
            settings=course_dict.get("settings", {}),
            status=course_dict.get("status", "DRAFT"),
            creator_id=uuid.UUID(course_dict["creator_id"]) if course_dict.get("creator_id") else None,
            is_published=course_dict.get("is_published", False),
            created_at=parse_datetime(course_dict.get("created_at")),
            updated_at=parse_datetime(course_dict.get("updated_at"))
        )
        db.add(course)
        count += 1
    
    db.commit()
    return count

def restore_topics(db: Session, backup_dir: str):
    """Restore topics"""
    filepath = os.path.join(backup_dir, "topics.json")
    if not os.path.exists(filepath):
        print("  ⚠️  No topics.json found, skipping topics")
        return 0
    
    with open(filepath, "r") as f:
        topics_data = json.load(f)
    
    count = 0
    for topic_dict in topics_data:
        # Check if topic already exists
        existing = db.query(models.Topic).filter(
            models.Topic.id == uuid.UUID(topic_dict["id"])
        ).first()
        
        if existing:
            print(f"  ⏭️  Topic '{topic_dict['title']}' already exists, skipping")
            continue
        
        topic = models.Topic(
            id=uuid.UUID(topic_dict["id"]),
            course_id=uuid.UUID(topic_dict["course_id"]),
            title=topic_dict["title"],
            description=topic_dict.get("description"),
            order=topic_dict["order"],
            status=topic_dict.get("status", "PENDING_APPROVAL"),
            parent_topic_id=uuid.UUID(topic_dict["parent_topic_id"]) if topic_dict.get("parent_topic_id") else None,
            created_at=parse_datetime(topic_dict.get("created_at"))
        )
        db.add(topic)
        count += 1
    
    db.commit()
    return count

def restore_topic_contents(db: Session, backup_dir: str):
    """Restore topic contents"""
    filepath = os.path.join(backup_dir, "topic_contents.json")
    if not os.path.exists(filepath):
        print("  ⚠️  No topic_contents.json found, skipping topic contents")
        return 0
    
    with open(filepath, "r") as f:
        contents_data = json.load(f)
    
    count = 0
    for content_dict in contents_data:
        # Check if content already exists
        existing = db.query(models.TopicContent).filter(
            models.TopicContent.id == uuid.UUID(content_dict["id"])
        ).first()
        
        if existing:
            print(f"  ⏭️  Content for topic {content_dict['topic_id']} already exists, skipping")
            continue
        
        content = models.TopicContent(
            id=uuid.UUID(content_dict["id"]),
            topic_id=uuid.UUID(content_dict["topic_id"]),
            content=content_dict["content"],
            is_approved=content_dict.get("is_approved", False),
            created_at=parse_datetime(content_dict.get("created_at")),
            updated_at=parse_datetime(content_dict.get("updated_at"))
        )
        db.add(content)
        count += 1
    
    db.commit()
    return count

def restore_exams(db: Session, backup_dir: str):
    """Restore exams"""
    filepath = os.path.join(backup_dir, "exams.json")
    if not os.path.exists(filepath):
        print("  ⚠️  No exams.json found, skipping exams")
        return 0
    
    with open(filepath, "r") as f:
        exams_data = json.load(f)
    
    count = 0
    for exam_dict in exams_data:
        # Check if exam already exists
        existing = db.query(models.Exam).filter(
            models.Exam.id == uuid.UUID(exam_dict["id"])
        ).first()
        
        if existing:
            print(f"  ⏭️  Exam {exam_dict['id']} already exists, skipping")
            continue
        
        exam = models.Exam(
            id=uuid.UUID(exam_dict["id"]),
            topic_id=uuid.UUID(exam_dict["topic_id"]),
            created_by_user_id=uuid.UUID(exam_dict["created_by_user_id"]),
            questions=exam_dict["questions"],
            difficulty=exam_dict.get("difficulty", "medium"),
            duration_minutes=exam_dict.get("duration_minutes", 30),
            passing_score=exam_dict.get("passing_score", 70),
            is_published=exam_dict.get("is_published", False),
            is_public=exam_dict.get("is_public", True),
            num_attempts=exam_dict.get("num_attempts", 0),
            created_at=parse_datetime(exam_dict.get("created_at"))
        )
        db.add(exam)
        count += 1
    
    db.commit()
    return count

def restore_backup(backup_dir: str):
    """Restore a complete backup"""
    if not os.path.exists(backup_dir):
        print(f"❌ Backup directory not found: {backup_dir}")
        return
    
    # Check for metadata
    metadata_path = os.path.join(backup_dir, "metadata.json")
    if os.path.exists(metadata_path):
        with open(metadata_path, "r") as f:
            metadata = json.load(f)
        print(f"📦 Restoring backup from: {metadata.get('backup_date')}")
        print(f"📁 Location: {backup_dir}\n")
    else:
        print(f"📁 Restoring from: {backup_dir}\n")
    
    db = SessionLocal()
    try:
        # Restore in order (respecting foreign keys)
        print("Restoring users...")
        users_count = restore_users(db, backup_dir)
        print(f"  ✓ Restored {users_count} users\n")
        
        print("Restoring courses...")
        courses_count = restore_courses(db, backup_dir)
        print(f"  ✓ Restored {courses_count} courses\n")
        
        print("Restoring topics...")
        topics_count = restore_topics(db, backup_dir)
        print(f"  ✓ Restored {topics_count} topics\n")
        
        print("Restoring topic contents...")
        contents_count = restore_topic_contents(db, backup_dir)
        print(f"  ✓ Restored {contents_count} topic contents\n")
        
        print("Restoring exams...")
        exams_count = restore_exams(db, backup_dir)
        print(f"  ✓ Restored {exams_count} exams\n")
        
        print("✅ Restore completed successfully!")
        print(f"\nRestore summary:")
        print(f"  - Users: {users_count}")
        print(f"  - Courses: {courses_count}")
        print(f"  - Topics: {topics_count}")
        print(f"  - Topic contents: {contents_count}")
        print(f"  - Exams: {exams_count}")
        
    except Exception as e:
        print(f"\n❌ Restore failed: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Restore AI-generated content from backup")
    parser.add_argument("backup_dir", help="Path to backup directory")
    args = parser.parse_args()
    
    restore_backup(args.backup_dir)
