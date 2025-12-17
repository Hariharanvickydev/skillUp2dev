from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any, Optional
from uuid import UUID
import shutil
import os
from fastapi import File, UploadFile

from .. import models, schemas, database, auth

router = APIRouter(
    prefix="/org",
    tags=["Organization"],
    responses={404: {"description": "Not found"}},
)

@router.get("/dashboard/stats", response_model=Dict[str, Any])
def get_org_dashboard_stats(
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(database.get_db)
):
    """
    Get high-level stats for the Dashboard.
    - Org Admin: All stats for Organization.
    - HOD: Stats scoped to their Department (Org Group).
    """
    if current_user.role not in [models.UserRole.ORG_ADMIN, models.UserRole.DEPT_HEAD, models.UserRole.SUPER_ADMIN]:
         raise HTTPException(status_code=403, detail="Not authorized")

    if not current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with any organization"
        )
    
    org_id = current_user.organization_id
    is_hod = current_user.role == models.UserRole.DEPT_HEAD
    group_id = current_user.org_group_id if is_hod else None
    
    # Helper to get all descendant group IDs
    def _get_all_descendant_ids(session: Session, root_group_id: UUID) -> List[UUID]:
        # Recursive fetch
        all_ids = {root_group_id}
        queue = [root_group_id]
        
        while queue:
            current = queue.pop(0)
            children = session.query(models.OrgGroup).filter(models.OrgGroup.parent_id == current).all()
            for child in children:
                if child.id not in all_ids:
                    all_ids.add(child.id)
                    queue.append(child.id)
        return list(all_ids)

    # 1. Counts
    relevant_group_ids = [group_id] if group_id else []
    if is_hod and group_id:
        relevant_group_ids = _get_all_descendant_ids(db, group_id)

    # Students (Filter by relevant groups)
    student_query = db.query(models.User).filter(
        models.User.organization_id == org_id,
        models.User.role == models.UserRole.STUDENT
    )
    if is_hod and relevant_group_ids:
        student_query = student_query.filter(models.User.org_group_id.in_(relevant_group_ids))
    total_students = student_query.count()
    
    # Teachers
    teacher_query = db.query(models.User).filter(
        models.User.organization_id == org_id,
        models.User.role == models.UserRole.TEACHER
    )
    if is_hod and relevant_group_ids:
        teacher_query = teacher_query.filter(models.User.org_group_id.in_(relevant_group_ids))
    total_teachers = teacher_query.count()
    
    # Courses
    # For HOD: Courses assigned to teachers in their group (or subgroups) OR created by them
    course_query = db.query(models.Course).filter(models.Course.organization_id == org_id)
    
    if is_hod and relevant_group_ids:
        # Get courses where:
        # 1. assigned_teacher_id is in the HOD's hierarchy, OR
        # 2. Any assignee (M2M) is in the HOD's hierarchy
        
        # Method 1: assigned_teacher_id check
        teacher_course_ids = db.query(models.Course.id).join(
            models.User, models.Course.assigned_teacher_id == models.User.id
        ).filter(
            models.User.org_group_id.in_(relevant_group_ids),
            models.Course.organization_id == org_id
        ).all()
        teacher_course_ids = [c.id for c in teacher_course_ids]
        
        # Method 2: assignees (M2M) check
        assignee_course_ids = db.query(models.Course.id).join(
            models.Course.assignees
        ).filter(
            models.User.org_group_id.in_(relevant_group_ids),
            models.Course.organization_id == org_id
        ).all()
        assignee_course_ids = [c.id for c in assignee_course_ids]
        
        # Combine both lists
        all_course_ids = list(set(teacher_course_ids + assignee_course_ids))
        
        # Filter courses by combined IDs
        if all_course_ids:
            course_query = course_query.filter(models.Course.id.in_(all_course_ids))
        else:
            # No courses found, return empty query
            course_query = course_query.filter(models.Course.id == None)

    total_courses = course_query.count()
    
    # Published Courses (Reuse query base)
    published_courses = course_query.filter(models.Course.is_published == True).count()
    
    # Pending Approvals (For HOD)
    pending_approvals = 0
    if is_hod:
        course_ids = [c.id for c in course_query.all()]
        if course_ids:
            pending_approvals = db.query(models.Topic).filter(
                models.Topic.course_id.in_(course_ids),
                models.Topic.status == "PENDING_APPROVAL"
            ).count()

    # Exams (Module exams)
    exam_query = db.query(models.Exam).join(
        models.Topic, models.Exam.module_id == models.Topic.id
    ).join(models.Course).filter(
        models.Course.organization_id == org_id,
        models.Exam.type == "MODULE"
    )
    if is_hod and relevant_group_ids:
         exam_query = exam_query.join(models.User, models.Course.assigned_teacher_id == models.User.id).filter(
             models.User.org_group_id.in_(relevant_group_ids)
         )
    total_exams = exam_query.count()

    # Active Students (last 7 days)
    import datetime
    now = datetime.datetime.utcnow()
    seven_days_ago = now - datetime.timedelta(days=7)
    
    active_query = student_query.filter(models.User.last_login_at >= seven_days_ago)
    active_students_7d = active_query.count()

    # Daily Activity for Chart (Scoped)
    daily_activity = []
    for i in range(6, -1, -1):
        day_start = (now - datetime.timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + datetime.timedelta(days=1)
        
        # Re-use student_query base filter logic
        count = student_query.filter(
            models.User.last_login_at >= day_start,
            models.User.last_login_at < day_end
        ).count()
        
        daily_activity.append({
            "name": day_start.strftime("%a"),
            "students": count
        })
    
    # AI Usage
    org = db.query(models.Organization).filter(models.Organization.id == org_id).first()
    ai_credits_used = org.ai_credits_used if org else 0
    ai_credits_limit = org.ai_credits_limit if org else 0
    
    return {
        "total_students": total_students,
        "total_teachers": total_teachers,
        "total_courses": total_courses,
        "published_courses": published_courses,
        "active_students_7d": active_students_7d,
        "exams_conducted": total_exams,
        "pending_approvals": pending_approvals,
        "daily_activity": daily_activity,
        "ai_usage": {
            "used": ai_credits_used,
            "limit": ai_credits_limit
        }
    }

@router.get("/teacher/stats", response_model=Dict[str, Any])
def get_teacher_stats(
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(database.get_db)
):
    """
    Get stats for Teacher Dashboard.
    Shows stats for assigned courses only.
    """
    if current_user.role != models.UserRole.TEACHER:
        raise HTTPException(status_code=403, detail="Only teachers can access this endpoint")

    # Get assigned courses (both primary and M2M)
    # Method 1: Primary assignment (assigned_teacher_id)
    assigned_courses = db.query(models.Course).filter(
        models.Course.assigned_teacher_id == current_user.id
    ).all()
    
    # Method 2: M2M assignees
    all_courses = db.query(models.Course).all()
    for course in all_courses:
        if current_user in course.assignees and course not in assigned_courses:
            assigned_courses.append(course)
    
    course_ids = [c.id for c in assigned_courses]
    
    # Total assigned courses
    total_courses = len(assigned_courses)
    
    # Published courses
    published_courses = sum(1 for c in assigned_courses if c.is_published)
    
    # Topics stats (for these courses)
    draft_topics = 0
    pending_approval = 0
    approved_topics = 0
    
    if course_ids:
        draft_topics = db.query(models.Topic).filter(
            models.Topic.course_id.in_(course_ids),
            models.Topic.status == "DRAFT"
        ).count()
        
        pending_approval = db.query(models.Topic).filter(
            models.Topic.course_id.in_(course_ids),
            models.Topic.status == "PENDING_APPROVAL"
        ).count()
        
        approved_topics = db.query(models.Topic).filter(
            models.Topic.course_id.in_(course_ids),
            models.Topic.status == "APPROVED"
        ).count()
    
    # AI Credits (Organization level)
    org = None
    ai_credits_used = 0
    ai_credits_limit = 0
    
    if current_user.organization_id:
        org = db.query(models.Organization).filter(
            models.Organization.id == current_user.organization_id
        ).first()
        if org:
            ai_credits_used = org.ai_credits_used
            ai_credits_limit = org.ai_credits_limit
    
    return {
        "total_courses": total_courses,
        "published_courses": published_courses,
        "draft_topics": draft_topics,
        "pending_approval": pending_approval,
        "approved_topics": approved_topics,
        "ai_usage": {
            "used": ai_credits_used,
            "limit": ai_credits_limit
        }
    }

@router.get("/info", response_model=schemas.Organization)
def get_my_org_info(
    current_user: models.User = Depends(auth.require_org_admin),
    db: Session = Depends(database.get_db)
):
    if not current_user.organization_id:
        raise HTTPException(status_code=400, detail="No organization assigned")
        
    org = db.query(models.Organization).filter(models.Organization.id == current_user.organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org


class OrgUpdate(schemas.BaseModel):
    contact_phone: Optional[str] = None
    address: Optional[str] = None
    
    class Config:
        orm_mode = True

@router.put("/info", response_model=schemas.Organization)
def update_my_org(
    org_data: OrgUpdate,
    current_user: models.User = Depends(auth.require_org_admin),
    db: Session = Depends(database.get_db)
):
    if not current_user.organization_id:
        raise HTTPException(status_code=400, detail="No organization assigned")
        
    org = db.query(models.Organization).filter(models.Organization.id == current_user.organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    if org_data.contact_phone is not None:
        org.contact_phone = org_data.contact_phone
    if org_data.address is not None:
        org.address = org_data.address
        
    db.commit()
    db.refresh(org)
    return org

@router.post("/logo")
def upload_org_logo(
    file: UploadFile = File(...),
    current_user: models.User = Depends(auth.require_org_admin),
    db: Session = Depends(database.get_db)
):
    if not current_user.organization_id:
        raise HTTPException(status_code=400, detail="No organization assigned")
        
    org = db.query(models.Organization).filter(models.Organization.id == current_user.organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    # Save file
    UPLOAD_DIR = "static/uploads"
    # Ensure dir exists (redundant if main.py handles it, but safe)
    if not os.path.exists(UPLOAD_DIR):
        os.makedirs(UPLOAD_DIR)
        
    file_ext = file.filename.split(".")[-1]
    file_name = f"{org.id}_logo.{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, file_name)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Update DB
    # Construct URL (Assuming localhost for dev or relative)
    # Ideally should be full URL or relative path handled by frontend
    logo_url = f"http://localhost:8000/static/uploads/{file_name}" 
    org.logo_url = logo_url
    
    db.commit()
    db.refresh(org)
    
    return {"logo_url": logo_url}
