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
    current_user: models.User = Depends(auth.require_org_admin),
    db: Session = Depends(database.get_db)
):
    """
    Get high-level stats for the Org Admin Dashboard.
    Restricted to the user's organization.
    """
    if not current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with any organization"
        )
    
    org_id = current_user.organization_id
    
    # 1. Counts
    total_students = db.query(models.User).filter(
        models.User.organization_id == org_id,
        models.User.role == models.UserRole.STUDENT
    ).count()
    
    total_teachers = db.query(models.User).filter(
        models.User.organization_id == org_id,
        models.User.role == models.UserRole.TEACHER
    ).count()
    
    # Courses imported/created in this org
    # Assuming 'organization_id' on Course is set for org-specific courses (imported or created)
    total_courses = db.query(models.Course).filter(
        models.Course.organization_id == org_id
    ).count()
    
    published_courses = db.query(models.Course).filter(
        models.Course.organization_id == org_id,
        models.Course.is_published == True
    ).count()
    
    # Exams Conducted (just a count of exams for now, or exam attempts?)
    # User requested to use "Module Exams" only, not practice.
    # Module exams are linked via 'module_id' and have type='MODULE'.
    total_exams = db.query(models.Exam).join(
        models.Topic, models.Exam.module_id == models.Topic.id
    ).join(models.Course).filter(
        models.Course.organization_id == org_id,
        models.Exam.type == "MODULE"
    ).count()

    # Active Students (last 7 days)
    import datetime
    now = datetime.datetime.utcnow()
    seven_days_ago = now - datetime.timedelta(days=7)
    
    active_students_7d = db.query(models.User).filter(
        models.User.organization_id == org_id,
        models.User.role == models.UserRole.STUDENT,
        models.User.last_login_at >= seven_days_ago
    ).count()

    # Daily Activity for Chart
    daily_activity = []
    # Get last 7 days labels and counts
    for i in range(6, -1, -1):
        day_start = (now - datetime.timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + datetime.timedelta(days=1)
        
        count = db.query(models.User).filter(
            models.User.organization_id == org_id,
            models.User.role == models.UserRole.STUDENT,
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
        "daily_activity": daily_activity,
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
