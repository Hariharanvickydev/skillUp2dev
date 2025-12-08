from pydantic import BaseModel
from typing import List, Optional, Any, Dict
from uuid import UUID
from datetime import datetime

# --- CONTENT SCHEMAS ---
class TopicContentBase(BaseModel):
    content: str
    is_approved: bool = False

class TopicContentCreate(TopicContentBase):
    pass

class TopicContent(TopicContentBase):
    id: UUID
    topic_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- TOPIC SCHEMAS ---
class TopicBase(BaseModel):
    title: str
    description: Optional[str] = None
    order: int
    parent_topic_id: Optional[UUID] = None

class TopicCreate(TopicBase):
    parent_topic_id: Optional[UUID] = None

class TopicUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    order: Optional[int] = None
    status: Optional[str] = None

class Topic(TopicBase):
    id: UUID
    course_id: UUID
    status: str
    created_at: datetime
    content: Optional[TopicContent] = None # Include content in nested response if needed

    class Config:
        from_attributes = True

# --- COURSE SCHEMAS ---
class CourseBase(BaseModel):
    title: str
    description: Optional[str] = None
    settings: Optional[Dict[str, Any]] = {}

class CourseCreate(CourseBase):
    pass

class Course(CourseBase):
    id: UUID
    status: str
    created_at: datetime
    updated_at: datetime
    topics: List[Topic] = []

    class Config:
        from_attributes = True

# --- USER/AUTH SCHEMAS ---
from pydantic import EmailStr

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str
    role: Optional[str] = "CONSUMER"  # ADMIN or CONSUMER

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    id: UUID
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    user_id: Optional[UUID] = None
    role: Optional[str] = None
