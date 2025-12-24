"""
Add this endpoint to backend/app/routers/exams.py after the get_org_exams endpoint
"""

@router.get("/org/stats")
def get_org_exam_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_org_admin)
):
    """
    Get overall exam statistics for the organization dashboard.
    Returns total exams, attempts, avg score, and pass rate.
    """
    from sqlalchemy import func
    
    # Get all exams in the organization
    exam_ids = db.query(models.Exam.id)\
        .join(models.User, models.Exam.created_by_user_id == models.User.id)\
        .filter(models.User.organization_id == current_user.organization_id)\
        .all()
    
    exam_ids = [e[0] for e in exam_ids]
    
    total_exams = len(exam_ids)
    
    if total_exams == 0:
        return {
            "total_exams": 0,
            "total_attempts": 0,
            "overall_avg_score": "N/A",
            "overall_pass_rate": "N/A",
            "active_exams": 0,
            "draft_exams": 0
        }
    
    # Get all attempts for these exams
    attempts = db.query(models.ExamAttempt)\
        .filter(models.ExamAttempt.exam_id.in_(exam_ids))\
        .all()
    
    total_attempts = len(attempts)
    overall_avg_score = "N/A"
    overall_pass_rate = "N/A"
    
    if total_attempts > 0:
        scores = [attempt.score for attempt in attempts]
        overall_avg_score = f"{sum(scores) / len(scores):.1f}%"
        
        passed_count = sum(1 for attempt in attempts if attempt.passed)
        overall_pass_rate = f"{(passed_count / total_attempts * 100):.1f}%"
    
    # Count exams by status
    active_exams = db.query(func.count(models.Exam.id))\
        .join(models.User, models.Exam.created_by_user_id == models.User.id)\
        .filter(
            models.User.organization_id == current_user.organization_id,
            models.Exam.exam_status == 'ACTIVE'
        ).scalar() or 0
    
    draft_exams = db.query(func.count(models.Exam.id))\
        .join(models.User, models.Exam.created_by_user_id == models.User.id)\
        .filter(
            models.User.organization_id == current_user.organization_id,
            models.Exam.exam_status == 'DRAFT'
        ).scalar() or 0
    
    return {
        "total_exams": total_exams,
        "total_attempts": total_attempts,
        "overall_avg_score": overall_avg_score,
        "overall_pass_rate": overall_pass_rate,
        "active_exams": active_exams,
        "draft_exams": draft_exams
    }
