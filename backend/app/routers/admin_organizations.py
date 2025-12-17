
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app import models, schemas, database, auth
from app.auth import hash_password
import uuid
import datetime
import random

router = APIRouter(
    prefix="/admin/organizations",
    tags=["Super Admin Organization Management"]
)

@router.get("/{id}", response_model=schemas.Organization)
def get_organization(
    id: uuid.UUID,
    current_user: models.User = Depends(auth.require_super_admin),
    db: Session = Depends(database.get_db)
):
    org = db.query(models.Organization).filter(models.Organization.id == id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org

@router.post("/", response_model=schemas.Organization)
def create_organization(
    org_data: schemas.OrganizationCreate,
    current_user: models.User = Depends(auth.require_super_admin),
    db: Session = Depends(database.get_db)
):
    # Check for existing domain or code
    if org_data.domain and db.query(models.Organization).filter(models.Organization.domain == org_data.domain).first():
        raise HTTPException(status_code=400, detail="Domain already exists")
    
    if org_data.code and db.query(models.Organization).filter(models.Organization.code == org_data.code).first():
        raise HTTPException(status_code=400, detail="Organization code already exists")

    # Check for existing admin email
    if db.query(models.User).filter(models.User.email == org_data.admin_email).first():
        raise HTTPException(status_code=400, detail="Admin email already registered")

    # Transactional Creation
    try:
        # 1. Create Organization
        new_org = models.Organization(
            name=org_data.name,
            domain=org_data.domain,
            code=org_data.code,
            type=org_data.type,
            subscription_plan="FREE", 
            is_active=(org_data.status == "ACTIVE"),
            status=org_data.status,
            logo_url=org_data.logo_url,
            address=org_data.address,
            city=org_data.city,
            state=org_data.state,
            country=org_data.country,
            contact_email=org_data.contact_email,
            contact_phone=org_data.contact_phone,
            # Limits
            max_students=org_data.max_students,
            max_teachers=org_data.max_teachers,
            max_courses=org_data.max_courses,
            ai_credits_limit=org_data.ai_credits_limit
        )
        db.add(new_org)
        db.flush() # Get ID

        # 2. Create Org Admin User
        admin_user = models.User(
            email=org_data.admin_email,
            full_name=org_data.admin_name,
            password_hash=hash_password(org_data.admin_password),
            role=models.UserRole.ORG_ADMIN,
            organization_id=new_org.id,
            is_active=True
        )
        db.add(admin_user)
        
        db.commit()
        db.refresh(new_org)
        
        return new_org

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

from typing import List, Optional

@router.get("/{id}/users", response_model=List[schemas.User])
def get_organization_users(
    id: uuid.UUID,
    role: Optional[models.UserRole] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(auth.require_super_admin),
    db: Session = Depends(database.get_db)
):
    query = db.query(models.User).filter(models.User.organization_id == id)
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

import secrets
import string

def generate_temp_password(length=8):
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    return "".join(secrets.choice(alphabet) for i in range(length))

@router.post("/{id}/users", response_model=schemas.UserCreateResponse)
def create_organization_user(
    id: uuid.UUID,
    user_data: schemas.UserCreate,
    current_user: models.User = Depends(auth.require_super_admin),
    db: Session = Depends(database.get_db)
):
    # Check if org exists
    org = db.query(models.Organization).filter(models.Organization.id == id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    # Check if email exists
    if db.query(models.User).filter(models.User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Check limits
    if user_data.role == models.UserRole.TEACHER:
        current_teachers = db.query(models.User).filter(
            models.User.organization_id == id, models.User.role == models.UserRole.TEACHER
        ).count()
        if current_teachers >= org.max_teachers:
             raise HTTPException(status_code=400, detail=f"Teacher limit reached (Max: {org.max_teachers})")
    elif user_data.role == models.UserRole.STUDENT:
        current_students = db.query(models.User).filter(
            models.User.organization_id == id, models.User.role == models.UserRole.STUDENT
        ).count()
        if current_students >= org.max_students:
             raise HTTPException(status_code=400, detail=f"Student limit reached (Max: {org.max_students})")

    # Handle Password
    temp_password = None
    force_reset = False
    
    if not user_data.password:
        temp_password = generate_temp_password()
        hashed_pw = hash_password(temp_password)
        force_reset = True
    else:
        hashed_pw = hash_password(user_data.password)

    # Handle Department/Group Name (Hierarchy Support)
    group_id = user_data.org_group_id
    if user_data.department_name:
        # Organization is already fetched as 'org' above
        org_type = org.type if org.type else "COLLEGE"
        
        group_type = "DEPARTMENT"
        if org_type == "SCHOOL":
            group_type = "STANDARD"
            
        group = db.query(models.OrgGroup).filter(
            models.OrgGroup.organization_id == id,
            func.lower(models.OrgGroup.name) == user_data.department_name.lower(),
            models.OrgGroup.parent_id == None
        ).first()
        
        if group:
            group_id = group.id
        else:
            new_group = models.OrgGroup(
                organization_id=id,
                name=user_data.department_name,
                type=group_type
            )
            db.add(new_group)
            db.flush()
            group_id = new_group.id

    # Create User
    new_user = models.User(
        email=user_data.email,
        full_name=user_data.full_name,
        password_hash=hashed_pw,
        role=user_data.role,
        organization_id=id,
        org_group_id=group_id, # New Hierarchy
        # department_id=user_data.department_id, # Legacy removed
        phone=user_data.phone,
        year=user_data.year,
        roll_number=user_data.roll_number,
        is_active=True,
        force_password_reset=force_reset,
        created_at=datetime.datetime.utcnow()
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Attach temp_password for response schema
    new_user.temp_password = temp_password
    
    return new_user

@router.put("/users/{user_id}", response_model=schemas.User)
def update_organization_user(
    user_id: uuid.UUID,
    user_update: schemas.UserUpdate, # We need to ensure UserUpdate schema exists or create a local Pydantic model
    current_user: models.User = Depends(auth.require_super_admin),
    db: Session = Depends(database.get_db)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user_update.full_name is not None: user.full_name = user_update.full_name
    if user_update.phone is not None: user.phone = user_update.phone
    # if user_update.department_id is not None: user.department_id = user_update.department_id # Legacy removed
    if user_update.role is not None: user.role = user_update.role
    if user_update.is_active is not None: user.is_active = user_update.is_active
    
    user.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(user)
    return user

@router.put("/users/{user_id}/reset-password")
def reset_user_password(
    user_id: uuid.UUID,
    password_data: schemas.PasswordReset, # Ensure schema exists
    current_user: models.User = Depends(auth.require_super_admin),
    db: Session = Depends(database.get_db)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.password_hash = hash_password(password_data.new_password)
    user.updated_at = datetime.datetime.utcnow()
    db.commit()
    return {"message": "Password updated successfully"}

@router.delete("/users/{user_id}")
def delete_organization_user(
    user_id: uuid.UUID,
    current_user: models.User = Depends(auth.require_super_admin),
    db: Session = Depends(database.get_db)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Check if user is the last Org Admin (optional safety check)
    if user.role == models.UserRole.ORG_ADMIN:
        admin_count = db.query(models.User).filter(
            models.User.organization_id == user.organization_id, 
            models.User.role == models.UserRole.ORG_ADMIN
        ).count()
        if admin_count <= 1:
            raise HTTPException(status_code=400, detail="Cannot delete the last Organization Admin")

    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}

@router.put("/{id}/limits", response_model=schemas.Organization)
def update_organization_limits(
    id: uuid.UUID,
    max_students: Optional[int] = None,
    max_teachers: Optional[int] = None,
    max_courses: Optional[int] = None,
    ai_credits_limit: Optional[int] = None,
    current_user: models.User = Depends(auth.require_super_admin),
    db: Session = Depends(database.get_db)
):
    org = db.query(models.Organization).filter(models.Organization.id == id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    if max_students is not None: org.max_students = max_students
    if max_teachers is not None: org.max_teachers = max_teachers
    if max_courses is not None: org.max_courses = max_courses
    if ai_credits_limit is not None: org.ai_credits_limit = ai_credits_limit
    
    db.commit()
    db.refresh(org)
    return org

@router.put("/{id}/status")
def update_organization_status(
    id: uuid.UUID,
    is_active: bool,
    current_user: models.User = Depends(auth.require_super_admin),
    db: Session = Depends(database.get_db)
):
    org = db.query(models.Organization).filter(models.Organization.id == id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    org.is_active = is_active
    db.commit()
    return {"message": "Status updated"}

@router.get("/{id}/dashboard")
def get_organization_dashboard(
    id: uuid.UUID,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(database.get_db)
):
    # Permission Check
    if current_user.role != models.UserRole.SUPER_ADMIN:
        if current_user.organization_id != id:
            raise HTTPException(status_code=403, detail="Not authorized to view this organization")
    
    # 1. Basic Org Info
    org = db.query(models.Organization).filter(models.Organization.id == id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    # 2. Key Metrics
    total_students = db.query(models.User).filter(
        models.User.organization_id == id, models.User.role == "STUDENT"
    ).count()
    
    total_teachers = db.query(models.User).filter(
        models.User.organization_id == id, models.User.role == "TEACHER"
    ).count()
    
    # Courses imported/created by this org's users (usually Org Admin or Teachers) OR strictly linked to org
    # Assuming 'organization_id' on Course is the key link
    total_courses_imported = db.query(models.Course).filter(models.Course.organization_id == id).count()
    published_courses = db.query(models.Course).filter(
        models.Course.organization_id == id, models.Course.is_published == True
    ).count()
    
    # Active Students (Last 7 days)
    seven_days_ago = datetime.datetime.utcnow() - datetime.timedelta(days=7)
    active_students = db.query(models.User).filter(
        models.User.organization_id == id, 
        models.User.role == "STUDENT",
        models.User.last_login_at >= seven_days_ago
    ).count()
    
    # Exams Conducted (Attempts by users of this org)
    total_exams_conducted = db.query(models.ExamAttempt).join(models.User).filter(
        models.User.organization_id == id
    ).count()
    
    # 3. Charts Data
    
    # A. Weekly Active Users Trend (Last 7 days)
    # Mocking this slightly as we don't have DailyActiveUser table yet
    # We will return random variance around the current "active_students" count for demo
    weekly_activity = []
    for i in range(7):
        date = (datetime.datetime.utcnow() - datetime.timedelta(days=i)).strftime("%Y-%m-%d")
        # Simulating data: random integer between Active/2 and Active
        import random
        base_val = active_students if active_students > 0 else total_students // 2
        count = random.randint(max(0, int(base_val * 0.5)), max(1, int(base_val * 1.2)))
        weekly_activity.append({"date": date, "users": count})
    weekly_activity.reverse() # Oldest to newest
    
    # B. Learning Activity (Topic Completions)
    completed_topics_count = db.query(models.UserProgress).join(models.User).filter(
        models.User.organization_id == id,
        models.UserProgress.completed == True
    ).count()
    
    # 4. Course Summary (Mini Table)
    recent_courses = db.query(models.Course).filter(
        models.Course.organization_id == id
    ).order_by(models.Course.updated_at.desc()).limit(5).all()
    
    course_summary = []
    for c in recent_courses:
        student_count = db.query(models.UserProgress).filter(models.UserProgress.course_id == c.id).distinct(models.UserProgress.user_id).count() 
        # Using UserProgress as proxy for enrollment
        course_summary.append({
            "id": c.id,
            "title": c.title,
            "teachers": 1, # Placeholder, multiple teachers not yet fully modeled per course
            "students_enrolled": student_count,
            "status": "Published" if c.is_published else "Draft",
            "progress": random.randint(10, 90) # Mock aggregate progress for demo
        })
        
    # 5. Teacher Activity Summary (Simplified)
    # Find active teachers
    active_teachers_list = db.query(models.User).filter(
        models.User.organization_id == id, models.User.role == "TEACHER"
    ).limit(5).all()
    
    teacher_stats = []
    for t in active_teachers_list:
        courses_created = db.query(models.Course).filter(models.Course.creator_id == t.id).count()
        teacher_stats.append({
            "name": t.full_name,
            "courses_created": courses_created,
            "status": "Active" if t.is_active else "Inactive"
        })
        
    # 6. Activity Feed (Derived/Mocked Union)
    # Combining recent events
    activity_feed = []
    
    # Recent users
    recent_users = db.query(models.User).filter(models.User.organization_id == id).order_by(models.User.created_at.desc()).limit(5).all()
    for u in recent_users:
        activity_feed.append({
            "type": "USER_JOINED",
            "message": f"New {u.role.lower()} {u.full_name} joined",
            "date": u.created_at
        })
        
    # Recent courses
    recent_courses_created = db.query(models.Course).filter(models.Course.organization_id == id).order_by(models.Course.created_at.desc()).limit(3).all()
    for c in recent_courses_created:
        activity_feed.append({
            "type": "COURSE_CREATED",
            "message": f"Course '{c.title}' was imported/created",
            "date": c.created_at
        })

    # Sort by date desc
    activity_feed.sort(key=lambda x: x["date"], reverse=True)
    
    return {
        "summary": {
            "name": org.name,
            "code": org.code,
            "type": org.type,
            "plan": org.subscription_plan,
            "status": org.status,
            "logo_url": org.logo_url,
            "created_at": org.created_at,
            "last_active": org.updated_at,
            # Contact Info for Settings Page
            "contact_email": org.contact_email,
            "contact_phone": org.contact_phone,
            "address": org.address,
            "city": org.city,
            "state": org.state,
            "country": org.country
        },
        "limits": {
            "max_students": org.max_students,
            "current_students": total_students,
             "max_teachers": org.max_teachers,
            "current_teachers": total_teachers,
            "max_courses": org.max_courses,
            "current_courses": total_courses_imported,
            "ai_usage_percent": int((org.ai_credits_used / org.ai_credits_limit) * 100) if org.ai_credits_limit > 0 else 0
        },
        "metrics": {
            "total_students": total_students,
            "total_teachers": total_teachers,
            "total_courses": total_courses_imported,
            "published_courses": published_courses,
            "active_students_7d": active_students,
            "total_exams": total_exams_conducted,
            "ai_credits_used": org.ai_credits_used,
            "storage_used_gb": org.storage_used_gb
        },
        "charts": {
            "weekly_activity": weekly_activity,
            "learning_progress": [{"name": "Completed", "value": completed_topics_count}, {"name": "In Progress", "value": total_students * 5}], # Mock relative
        },
        "course_summary": course_summary,
        "teacher_stats": teacher_stats,
        "activity_feed": activity_feed
    }
