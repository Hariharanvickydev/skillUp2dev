from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List
from datetime import datetime

from .. import models, database, auth

router = APIRouter(prefix="/progress", tags=["progress"])

@router.post("/topics/{topic_id}/complete")
def mark_topic_complete(
    topic_id: UUID,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Mark a topic as completed for the current user"""
    
    # Get the topic to find the course_id
    topic = db.query(models.Topic).filter(models.Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    
    # Check if progress record already exists
    progress = db.query(models.UserProgress).filter(
        models.UserProgress.user_id == current_user.id,
        models.UserProgress.topic_id == topic_id
    ).first()
    
    if progress:
        # Update existing record
        progress.completed = True
        progress.last_accessed = datetime.utcnow()
    else:
        # Create new progress record
        progress = models.UserProgress(
            user_id=current_user.id,
            course_id=topic.course_id,
            topic_id=topic_id,
            completed=True
        )
        db.add(progress)
    
    db.commit()
    db.refresh(progress)
    
    return {
        "id": progress.id,
        "user_id": progress.user_id,
        "topic_id": progress.topic_id,
        "course_id": progress.course_id,
        "completed": progress.completed,
        "last_accessed": progress.last_accessed
    }

@router.delete("/topics/{topic_id}/complete")
def unmark_topic_complete(
    topic_id: UUID,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Unmark a topic as completed (mark as incomplete)"""
    
    progress = db.query(models.UserProgress).filter(
        models.UserProgress.user_id == current_user.id,
        models.UserProgress.topic_id == topic_id
    ).first()
    
    if progress:
        progress.completed = False
        progress.last_accessed = datetime.utcnow()
        db.commit()
        db.refresh(progress)
        
        return {
            "id": progress.id,
            "completed": progress.completed,
            "last_accessed": progress.last_accessed
        }
    
    return {"message": "No progress record found"}

@router.get("/courses/{course_id}")
def get_course_progress(
    course_id: UUID,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get all progress records for a course for the current user"""
    
    progress_records = db.query(models.UserProgress).filter(
        models.UserProgress.user_id == current_user.id,
        models.UserProgress.course_id == course_id
    ).all()
    
    return [{
        "id": p.id,
        "topic_id": p.topic_id,
        "completed": p.completed,
        "last_accessed": p.last_accessed
    } for p in progress_records]

@router.get("/courses/{course_id}/stats")
def get_course_progress_stats(
    course_id: UUID,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get progress statistics for a course"""
    
    # Get all published sub-topics (topics with parent_topic_id)
    all_topics = db.query(models.Topic).join(
        models.Topic,
        models.Topic.id == models.Topic.parent_topic_id,
        isouter=True
    ).filter(
        models.Topic.course_id == course_id,
        models.Topic.parent_topic_id.isnot(None),  # Only sub-topics
        models.Topic.status == "APPROVED"  # Only approved topics
    ).all()
    
    # Get completed topics for this user
    completed_progress = db.query(models.UserProgress).filter(
        models.UserProgress.user_id == current_user.id,
        models.UserProgress.course_id == course_id,
        models.UserProgress.completed == True
    ).all()
    
    completed_topic_ids = {p.topic_id for p in completed_progress}
    
    # Count only published module topics
    published_topics = []
    for topic in all_topics:
        # Get parent topic to check if module is published
        parent = db.query(models.Topic).filter(
            models.Topic.id == topic.parent_topic_id
        ).first()
        
        if parent and parent.is_published:
            published_topics.append(topic)
    
    total_topics = len(published_topics)
    completed_topics = len([t for t in published_topics if t.id in completed_topic_ids])
    
    percentage = round((completed_topics / total_topics * 100)) if total_topics > 0 else 0
    
    # Get last accessed time
    last_accessed = None
    if completed_progress:
        last_accessed = max(p.last_accessed for p in completed_progress)
    
    return {
        "total_topics": total_topics,
        "completed_topics": completed_topics,
        "percentage": percentage,
        "last_accessed": last_accessed
    }
