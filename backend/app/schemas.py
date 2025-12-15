from pydantic import BaseModel, EmailStr
from typing import List, Optional, Any, Dict
from uuid import UUID
from datetime import datetime
from enum import Enum

# --- ENUMS ---
class UserRole(str, Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    ORG_ADMIN = "ORG_ADMIN"
    DEPT_HEAD = "DEPT_HEAD"
    TEACHER = "TEACHER"
    STUDENT = "STUDENT"

class SubscriptionPlan(str, Enum):
    FREE = "FREE"
    PRO = "PRO"
    ENTERPRISE = "ENTERPRISE"

# --- ORGANIZATION & DEPT SCHEMAS ---
class OrgGroupBase(BaseModel):
    name: str
    type: str = "GROUP"
    parent_id: Optional[UUID] = None

    class Config:
        from_attributes = True

class OrgGroupParent(OrgGroupBase):
    id: UUID
    parent: Optional['OrgGroupParent'] = None
    
    class Config:
        from_attributes = True

OrgGroupParent.update_forward_refs()

class OrgGroup(OrgGroupBase):
    id: UUID
    organization_id: UUID
    leader_id: Optional[UUID] = None
    created_at: datetime
    
    # Hierarchy
    parent: Optional[OrgGroupParent] = None
    children: List['OrgGroup'] = [] 
    
    class Config:
        from_attributes = True

# Forward ref for recursive model
OrgGroup.update_forward_refs()

class OrganizationBase(BaseModel):
    name: str
    domain: Optional[str] = None
    # Extended Profile
    code: Optional[str] = None
    type: str = "College"
    logo_url: Optional[str] = None
    status: str = "ACTIVE"
    
    # Address
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    
    # Contact
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None

    class Config:
        from_attributes = True

class OrganizationCreate(OrganizationBase):
    max_students: int = 50
    max_teachers: int = 5
    max_courses: int = 5
    storage_limit_gb: int = 1
    ai_credits_limit: int = 1000

    type: str = "COLLEGE"
    hierarchy_settings: Optional[Dict[str, str]] = {}
    
    # Admin Info
    admin_name: str
    admin_email: str
    admin_phone: Optional[str] = None
    admin_password: str


class Organization(OrganizationBase):
    id: UUID
    is_active: bool
    created_at: datetime
    
    # Limits
    max_students: int
    max_teachers: int
    max_courses: int
    storage_limit_gb: int
    storage_used_gb: int
    ai_credits_limit: int
    ai_credits_used: int

    ai_credits_used: int

    groups: List[OrgGroup] = []
    
    class Config:
        from_attributes = True

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
    is_published: bool = False  # Module-level publishing status
    created_at: datetime
    content: Optional[TopicContent] = None # Include content in nested response if needed

    class Config:
        from_attributes = True

# --- EXAM SCHEMAS ---
class ExamQuestion(BaseModel):
    question: str
    options: List[str]  # 4 options
    correct_index: int
    explanation: str

class ExamGenerateRequest(BaseModel):
    difficulty: str = "medium"  # easy, medium, hard
    num_questions: int = 10

class ExamBase(BaseModel):
    difficulty: str = "medium"
    duration_minutes: int = 30
    passing_score: int = 70
    type: str = "PRACTICE" # PRACTICE, MODULE, FINAL

class ExamCreate(ExamBase):
    topic_id: Optional[UUID] = None
    module_id: Optional[UUID] = None
    course_id: Optional[UUID] = None
    questions: List[Dict[str, Any]]

class Exam(ExamBase):
    id: UUID
    topic_id: Optional[UUID]
    module_id: Optional[UUID] = None
    course_id: Optional[UUID] = None
    questions: List[Dict[str, Any]]
    is_published: bool
    created_at: datetime

    class Config:
        from_attributes = True

# --- IQ SCHEMAS ---
class IQCreate(BaseModel):
    title: str
    content: List[Dict[str, Any]]
    module_id: Optional[UUID] = None
    is_public: bool = False

class ImportantQuestions(BaseModel):
    id: UUID
    title: str
    course_id: UUID
    module_id: Optional[UUID]
    content: List[Dict[str, Any]]
    created_at: datetime
    
    class Config:
        from_attributes = True

# --- COURSE SCHEMAS ---
class CourseBase(BaseModel):
    title: str
    description: Optional[str] = None
    settings: Optional[Dict[str, Any]] = {}
    category: Optional[str] = None
    tags: Optional[List[str]] = []
    difficulty: Optional[str] = "Beginner"
    outcomes: Optional[List[str]] = []

class CourseCreate(CourseBase):
    is_library_course: bool = False
    pass

class Course(CourseBase):
    id: UUID
    status: str
    organization_id: Optional[UUID] = None
    parent_course_id: Optional[UUID] = None
    is_library_course: bool = False
    flags: Dict[str, Any] = {}
    created_at: datetime
    updated_at: datetime
    topics: List[Topic] = []
    
    class Config:
        from_attributes = True

# --- SYNC SCHEMAS ---
class SyncItem(BaseModel):
    library_topic_id: UUID
    action: str  # OVERWRITE, CREATE, IGNORE

class SyncRequest(BaseModel):
    items: List[SyncItem]

# --- USER/AUTH SCHEMAS ---

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    phone: Optional[str] = None
    year: Optional[str] = None
    roll_number: Optional[str] = None

class UserCreate(UserBase):
    password: Optional[str] = None
    role: Optional[str] = "STUDENT"
    organization_id: Optional[UUID] = None
    org_group_id: Optional[UUID] = None # New Hierarchy
    
    department_id: Optional[UUID] = None # Clean up later
    department_name: Optional[str] = None



class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    department_id: Optional[UUID] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None

class PasswordReset(BaseModel):
    new_password: str

class PasswordChange(BaseModel):
    new_password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    id: UUID
    role: str
    organization_id: Optional[UUID] = None
    org_group_id: Optional[UUID] = None
    department_id: Optional[UUID] = None
    is_active: bool
    last_login_at: Optional[datetime] = None
    created_at: datetime
    
    # Optional nested info
    organization: Optional[Organization] = None
    group: Optional[OrgGroup] = None

    class Config:
        from_attributes = True

class UserCreateResponse(User):
    temp_password: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_role: str # Return role in token response for frontend redirect logic
    force_password_reset: bool = False

class TokenData(BaseModel):
    user_id: Optional[UUID] = None
    role: Optional[str] = None

class ExamForStudent(BaseModel):
    """Exam response for students - without correct answers"""
    id: UUID
    topic_id: UUID
    difficulty: str
    duration_minutes: int
    passing_score: int
    questions: List[Dict[str, Any]]  # Without correct_index
    created_at: datetime

class ExamSubmitRequest(BaseModel):
    answers: List[int]  # Array of selected indices

class ExamResult(BaseModel):
    score: int  # percentage
    passed: bool
    correct_answers: List[int]
    explanations: List[str]
    attempt_id: UUID


