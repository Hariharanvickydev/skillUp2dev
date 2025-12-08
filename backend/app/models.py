import uuid
from sqlalchemy import Column, String, Text, ForeignKey, Integer, JSON, DateTime, func, Uuid, Boolean
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    role = Column(String, default="CONSUMER")  # ADMIN or CONSUMER
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    courses = relationship("Course", back_populates="creator")
    progress = relationship("UserProgress", back_populates="user", cascade="all, delete-orphan")

class Course(Base):
    __tablename__ = "courses"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=True)
    settings = Column(JSON, default={}) # Stores specific constraints (e.g. "Focus on FastAPI")
    status = Column(String, default="DRAFT") # DRAFT, GENERATING, COMPLETED
    creator_id = Column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=True)
    is_published = Column(Boolean, default=False)  # Only published courses visible to consumers
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    topics = relationship("Topic", back_populates="course", cascade="all, delete-orphan")
    creator = relationship("User", back_populates="courses")

class Topic(Base):
    __tablename__ = "topics"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id = Column(Uuid(as_uuid=True), ForeignKey("courses.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    order = Column(Integer, nullable=False)
    status = Column(String, default="PENDING_APPROVAL") # PENDING_APPROVAL, APPROVED, REJECTED
    parent_topic_id = Column(Uuid(as_uuid=True), ForeignKey("topics.id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    course = relationship("Course", back_populates="topics")
    content = relationship("TopicContent", back_populates="topic", uselist=False, cascade="all, delete-orphan")

class TopicContent(Base):
    __tablename__ = "topic_contents"
    
    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    topic_id = Column(Uuid(as_uuid=True), ForeignKey("topics.id"), unique=True, nullable=False)
    content = Column(Text, nullable=False) # Markdown content
    is_approved = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    topic = relationship("Topic", back_populates="content")

class UserProgress(Base):
    __tablename__ = "user_progress"
    
    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=False)
    course_id = Column(Uuid(as_uuid=True), ForeignKey("courses.id"), nullable=False)
    topic_id = Column(Uuid(as_uuid=True), ForeignKey("topics.id"), nullable=True)
    completed = Column(Boolean, default=False)
    last_accessed = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    user = relationship("User", back_populates="progress")
    course = relationship("Course")
    topic = relationship("Topic")
