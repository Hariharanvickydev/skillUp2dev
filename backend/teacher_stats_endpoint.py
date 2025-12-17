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

    # Get assigned courses
    assigned_courses = db.query(models.Course).filter(
        models.Course.assigned_teacher_id == current_user.id
    ).all()
    
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
