from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Dict, Any
import datetime
from .. import crud, models, schemas, database, auth

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/global")
def get_global_metrics(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.require_super_admin)
):
    """
    Get global platform metrics:
    - Total Users (Students, Teachers, Org Admins)
    - Active Users (Daily/Weekly/Monthly)
    - Login Trends (Mocked for now or simple aggregation)
    """
    
    total_users = db.query(models.User).filter(models.User.role != "SUPER_ADMIN").count()
    total_students = db.query(models.User).filter(models.User.role == "STUDENT").count()
    total_teachers = db.query(models.User).filter(models.User.role == "TEACHER").count()
    total_org_admins = db.query(models.User).filter(models.User.role == "ORG_ADMIN").count()
    
    # Active users (based on last_login_at)
    now = datetime.datetime.utcnow()
    one_day_ago = now - datetime.timedelta(days=1)
    one_week_ago = now - datetime.timedelta(weeks=1)
    one_month_ago = now - datetime.timedelta(days=30)
    
    daily_active = db.query(models.User).filter(models.User.last_login_at >= one_day_ago).count()
    weekly_active = db.query(models.User).filter(models.User.last_login_at >= one_week_ago).count()
    monthly_active = db.query(models.User).filter(models.User.last_login_at >= one_month_ago).count()
    
    # Login Trends (Mocked for UI demo purposes as we don't have historical login logs table yet)
    # real implementation would need a separate UserActivityLog table
    trends = [
        {"date": (now - datetime.timedelta(days=i)).strftime("%Y-%m-%d"), "count": 10 + i} 
        for i in range(7)
    ]
    
    return {
        "total_users": total_users,
        "total_students": total_students,
        "total_teachers": total_teachers,
        "total_org_admins": total_org_admins,
        "active_users": {
            "daily": daily_active,
            "weekly": weekly_active,
            "monthly": monthly_active
        },
        "login_trends": trends
    }

@router.get("/organizations")
def get_organization_metrics(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.require_super_admin)
):
    """
    Get organization metrics:
    - Total Orgs, New this month, Active, At-risk
    """
    total_orgs = db.query(models.Organization).count()
    
    now = datetime.datetime.utcnow()
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    new_this_month = db.query(models.Organization).filter(models.Organization.created_at >= start_of_month).count()
    
    # "Active" defined as having at least one user logged in recently OR created recently
    # Simplified: "is_active" flag is true
    active_orgs_count = db.query(models.Organization).filter(models.Organization.is_active == True).count()
    
    # "Activation %": Orgs that have imported at least one course
    # We check if (Course.organization_id == Org.id) exists
    # This is a bit heavy, so we might want to optimize.
    # For now: Count distinct organization_ids in Course table
    activated_org_ids = db.query(models.Course.organization_id).filter(models.Course.organization_id != None).distinct().count()
    activation_rate = (activated_org_ids / total_orgs * 100) if total_orgs > 0 else 0
    
    # "At Risk": Inactive or no courses? Let's say Inactive for now
    at_risk_orgs = db.query(models.Organization).filter(models.Organization.is_active == False).all()
    
    return {
        "total_organizations": total_orgs,
        "new_this_month": new_this_month,
        "active_organizations": active_orgs_count,
        "activation_rate": round(activation_rate, 1),
        "at_risk_count": len(at_risk_orgs),
        "at_risk_list": [{"id": o.id, "name": o.name} for o in at_risk_orgs]
    }

@router.get("/learning")
def get_learning_metrics(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.require_super_admin)
):
    """
    Get learning activity metrics:
    - Total Courses, Topics, Exams completed
    - Time spent (Mocked)
    """
    total_courses_global = db.query(models.Course).count()
    # "Imported by orgs": Course where organization_id is NOT None
    total_courses_imported = db.query(models.Course).filter(models.Course.organization_id != None).count()
    
    # Completed topics
    total_topics_completed = db.query(models.UserProgress).filter(
        models.UserProgress.completed == True,
        models.UserProgress.topic_id != None
    ).count()
    
    # Completed exams (ExamAttempts where passed is True or just attempted?)
    # Request says "Total module exams completed"
    total_exams_completed = db.query(models.ExamAttempt).count()
    total_final_exams_completed = db.query(models.ExamAttempt).join(models.Exam).filter(models.Exam.type == "FINAL").count()
    
    return {
        "total_courses_global": total_courses_global,
        "total_courses_imported": total_courses_imported,
        "total_topics_completed": total_topics_completed,
        "total_module_exams_completed": total_exams_completed,
        "total_final_exams_completed": total_final_exams_completed,
        "time_spent_per_day": f"{round((total_topics_completed * 15) / 60, 1)} hrs" # Estimated: 15 mins per topic
    }
