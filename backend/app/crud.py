from sqlalchemy.orm import Session
from . import models, schemas
from uuid import UUID

def get_course(db: Session, course_id: UUID):
    return db.query(models.Course).filter(models.Course.id == course_id).first()

def get_courses(db: Session, skip: int = 0, limit: int = 100, published_only: bool = False):
    query = db.query(models.Course)
    if published_only:
        # Show both fully published and partially published courses
        query = query.filter(models.Course.status.in_(['PUBLISHED', 'PARTIALLY_PUBLISHED']))
    return query.offset(skip).limit(limit).all()

def create_course(db: Session, course: schemas.CourseCreate, creator_id: UUID = None):
    db_course = models.Course(**course.model_dump(), creator_id=creator_id)
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    return db_course

def create_topic(db: Session, topic: schemas.TopicCreate, course_id: UUID):
    db_topic = models.Topic(**topic.model_dump(), course_id=course_id)
    db.add(db_topic)
    db.commit()
    db.refresh(db_topic)
    return db_topic

def get_topics_by_course(db: Session, course_id: UUID):
    return db.query(models.Topic).filter(models.Topic.course_id == course_id).order_by(models.Topic.order).all()

def update_topic_status(db: Session, topic_id: UUID, status: str):
    db_topic = db.query(models.Topic).filter(models.Topic.id == topic_id).first()
    if db_topic:
        db_topic.status = status
        db.commit()
        db.refresh(db_topic)
    return db_topic

def get_topic_content(db: Session, topic_id: UUID):
    return db.query(models.TopicContent).filter(models.TopicContent.topic_id == topic_id).first()

def create_or_update_content(db: Session, content: schemas.TopicContentCreate, topic_id: UUID):
    db_content = get_topic_content(db, topic_id)
    if db_content:
        db_content.content = content.content
        db_content.is_approved = content.is_approved
    else:
        db_content = models.TopicContent(**content.model_dump(), topic_id=topic_id)
        db.add(db_content)
    
    db.commit()
    db.refresh(db_content)
    return db_content

def update_topic(db: Session, topic_id: UUID, topic_update: schemas.TopicUpdate):
    db_topic = db.query(models.Topic).filter(models.Topic.id == topic_id).first()
    if db_topic:
        update_data = topic_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_topic, key, value)
        db.commit()
        db.refresh(db_topic)
    return db_topic

def delete_topic(db: Session, topic_id: UUID):
    db_topic = db.query(models.Topic).filter(models.Topic.id == topic_id).first()
    if db_topic:
        db.delete(db_topic)
        db.commit()
        return True
    return False
