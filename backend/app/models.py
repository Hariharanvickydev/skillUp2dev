
import uuid
from sqlalchemy import Column, String, Text, ForeignKey, Integer, JSON, DateTime, func, Uuid, Boolean, Enum
from sqlalchemy.orm import relationship
from .database import Base
import enum

# Use String for Enums to avoid Postgres Enum type complexity in early dev
# Or define Python Enums and use SA Enum type.
# Let's use simple Strings for now to be safe with SQLite compat if needed, 
# although we heavily rely on Postgres now.

class SubscriptionPlan(str, enum.Enum):
    FREE = "FREE"
    PRO = "PRO"
    ENTERPRISE = "ENTERPRISE"

class UserRole(str, enum.Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    ORG_ADMIN = "ORG_ADMIN"
    DEPT_HEAD = "DEPT_HEAD"
    TEACHER = "TEACHER"
    STUDENT = "STUDENT"

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    domain = Column(String, unique=True, index=True, nullable=True) # e.g. "ideas2it.edu"
    subscription_plan = Column(String, default=SubscriptionPlan.FREE)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())

    # Limits and Usage
    max_students = Column(Integer, default=50)
    max_teachers = Column(Integer, default=5)
    max_courses = Column(Integer, default=5)
    storage_limit_gb = Column(Integer, default=1)
    storage_used_gb = Column(Integer, default=0)
    ai_credits_limit = Column(Integer, default=1000)
    ai_credits_used = Column(Integer, default=0)

    # Extended Profile
    code = Column(String, unique=True, index=True, nullable=True) # e.g. "SRM"
    type = Column(String, default="COLLEGE") # SCHOOL, COLLEGE, COMPANY, OTHER
    logo_url = Column(String, nullable=True)
    status = Column(String, default="ACTIVE") # ACTIVE, SUSPENDED, TRIAL, EXPIRED
    
    # Hierarchy Customization
    # e.g. {"level_1": "Standard", "level_2": "Section", "level_3": "Group"}
    hierarchy_settings = Column(JSON, default={}) 

    # Address
    address = Column(String, nullable=True)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    country = Column(String, nullable=True)
    
    # Contact
    contact_email = Column(String, nullable=True)
    contact_phone = Column(String, nullable=True)
    
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # relationships
    groups = relationship("OrgGroup", back_populates="organization", cascade="all, delete-orphan")
    users = relationship("User", back_populates="organization")

class OrgGroup(Base):
    __tablename__ = "org_groups"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(Uuid(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    parent_id = Column(Uuid(as_uuid=True), ForeignKey("org_groups.id"), nullable=True) # Recursive
    
    name = Column(String, nullable=False) # "Class 10-A", "CS Dept"
    type = Column(String, default="GROUP") # "DEPARTMENT", "CLASS", "SECTION", "TEAM"
    
    # Leadership
    leader_id = Column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=True) # Head of Dept, Class Teacher, Team Lead

    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    organization = relationship("Organization", back_populates="groups")
    parent = relationship("OrgGroup", remote_side=[id], back_populates="children")
    children = relationship("OrgGroup", back_populates="parent", cascade="all, delete-orphan")
    
    users = relationship("User", back_populates="group", foreign_keys="[User.org_group_id]")
    leader = relationship("User", foreign_keys=[leader_id])

from sqlalchemy import Table

# Association Table for Course Assignees (Teachers/HODs)
course_assignments = Table(
    "course_assignments",
    Base.metadata,
    Column("course_id", Uuid(as_uuid=True), ForeignKey("courses.id"), primary_key=True),
    Column("user_id", Uuid(as_uuid=True), ForeignKey("users.id"), primary_key=True),
)

class User(Base):
    __tablename__ = "users"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    role = Column(String, default=UserRole.STUDENT)
    
    # Organization Context
    organization_id = Column(Uuid(as_uuid=True), ForeignKey("organizations.id"), nullable=True)
    
    # Hierarchy Context (Replaces department_id)
    org_group_id = Column(Uuid(as_uuid=True), ForeignKey("org_groups.id"), nullable=True)
    
    # Backwards compatibility / Legacy field (Can be removed later)
    # department_id = Column(Uuid(as_uuid=True), ForeignKey("departments.id"), nullable=True)

    # Extended Profile
    phone = Column(String, nullable=True)
    year = Column(String, nullable=True) # e.g. "1", "2", "2024"
    roll_number = Column(String, nullable=True) # e.g. "CS101"

    is_active = Column(Boolean, default=True)
    force_password_reset = Column(Boolean, default=False)
    last_login_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())


    # Relationships
    organization = relationship("Organization", back_populates="users")
    group = relationship("OrgGroup", back_populates="users", foreign_keys=[org_group_id])
    
    @property
    def department_name(self):
        return self.group.name if self.group else None
    
    courses = relationship("Course", back_populates="creator", foreign_keys="[Course.creator_id]")
    assigned_courses = relationship("Course", secondary=course_assignments, back_populates="assignees")
    progress = relationship("UserProgress", back_populates="user", cascade="all, delete-orphan")

class Course(Base):
    __tablename__ = "courses"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=True)
    settings = Column(JSON, default={}) 
    status = Column(String, default="DRAFT") 
    creator_id = Column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=True)
    assigned_teacher_id = Column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=True)

    # Library / Import Logic
    organization_id = Column(Uuid(as_uuid=True), ForeignKey("organizations.id"), nullable=True)
    parent_course_id = Column(Uuid(as_uuid=True), ForeignKey("courses.id"), nullable=True) # If imported
    is_library_course = Column(Boolean, default=False) # If true, it's a master course
    flags = Column(JSON, default={}) # e.g. {"missing_topics": true}

    # New Library Metadata
    category = Column(String, index=True, nullable=True) # e.g. "Computer Science"
    tags = Column(JSON, default=[]) # e.g. ["Python", "Backend"]
    difficulty = Column(String, default="Beginner") # Beginner, Intermediate, Advanced
    outcomes = Column(JSON, default=[]) # e.g. ["Understand Basic Syntax", "Build API"]

    is_published = Column(Boolean, default=False)
    has_pending_updates = Column(Boolean, default=False)  # True when approved content is edited but not re-published
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    topics = relationship("Topic", back_populates="course", cascade="all, delete-orphan")
    creator = relationship("User", back_populates="courses", foreign_keys=[creator_id])
    assigned_teacher = relationship("User", foreign_keys=[assigned_teacher_id])
    assignees = relationship("User", secondary=course_assignments, back_populates="assigned_courses")
    # Added IQ relationship
    important_questions = relationship("ImportantQuestions", back_populates="course", cascade="all, delete-orphan")

class Topic(Base):
    __tablename__ = "topics"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id = Column(Uuid(as_uuid=True), ForeignKey("courses.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    order = Column(Integer, nullable=False)
    status = Column(String, default="PENDING_APPROVAL")
    parent_topic_id = Column(Uuid(as_uuid=True), ForeignKey("topics.id"), nullable=True)
    is_published = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    source_topic_id = Column(Uuid, nullable=True) # ID of the original topic in the library
    last_synced_at = Column(DateTime, nullable=True) # Track when this topic was last synced with library

    course = relationship("Course", back_populates="topics")
    content = relationship("TopicContent", back_populates="topic", uselist=False, cascade="all, delete-orphan")
    # Specify foreign_keys to distinguish from module_id
    exams = relationship("Exam", back_populates="topic", cascade="all, delete-orphan", foreign_keys="[Exam.topic_id]")

    @property
    def has_content(self):
        return self.content is not None

class TopicContent(Base):
    __tablename__ = "topic_contents"
    
    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    topic_id = Column(Uuid(as_uuid=True), ForeignKey("topics.id"), unique=True, nullable=False)
    content = Column(Text, nullable=False) 
    approved_content = Column(Text, nullable=True) # For diffs/live view
    is_approved = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    topic = relationship("Topic", back_populates="content")

class Exam(Base):
    __tablename__ = "exams"
    
    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Can be linked to a Topic (Practice) OR a Module (Assessment) OR a Course (Final)
    topic_id = Column(Uuid(as_uuid=True), ForeignKey("topics.id"), nullable=True)
    module_id = Column(Uuid(as_uuid=True), ForeignKey("topics.id"), nullable=True) # Module is also a Topic
    course_id = Column(Uuid(as_uuid=True), ForeignKey("courses.id"), nullable=True)
    
    type = Column(String, default="PRACTICE") # PRACTICE, MODULE, FINAL
    
    created_by_user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=False)
    questions = Column(JSON, nullable=False) 
    difficulty = Column(String, default="medium") 
    duration_minutes = Column(Integer, default=30)
    passing_score = Column(Integer, default=70)
    is_published = Column(Boolean, default=False)
    is_public = Column(Boolean, default=True)
    num_attempts = Column(Integer, default=0)
    
    created_at = Column(DateTime, server_default=func.now())
    
    topic = relationship("Topic", foreign_keys=[topic_id], back_populates="exams")
    attempts = relationship("ExamAttempt", back_populates="exam", cascade="all, delete-orphan")
    creator = relationship("User")

class ExamAttempt(Base):
    __tablename__ = "exam_attempts"
    
    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    exam_id = Column(Uuid(as_uuid=True), ForeignKey("exams.id"), nullable=False)
    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=False)
    answers = Column(JSON, nullable=False)
    score = Column(Integer)
    passed = Column(Boolean)
    started_at = Column(DateTime, server_default=func.now())
    submitted_at = Column(DateTime, nullable=True)
    
    exam = relationship("Exam", back_populates="attempts")
    user = relationship("User")

class UserProgress(Base):
    __tablename__ = "user_progress"
    
    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=False)
    course_id = Column(Uuid(as_uuid=True), ForeignKey("courses.id"), nullable=False)
    topic_id = Column(Uuid(as_uuid=True), ForeignKey("topics.id"), nullable=True)
    completed = Column(Boolean, default=False)
    is_bookmarked = Column(Boolean, default=False)
    last_accessed = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    user = relationship("User", back_populates="progress")
    course = relationship("Course")
    topic = relationship("Topic")

class ImportantQuestions(Base):
    __tablename__ = "important_questions"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    course_id = Column(Uuid(as_uuid=True), ForeignKey("courses.id"), nullable=False)
    module_id = Column(Uuid(as_uuid=True), ForeignKey("topics.id"), nullable=True)
    created_by_user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=False)
    content = Column(JSON, nullable=False) # Array of Q&A
    is_public = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())

    course = relationship("Course", back_populates="important_questions")
    creator = relationship("User")
