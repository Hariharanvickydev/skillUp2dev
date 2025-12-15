from sqlalchemy.orm import Session, joinedload
from . import models, schemas, auth
from uuid import UUID

def get_course(db: Session, course_id: UUID):
    return db.query(models.Course).filter(models.Course.id == course_id).first()

def get_user(db: Session, user_id: UUID):
    # Eager load organization and group hierarchy for profile/auth
    return db.query(models.User).options(
        joinedload(models.User.organization),
        joinedload(models.User.group).joinedload(models.OrgGroup.parent)
    ).filter(models.User.id == user_id).first()

def get_courses(db: Session, skip: int = 0, limit: int = 100, published_only: bool = False, organization_id: UUID = None):
    query = db.query(models.Course)
    if published_only:
        # Show both fully published and partially published courses
        query = query.filter(models.Course.status.in_(['PUBLISHED', 'PARTIALLY_PUBLISHED']))
    
    if organization_id:
        query = query.filter(models.Course.organization_id == organization_id)
        
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

# --- ORGANIZATION CRUD ---
def get_organizations(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Organization).offset(skip).limit(limit).all()

def get_organization(db: Session, org_id: UUID):
    return db.query(models.Organization).filter(models.Organization.id == org_id).first()

def create_organization(db: Session, organization: schemas.OrganizationBase):
    db_org = models.Organization(**organization.model_dump())
    db.add(db_org)
    db.commit()
    db.refresh(db_org)
    return db_org

def update_organization(db: Session, org_id: UUID, org_update: schemas.OrganizationBase):
    db_org = get_organization(db, org_id)
    if db_org:
        # Simple update for now
        for key, value in org_update.model_dump(exclude_unset=True).items():
            setattr(db_org, key, value)
        db.commit()
        db.refresh(db_org)
    return db_org

# --- DEPARTMENT CRUD REMOVED ---
# Legacy department functions removed in Org Hierarchy Refactor

# --- USER MANAGEMENT CRUD ---
def get_users(db: Session, skip: int = 0, limit: int = 100, organization_id: UUID = None, org_group_id: UUID = None, role: str = None, search: str = None):
    # Eager load groups for hierarchy display
    query = db.query(models.User).options(
        joinedload(models.User.group).joinedload(models.OrgGroup.parent).joinedload(models.OrgGroup.parent)
    )
    
    if organization_id:
        query = query.filter(models.User.organization_id == organization_id)

    if org_group_id:
        query = query.filter(models.User.org_group_id == org_group_id)
    
    if role:
        query = query.filter(models.User.role == role)

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (models.User.full_name.ilike(search_filter)) | 
            (models.User.email.ilike(search_filter)) |
            (models.User.phone.ilike(search_filter)) |
            (models.User.roll_number.ilike(search_filter))
        )
        
    return query.offset(skip).limit(limit).all()

def create_user(db: Session, user: schemas.UserCreate):
    # auth imported at top level
    hashed_password = auth.hash_password(user.password)
    
    # Handle legacy department_id if passed in schema but not model
    # We ignore it here as model doesn't have it.
    
    db_user = models.User(
        email=user.email,
        password_hash=hashed_password,
        full_name=user.full_name,
        role=user.role,
        organization_id=user.organization_id,
        org_group_id=user.org_group_id,
        phone=user.phone,
        year=user.year,
        roll_number=user.roll_number
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user(db: Session, user_id: UUID, user: schemas.UserUpdate):
    db_user = get_user(db, user_id)
    if db_user:
        update_data = user.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_user, key, value)
        db.commit()
        db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: UUID):
    db_user = get_user(db, user_id)
    if db_user:
        db.delete(db_user)
        db.commit()
    return db_user

def reset_password(db: Session, user_id: UUID, new_password: str):
    db_user = get_user(db, user_id)
    if db_user:
        hashed_password = auth.hash_password(new_password)
        db_user.password_hash = hashed_password
        # Force password reset on next login (optional, but good practice)
        db_user.force_password_reset = True
        db.commit()
        db.refresh(db_user)
    return db_user
