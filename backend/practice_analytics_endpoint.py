@router.get("/{exam_id}/practice-analytics", response_model=schemas.PracticeAnalytics)
def get_practice_analytics(
    exam_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin)
):
    """
    Get practice-specific analytics including learning progression and improvement tracking.
    Only for practice exams.
    """
    exam = db.query(models.Exam).filter(models.Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    if not exam.is_practice:
        raise HTTPException(status_code=400, detail="This endpoint is only for practice exams")
    
    # Get all attempts
    attempts = db.query(models.ExamAttempt).filter(models.ExamAttempt.exam_id == exam_id).all()
    total_attempts = len(attempts)
    
    if total_attempts == 0:
        return {
            "total_attempts": 0,
            "unique_students": 0,
            "avg_attempts_per_student": 0,
            "improvement_rate": 0,
            "learning_curve": [],
            "mastery_stats": [],
            "score_distribution": {}
        }
    
    # Count unique students
    unique_user_ids = set(a.user_id for a in attempts)
    unique_students = len(unique_user_ids)
    avg_attempts = total_attempts / unique_students if unique_students > 0 else 0
    
    # Calculate improvement rate (first vs latest attempt per student)
    first_attempts_total = 0
    latest_attempts_total = 0
    
    for user_id in unique_user_ids:
        user_attempts = [a for a in attempts if a.user_id == user_id]
        user_attempts.sort(key=lambda x: x.started_at or x.submitted_at or datetime.min)
        
        if user_attempts:
            first_attempts_total += user_attempts[0].score
            latest_attempts_total += user_attempts[-1].score
    
    improvement_rate = 0
    if unique_students > 0 and first_attempts_total > 0:
        avg_first = first_attempts_total / unique_students
        avg_latest = latest_attempts_total / unique_students
        improvement_rate = ((avg_latest - avg_first) / avg_first) * 100 if avg_first > 0 else 0
    
    # Build learning curve (average score by attempt number)
    attempt_scores_by_number = {}
    for user_id in unique_user_ids:
        user_attempts = [a for a in attempts if a.user_id == user_id]
        user_attempts.sort(key=lambda x: x.started_at or x.submitted_at or datetime.min)
        
        for idx, attempt in enumerate(user_attempts, 1):
            if idx not in attempt_scores_by_number:
                attempt_scores_by_number[idx] = []
            attempt_scores_by_number[idx].append(attempt.score)
    
    learning_curve = []
    for attempt_num in sorted(attempt_scores_by_number.keys()):
        scores = attempt_scores_by_number[attempt_num]
        learning_curve.append({
            "attempt_number": attempt_num,
            "average_score": round(sum(scores) / len(scores), 1),
            "attempt_count": len(scores)
        })
    
    # Calculate mastery stats (question-level improvement)
    mastery_stats = []
    num_questions = len(exam.questions) if exam.questions else 0
    
    for q_idx in range(num_questions):
        question = exam.questions[q_idx]
        q_text = question.get('question') or question.get('text', f'Question {q_idx + 1}')
        correct_idx = question.get('correct_index')
        
        first_attempt_correct = 0
        first_attempt_total = 0
        latest_attempt_correct = 0
        latest_attempt_total = 0
        
        for user_id in unique_user_ids:
            user_attempts = [a for a in attempts if a.user_id == user_id]
            user_attempts.sort(key=lambda x: x.started_at or x.submitted_at or datetime.min)
            
            if user_attempts:
                # First attempt
                first_answers = user_attempts[0].answers or []
                if isinstance(first_answers, list) and q_idx < len(first_answers):
                    if int(first_answers[q_idx]) == int(correct_idx):
                        first_attempt_correct += 1
                    first_attempt_total += 1
                
                # Latest attempt
                latest_answers = user_attempts[-1].answers or []
                if isinstance(latest_answers, list) and q_idx < len(latest_answers):
                    if int(latest_answers[q_idx]) == int(correct_idx):
                        latest_attempt_correct += 1
                    latest_attempt_total += 1
        
        initial_rate = (first_attempt_correct / first_attempt_total * 100) if first_attempt_total > 0 else 0
        final_rate = (latest_attempt_correct / latest_attempt_total * 100) if latest_attempt_total > 0 else 0
        
        mastery_stats.append({
            "question_index": q_idx,
            "question_text": q_text,
            "initial_success_rate": round(initial_rate, 1),
            "final_success_rate": round(final_rate, 1),
            "improvement": round(final_rate - initial_rate, 1)
        })
    
    # Score distribution (all attempts)
    dist = {"0-20": 0, "21-40": 0, "41-60": 0, "61-80": 0, "81-100": 0}
    for attempt in attempts:
        s = attempt.score
        if s <= 20: dist["0-20"] += 1
        elif s <= 40: dist["21-40"] += 1
        elif s <= 60: dist["41-60"] += 1
        elif s <= 80: dist["61-80"] += 1
        else: dist["81-100"] += 1
    
    return {
        "total_attempts": total_attempts,
        "unique_students": unique_students,
        "avg_attempts_per_student": round(avg_attempts, 1),
        "improvement_rate": round(improvement_rate, 1),
        "learning_curve": learning_curve,
        "mastery_stats": mastery_stats,
        "score_distribution": dist
    }
