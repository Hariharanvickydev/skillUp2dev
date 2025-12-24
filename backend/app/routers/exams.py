from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
import google.generativeai as genai
import json
import os
from uuid import UUID

from ..database import get_db
from .. import models, schemas
from .. import auth

router = APIRouter(prefix="/exams", tags=["exams"])

# Configure Gemini (Moved to central ai.py)
# genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def aggregate_topic_content(db: Session, topic_ids: List[UUID], max_length: int = 8000) -> str:
    """
    Aggregate content from multiple topics for Module/Course-level exams.
    Returns combined content truncated to max_length.
    """
    combined_content = []
    
    for topic_id in topic_ids:
        topic = db.query(models.Topic).filter(models.Topic.id == topic_id).first()
        if not topic:
            continue
            
        content = db.query(models.TopicContent).filter(
            models.TopicContent.topic_id == topic_id
        ).first()
        
        if content and content.content:
            combined_content.append(f"## {topic.title}\n{content.content[:2000]}")
    
    full_content = "\n\n".join(combined_content)
    return full_content[:max_length]

# ============================================================================
# VALIDATION FUNCTIONS
# ============================================================================

def validate_exam_for_publishing(exam: models.Exam):
    """
    Validate exam before allowing it to be published.
    Ensures data integrity across all creation modes (AI, MANUAL, IMPORT).
    """
    errors = []
    
    # 1. Must have at least 1 question
    if not exam.questions or len(exam.questions) == 0:
        errors.append("Exam must have at least 1 question")
        raise HTTPException(status_code=400, detail={"message": "Validation failed", "errors": errors})
    
    # 2. Validate each question
    for idx, question in enumerate(exam.questions):
        q_num = idx + 1
        
        # Must have question text
        if not question.get('question'):
            errors.append(f"Question {q_num}: Missing question text")
        
        # Must have at least 2 options
        if not question.get('options') or len(question['options']) < 2:
            errors.append(f"Question {q_num}: Must have at least 2 options")
        
        # Must have correct answer
        if 'correct_index' not in question:
            errors.append(f"Question {q_num}: Missing correct answer")
        
        # Correct index must be valid
        correct_idx = question.get('correct_index')
        if correct_idx is not None:
            options_count = len(question.get('options', []))
            if correct_idx < 0 or correct_idx >= options_count:
                errors.append(f"Question {q_num}: Invalid correct answer index ({correct_idx} out of range 0-{options_count-1})")
    
    if errors:
        raise HTTPException(status_code=400, detail={
            "message": "Exam validation failed",
            "errors": errors
        })
    
    return True

def lock_exam_on_first_attempt(exam_id: UUID, db: Session):
    """
    Lock exam questions after first attempt to prevent data corruption.
    Called automatically when first ExamAttempt is created.
    """
    from datetime import datetime
    
    exam = db.query(models.Exam).filter(models.Exam.id == exam_id).first()
    
    if exam and not exam.is_locked:
        exam.is_locked = True
        exam.locked_at = datetime.utcnow()
        db.commit()
        return True
    return False

# ============================================================================
# MANUAL EXAM CREATION ENDPOINTS
# ============================================================================

@router.post("/manual")
def create_manual_exam(
    exam_in: schemas.ExamCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """
    Create exam manually (teachers only).
    Students cannot access this endpoint.
    """
    # Role check - Students can ONLY use AI generation
    if current_user.role == 'STUDENT':
        raise HTTPException(
            status_code=403,
            detail="Students can only create practice exams via AI generation"
        )
    
    # Determine owner_type
    owner_type = 'TEACHER' if current_user.role in ['TEACHER', 'ORG_ADMIN', 'DEPT_HEAD'] else 'SYSTEM'
    
    # Generate exam title based on type and scope
    exam_title = None
    if exam_in.type == 'PRACTICE':
        if exam_in.scope == 'TOPIC' and exam_in.topic_id:
            topic = db.query(models.Topic).filter(models.Topic.id == exam_in.topic_id).first()
            exam_title = f"{topic.title} - Practice" if topic else "Topic Practice"
        elif exam_in.scope == 'MODULE' and exam_in.topic_id:
            module = db.query(models.Topic).filter(models.Topic.id == exam_in.topic_id).first()
            exam_title = f"{module.title} - Practice" if module else "Module Practice"
        elif exam_in.scope == 'COURSE' and exam_in.course_id:
            course = db.query(models.Course).filter(models.Course.id == exam_in.course_id).first()
            exam_title = f"{course.title} - Full Course Practice" if course else "Full Course Practice"
    elif exam_in.type == 'TOPIC_TEST' and exam_in.topic_id:
        topic = db.query(models.Topic).filter(models.Topic.id == exam_in.topic_id).first()
        exam_title = f"{topic.title} - Test" if topic else "Topic Test"
    elif exam_in.type == 'MODULE' and exam_in.topic_id:
        module = db.query(models.Topic).filter(models.Topic.id == exam_in.topic_id).first()
        exam_title = f"{module.title} - Exam" if module else "Module Exam"
    elif exam_in.type == 'FINAL' and exam_in.course_id:
        course = db.query(models.Course).filter(models.Course.id == exam_in.course_id).first()
        exam_title = f"{course.title} - Final Exam" if course else "Final Exam"
    
    # Fallback title
    if not exam_title:
        exam_title = f"{exam_in.type} Exam"
    
    # Create exam
    exam = models.Exam(
        title=exam_title,  # Add auto-generated title
        topic_id=exam_in.topic_id,
        course_id=exam_in.course_id,
        module_id=exam_in.module_id,
        type=exam_in.type,
        scope=exam_in.scope,  # Add scope support
        created_by_user_id=current_user.id,
        questions=exam_in.questions, 
        difficulty=exam_in.difficulty,
        duration_minutes=exam_in.duration_minutes,
        passing_score=exam_in.passing_score,
        creation_mode='MANUAL',
        owner_type=owner_type,
        exam_status='DRAFT',  # Start as draft
        is_published=False,
        is_public=exam_in.type == 'PRACTICE'
    )
    
    db.add(exam)
    db.commit()
    db.refresh(exam)
    
    return {
        "message": "Manual exam created successfully",
        "exam_id": str(exam.id),
        "status": "DRAFT"
    }

@router.put("/manual/{exam_id}")
def update_manual_exam(
    exam_id: UUID,
    exam_in: schemas.ExamCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """
    Update manual exam metadata (teachers only).
    Does NOT update questions (use /questions endpoint).
    """
    exam = db.query(models.Exam).filter(models.Exam.id == exam_id).first()
    
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # Check ownership
    if exam.created_by_user_id != current_user.id:
        if current_user.role not in ['ADMIN', 'SUPER_ADMIN', 'ORG_ADMIN']:
            raise HTTPException(status_code=403, detail="Not authorized to edit this exam")
    
    # Check lock
    if exam.is_locked:
        raise HTTPException(status_code=403, detail="Cannot edit exam after students have attempted it")
    
    # Update fields
    exam.topic_id = exam_in.topic_id
    exam.course_id = exam_in.course_id
    exam.module_id = exam_in.module_id
    exam.type = exam_in.type
    exam.scope = exam_in.scope  # Add scope support
    exam.difficulty = exam_in.difficulty
    exam.duration_minutes = exam_in.duration_minutes
    exam.passing_score = exam_in.passing_score
    exam.is_public = exam_in.type == 'PRACTICE'
    
    db.commit()
    db.refresh(exam)
    
    return {
        "message": "Exam updated successfully",
        "exam_id": str(exam.id)
    }

@router.put("/{exam_id}/questions")
def update_exam_questions(
    exam_id: UUID,
    questions: List[dict],
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """
    Add or update questions in an exam.
    Cannot edit if exam is locked (has attempts).
    """
    exam = db.query(models.Exam).filter(models.Exam.id == exam_id).first()
    
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # Check ownership
    if exam.created_by_user_id != current_user.id:
        if current_user.role not in ['ADMIN', 'SUPER_ADMIN', 'ORG_ADMIN']:
            raise HTTPException(status_code=403, detail="Not authorized to edit this exam")
    
    # Check if locked
    if exam.is_locked:
        raise HTTPException(
            status_code=403,
            detail="Cannot edit exam after students have attempted it. Create a new version instead."
        )
    
    # Update questions
    exam.questions = questions
    db.commit()
    
    return {
        "message": "Questions updated successfully",
        "question_count": len(questions)
    }

@router.put("/{exam_id}/publish")
def publish_exam(
    exam_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """
    Publish exam (make it ACTIVE).
    Validates before publishing.
    """
    exam = db.query(models.Exam).filter(models.Exam.id == exam_id).first()
    
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # Check ownership
    if exam.created_by_user_id != current_user.id:
        if current_user.role not in ['ADMIN', 'SUPER_ADMIN', 'ORG_ADMIN']:
            raise HTTPException(status_code=403, detail="Not authorized to publish this exam")
    
    # Validate
    validate_exam_for_publishing(exam)
    
    # Publish
    exam.exam_status = 'ACTIVE'
    exam.is_published = True
    db.commit()
    
    return {
        "message": "Exam published successfully",
        "exam_id": str(exam.id),
        "status": "ACTIVE"
    }

@router.post("/{exam_id}/clone")
def clone_exam(
    exam_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """
    Clone an existing exam.
    Creates a new DRAFT exam with the same questions and settings.
    """
    original = db.query(models.Exam).filter(models.Exam.id == exam_id).first()
    
    if not original:
        raise HTTPException(status_code=404, detail="Original exam not found")
        
    # Create new exam record
    new_exam = models.Exam(
        topic_id=original.topic_id,
        module_id=original.module_id,
        course_id=original.course_id,
        type=original.type,
        scope=original.scope,
        title=f"Copy of {original.title}" if original.title else "Cloned Exam",
        questions=original.questions, # JSON is deep copied usually by the DB or if it's a list it should be fine
        difficulty=original.difficulty,
        duration_minutes=original.duration_minutes,
        passing_score=original.passing_score,
        created_by_user_id=current_user.id,
        is_published=False,
        exam_status='DRAFT',
        owner_type=original.owner_type,
        creation_mode='MANUAL' # Cloned exams are treated as manual edits
    )
    
    db.add(new_exam)
    db.commit()
    db.refresh(new_exam)
    
    return {
        "message": "Exam cloned successfully",
        "new_exam_id": str(new_exam.id)
    }

@router.delete("/{exam_id}")
def delete_exam(
    exam_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """
    Delete an exam.
    Strictly prohibited if the exam has any attempts.
    """
    exam = db.query(models.Exam).filter(models.Exam.id == exam_id).first()
    
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # Check ownership
    if exam.created_by_user_id != current_user.id:
        if current_user.role not in ['ADMIN', 'SUPER_ADMIN', 'ORG_ADMIN']:
            raise HTTPException(status_code=403, detail="Not authorized to delete this exam")
    
    # Check for attempts
    if exam.num_attempts > 0:
        raise HTTPException(
            status_code=400, 
            detail="Cannot delete exam with student attempts. Please deactivate it instead."
        )
        
    db.delete(exam)
    db.commit()
    
    return {"message": "Exam deleted successfully"}

class ExamStatusUpdate(schemas.BaseModel):
    status: str

@router.put("/{exam_id}/status")
def update_exam_status(
    exam_id: UUID,
    status_update: ExamStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """
    Update exam status (ACTIVE, DISABLED, ARCHIVED).
    """
    exam = db.query(models.Exam).filter(models.Exam.id == exam_id).first()
    
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
        
    # Check ownership
    if exam.created_by_user_id != current_user.id:
        if current_user.role not in ['ADMIN', 'SUPER_ADMIN', 'ORG_ADMIN']:
            raise HTTPException(status_code=403, detail="Not authorized to update this exam")
            
    new_status = status_update.status.upper()
    if new_status not in ['ACTIVE', 'DISABLED', 'ARCHIVED', 'DRAFT']:
         raise HTTPException(status_code=400, detail="Invalid status")
         
    exam.exam_status = new_status
    
    # Sync is_published flag
    if new_status == 'ACTIVE':
        exam.is_published = True
    elif new_status in ['DISABLED', 'ARCHIVED', 'DRAFT']:
        exam.is_published = False
        
    db.commit()
    
    return {
        "message": f"Exam status updated to {new_status}",
        "status": new_status
    }



# ============================================================================
# AI GENERATION ENDPOINT (EXISTING - UPDATED WITH VALIDATION)
# ============================================================================

@router.post("/topics/{topic_id}/generate-practice-exam", response_model=schemas.Exam)
async def generate_practice_exam(
    topic_id: UUID,
    request: schemas.ExamGenerateRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """Generate a practice exam for a topic using AI"""
    
    # Get topic and content
    topic = db.query(models.Topic).filter(models.Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    
    content = db.query(models.TopicContent).filter(models.TopicContent.topic_id == topic_id).first()
    if not content:
        raise HTTPException(status_code=404, detail="No content available for this topic")
    
    # Generate questions using AI
    from ..ai import get_ai_model
    model = get_ai_model()
    # model = genai.GenerativeModel('gemini-2.0-flash-exp')
    
    prompt = f"""Generate {request.num_questions} multiple-choice questions for the following topic.

Topic: {topic.title}
Description: {topic.description}
Content: {content.content[:3000]}  # Limit content length

Requirements:
- Difficulty: {request.difficulty}
- Each question should have exactly 4 options (A, B, C, D)
- Only one correct answer per question
- Include a brief explanation for the correct answer
- Questions should test understanding of key concepts
- Vary question types (definition, application, analysis)

Return ONLY a valid JSON array with this exact structure:
[
  {{
    "question": "What is...",
    "options": ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"],
    "correct_index": 0,
    "explanation": "The correct answer is A because..."
  }}
]

IMPORTANT: Return ONLY the JSON array, no markdown formatting, no extra text."""

    try:
        response = model.generate_content(prompt)
        questions_text = response.text.strip()
        
        # Remove markdown code blocks if present
        if questions_text.startswith("```"):
            questions_text = questions_text.split("```")[1]
            if questions_text.startswith("json"):
                questions_text = questions_text[4:]
        
        questions = json.loads(questions_text)
        
        # Validate questions structure
        if not isinstance(questions, list) or len(questions) == 0:
            raise ValueError("Invalid questions format")
        
        # Determine owner_type based on user role
        owner_type = 'STUDENT'
        if current_user.role in ['TEACHER', 'ORG_ADMIN', 'DEPT_HEAD']:
            owner_type = 'TEACHER'
        
        # Create exam in database
        exam = models.Exam(
            topic_id=topic_id,
            created_by_user_id=current_user.id,
            questions=questions,
            difficulty=request.difficulty,
            duration_minutes=request.num_questions * 2,  # 2 minutes per question
            passing_score=70,
            is_published=True,  # Practice exams are always available
            is_public=True,  # Share with community
            exam_status='ACTIVE',  # Practice exams auto-publish
            owner_type=owner_type
        )
        
        db.add(exam)
        db.commit()
        db.refresh(exam)
        
        return exam
        
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse AI response: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate exam: {str(e)}")


@router.post("/generate-ai-exam")
async def generate_ai_exam(
    course_id: UUID,
    scope: str,  # TOPIC, MODULE, COURSE
    target_id: UUID = None,  # topic_id for TOPIC/MODULE scope
    difficulty: str = "medium",
    num_questions: int = 10,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """
    Generate AI exam with support for Topic/Module/Course scope.
    Used by the comprehensive exam creation flow.
    """
    # Get course
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Aggregate content based on scope
    content_text = ""
    exam_title = ""
    
    if scope == "TOPIC":
        if not target_id:
            raise HTTPException(status_code=400, detail="target_id required for TOPIC scope")
        topic = db.query(models.Topic).filter(models.Topic.id == target_id).first()
        if not topic:
            raise HTTPException(status_code=404, detail="Topic not found")
        
        content = db.query(models.TopicContent).filter(models.TopicContent.topic_id == target_id).first()
        if not content or not content.content:
            raise HTTPException(status_code=404, detail="No content available")
        
        content_text = content.content[:3000]
        exam_title = f"{topic.title} - Practice"
        
    elif scope == "MODULE":
        if not target_id:
            raise HTTPException(status_code=400, detail="target_id required for MODULE scope")
        module = db.query(models.Topic).filter(models.Topic.id == target_id).first()
        if not module:
            raise HTTPException(status_code=404, detail="Module not found")
        
        # Get all child topics
        child_topics = db.query(models.Topic).filter(
            models.Topic.parent_topic_id == target_id
        ).all()
        
        if not child_topics:
            raise HTTPException(status_code=404, detail="No topics found in module")
        
        topic_ids = [t.id for t in child_topics]
        content_text = aggregate_topic_content(db, topic_ids)
        exam_title = f"{module.title} - Practice"
        
    elif scope == "COURSE":
        # Get all topics in course
        all_topics = db.query(models.Topic).filter(
            models.Topic.course_id == course_id,
            models.Topic.parent_topic_id.isnot(None)  # Only child topics
        ).all()
        
        if not all_topics:
            raise HTTPException(status_code=404, detail="No topics found in course")
        
        topic_ids = [t.id for t in all_topics]
        content_text = aggregate_topic_content(db, topic_ids)
        exam_title = f"{course.title} - Full Course Practice"
    
    else:
        raise HTTPException(status_code=400, detail="Invalid scope. Must be TOPIC, MODULE, or COURSE")
    
    # Generate questions using AI
    from ..ai import get_ai_model
    model = get_ai_model()
    
    prompt = f"""Generate {num_questions} multiple-choice questions for a {scope.lower()}-level practice exam.

Course: {course.title}
Title: {exam_title}
Difficulty: {difficulty}
Content: {content_text}

Requirements:
- Difficulty: {difficulty}
- Each question should have exactly 4 options (A, B, C, D)
- Only one correct answer per question
- Include a brief explanation for the correct answer
- Questions should test understanding of key concepts
- Vary question types (definition, application, analysis)
- For MODULE/COURSE scope, ensure questions cover different topics

Return ONLY a valid JSON array with this exact structure:
[
  {{
    "question": "What is...",
    "options": ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"],
    "correct_index": 0,
    "explanation": "The correct answer is A because..."
  }}
]

IMPORTANT: Return ONLY the JSON array, no markdown formatting, no extra text."""

    try:
        response = model.generate_content(prompt)
        questions_text = response.text.strip()
        
        # Remove markdown code blocks if present
        if questions_text.startswith("```"):
            questions_text = questions_text.split("```")[1]
            if questions_text.startswith("json"):
                questions_text = questions_text[4:]
        
        questions = json.loads(questions_text)
        
        # Validate questions structure
        if not isinstance(questions, list) or len(questions) == 0:
            raise ValueError("Invalid questions format")
        
        # Return questions for frontend to use
        return {
            "questions": questions,
            "title": exam_title,
            "duration_minutes": num_questions * 2
        }
        
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse AI response: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate exam: {str(e)}")


@router.post("/practice-exams/{exam_id}/submit", response_model=schemas.ExamResult)
async def submit_practice_exam(
    exam_id: UUID,
    submission: schemas.ExamSubmitRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """Submit answers for a practice exam and get results"""
    
    # Get exam
    exam = db.query(models.Exam).filter(models.Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    questions = exam.questions
    
    # Validate answers length
    if len(submission.answers) != len(questions):
        raise HTTPException(status_code=400, detail="Number of answers doesn't match number of questions")
    
    # Calculate score
    correct_count = 0
    correct_answers = []
    explanations = []
    
    for i, (answer, question) in enumerate(zip(submission.answers, questions)):
        correct_index = question['correct_index']
        correct_answers.append(correct_index)
        explanations.append(question['explanation'])
        
        if answer == correct_index:
            correct_count += 1
    
    score = int((correct_count / len(questions)) * 100)
    passed = score >= exam.passing_score
    
    # Increment attempt counter
    exam.num_attempts += 1
    
    # Record attempt with timestamps (UTC)
    from datetime import datetime
    now = datetime.utcnow()
    
    attempt = models.ExamAttempt(
        exam_id=exam_id,
        user_id=current_user.id,
        answers=submission.answers,
        score=score,
        passed=passed,
        started_at=now,  # Set submission time
        submitted_at=now  # Set submission time
    )
    
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    
    # Lock exam on first attempt to prevent question edits
    lock_exam_on_first_attempt(exam_id, db)
    
    return schemas.ExamResult(
        score=score,
        passed=passed,
        correct_answers=correct_answers,
        explanations=explanations,
        remediation_notes=exam.remediation_notes,
        attempt_id=attempt.id
    )


@router.get("/topics/{topic_id}/exam", response_model=schemas.ExamForStudent)
async def get_topic_exam(
    topic_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """Get the most recent practice exam for a topic (without correct answers)"""
    
    exam = db.query(models.Exam).filter(
        models.Exam.topic_id == topic_id,
        models.Exam.is_published == True
    ).order_by(models.Exam.created_at.desc()).first()
    
    if not exam:
        raise HTTPException(status_code=404, detail="No exam available for this topic")
    
    # Remove correct answers from questions
    questions_for_student = []
    for q in exam.questions:
        questions_for_student.append({
            "question": q["question"],
            "options": q["options"]
        })
    
    return schemas.ExamForStudent(
        id=exam.id,
        topic_id=exam.topic_id,
        course_id=exam.course_id,
        module_id=exam.module_id,
        title=exam.title,
        scope=exam.scope,
        difficulty=exam.difficulty,
        duration_minutes=exam.duration_minutes,
        passing_score=exam.passing_score,
        questions=questions_for_student,
        created_at=exam.created_at
    )

@router.get("/{exam_id}/student", response_model=schemas.ExamForStudent)
async def get_student_exam(
    exam_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """Get a specific exam for a student (without correct answers)"""
    
    exam = db.query(models.Exam).filter(
        models.Exam.id == exam_id,
        models.Exam.is_published == True
    ).first()
    
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # Remove correct answers from questions
    questions_for_student = []
    for q in exam.questions:
        questions_for_student.append({
            "question": q["question"],
            "options": q["options"]
        })
    
    return schemas.ExamForStudent(
        id=exam.id,
        topic_id=exam.topic_id,
        course_id=exam.course_id,
        module_id=exam.module_id,
        title=exam.title,
        scope=exam.scope,
        difficulty=exam.difficulty,
        duration_minutes=exam.duration_minutes,
        passing_score=exam.passing_score,
        questions=questions_for_student,
        created_at=exam.created_at
    )

@router.get("/topics/{topic_id}/exams")
async def get_topic_exam_library(
    topic_id: UUID,
    difficulty: str = None,
    sort_by: str = "recent",  # popular, quality, recent
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """Get all public exams for a topic (exam library) with quality metrics"""
    
    query = db.query(models.Exam).filter(
        models.Exam.topic_id == topic_id,
        models.Exam.is_public == True,
        models.Exam.is_published == True
    )
    
    # Filter by difficulty if specified
    if difficulty:
        query = query.filter(models.Exam.difficulty == difficulty)
    
    # Get all exams
    exams = query.all()
    
    # Format response with creator info and quality metrics
    result = []
    for exam in exams:
        creator = db.query(models.User).filter(models.User.id == exam.created_by_user_id).first()
        
        # Calculate quality metrics from attempts
        attempts = db.query(models.ExamAttempt).filter(models.ExamAttempt.exam_id == exam.id).all()
        total_attempts = len(attempts)
        pass_rate = 0
        avg_score = 0
        
        if total_attempts > 0:
            scores = [a.score for a in attempts]
            avg_score = sum(scores) / len(scores)
            passed = sum(1 for a in attempts if a.passed)
            pass_rate = (passed / total_attempts) * 100
        
        # Calculate quality score (0-100)
        quality_score = 0
        if total_attempts > 0:
            # Normalize attempts (cap at 50 for scoring)
            attempt_score = min(total_attempts / 50, 1.0) * 50
            # Pass rate should be reasonable (60-80% is ideal)
            pass_rate_score = 100 - abs(pass_rate - 70)
            quality_score = (attempt_score + pass_rate_score) / 2
        
        result.append({
            "id": exam.id,
            "difficulty": exam.difficulty,
            "num_questions": len(exam.questions),
            "duration_minutes": exam.duration_minutes,
            "passing_score": exam.passing_score,
            "num_attempts": total_attempts,
            "pass_rate": round(pass_rate, 1),
            "avg_score": round(avg_score, 1),
            "quality_score": round(quality_score, 1),
            "is_popular": total_attempts > 20,
            "is_high_quality": quality_score > 60,
            "created_by": creator.full_name if creator and creator.full_name else "Anonymous",
            "owner_type": exam.owner_type if hasattr(exam, 'owner_type') else "STUDENT",
            "created_at": exam.created_at,
            "is_mine": exam.created_by_user_id == current_user.id
        })
    
    # Sort based on parameter
    if sort_by == "popular":
        result.sort(key=lambda x: x['num_attempts'], reverse=True)
    elif sort_by == "quality":
        result.sort(key=lambda x: x['quality_score'], reverse=True)
    elif sort_by == "recent":
        result.sort(key=lambda x: x['created_at'], reverse=True)
    
    return result


@router.get("/org", response_model=List[dict])
def get_org_exams(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin)
):
    """
    Get all exams created within the organization with real analytics.
    Calculates avg_score and pass_rate from ExamAttempt data.
    """
    from sqlalchemy import or_

    # Base query for exams in this organization
    query = db.query(models.Exam).join(models.User, models.Exam.created_by_user_id == models.User.id)\
        .filter(models.User.organization_id == current_user.organization_id)
        
    # If user is NOT an Org Admin (e.g., Teacher), show exams they created OR exams for courses they are assigned to
    if current_user.role not in ['ORG_ADMIN', 'SUPER_ADMIN']:
        # Get assigned course IDs
        assigned_course_ids = [course.id for course in current_user.assigned_courses]
        
        query = query.filter(
            or_(
                models.Exam.created_by_user_id == current_user.id,
                models.Exam.course_id.in_(assigned_course_ids)
            )
        )
        
    exams = query.order_by(models.Exam.num_attempts.asc(), models.Exam.created_at.desc()).all()

    results = []
    for exam in exams:
        # Get course info - try via topic first, then directly via course_id
        topic = db.query(models.Topic).filter(models.Topic.id == exam.topic_id).first() if exam.topic_id else None
        course_title = "Unknown"
        
        if topic:
            # Get course through topic
            course = db.query(models.Course).filter(models.Course.id == topic.course_id).first()
            if course:
                course_title = course.title
        elif exam.course_id:
            # For FINAL and COURSE-scope exams without topic_id, get course directly
            course = db.query(models.Course).filter(models.Course.id == exam.course_id).first()
            if course:
                course_title = course.title
                 
        creator = db.query(models.User).filter(models.User.id == exam.created_by_user_id).first()

        # Calculate real statistics from ExamAttempt table
        attempts = db.query(models.ExamAttempt).filter(models.ExamAttempt.exam_id == exam.id).all()
        
        total_attempts = len(attempts)
        avg_score = 0
        pass_rate = 0
        passed_count = 0
        
        if total_attempts > 0:
            scores = [attempt.score for attempt in attempts]
            avg_score = sum(scores) / len(scores)
            
            passed_count = sum(1 for attempt in attempts if attempt.passed)
            pass_rate = (passed_count / total_attempts * 100)

        # Calculate quality score (0-100)
        quality_score = 0
        if total_attempts > 0:
            # Normalize attempts (cap at 50 for scoring)
            attempt_score = min(total_attempts / 50, 1.0) * 50
            # Pass rate should be reasonable (60-80% is ideal)
            pass_rate_score = 100 - abs(pass_rate - 70)
            quality_score = (attempt_score + pass_rate_score) / 2

        results.append({
            "id": str(exam.id),
            "title": exam.title if getattr(exam, 'title', None) else (f"{topic.title} Exam" if topic else "Untitled Exam"),
            "course": course_title,
            "course_title": course_title,  # Add explicit course_title field
            "type": exam.type if hasattr(exam, 'type') else "Practice Exam", 
            "scope": exam.scope if hasattr(exam, 'scope') else None,  # Add scope field
            "status": exam.exam_status if hasattr(exam, 'exam_status') else ("Active" if exam.is_published else "Draft"),
            "owner_type": exam.owner_type if hasattr(exam, 'owner_type') else "Unknown",
            "difficulty": exam.difficulty,
            "num_attempts": total_attempts,
            "avg_score": f"{avg_score:.1f}%" if total_attempts > 0 else "N/A",
            "pass_rate": f"{pass_rate:.1f}%" if total_attempts > 0 else "N/A",
            
            # New fields for Rich UI
            "num_questions": len(exam.questions),
            "duration_minutes": exam.duration_minutes,
            "passing_score": exam.passing_score,
            "quality_score": round(quality_score, 1),
            "is_popular": total_attempts > 20,
            "is_high_quality": quality_score > 60,
            "created_by": creator.full_name if creator and creator.full_name else "Anonymous",
            "is_mine": exam.created_by_user_id == current_user.id,  # Add is_mine flag
            
            "created_at": exam.created_at.isoformat() if exam.created_at else None
        })
        
    return results

@router.get("/org/stats")
def get_org_exam_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin)
):
    """
    Get overall exam statistics for the organization dashboard.
    Returns total exams, attempts, avg score, and pass rate.
    """
    from sqlalchemy import or_

    # Get exams based on role
    query = db.query(models.Exam).join(models.User, models.Exam.created_by_user_id == models.User.id)\
        .filter(models.User.organization_id == current_user.organization_id)
        
    # Filter for Teachers
    if current_user.role not in ['ORG_ADMIN', 'SUPER_ADMIN']:
        # Get assigned course IDs
        assigned_course_ids = [course.id for course in current_user.assigned_courses]
        
        query = query.filter(
            or_(
                models.Exam.created_by_user_id == current_user.id,
                models.Exam.course_id.in_(assigned_course_ids)
            )
        )
        
    exams = query.all()
    exam_ids = [exam.id for exam in exams]
    total_exams = len(exams)
    
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
    
    # Count exams by status from our filtered list
    active_exams = sum(1 for e in exams if e.exam_status == 'ACTIVE' or (e.is_published and e.exam_status is None))
    draft_exams = sum(1 for e in exams if e.exam_status == 'DRAFT' or (not e.is_published and e.exam_status is None))
    
    return {
        "total_exams": total_exams,
        "total_attempts": total_attempts,
        "overall_avg_score": overall_avg_score,
        "overall_pass_rate": overall_pass_rate,
        "active_exams": active_exams,
        "draft_exams": draft_exams
    }

@router.get("/{exam_id}", response_model=schemas.Exam)
def get_exam_details(
    exam_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """
    Get full exam details (including questions and correct answers).
    Accessible by:
    - Creator (Teacher)
    - Org Admin / Admin
    """
    exam = db.query(models.Exam).filter(models.Exam.id == exam_id).first()
    
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
        
    # Check permissions (Creator or Admin)
    # Note: Students use /topics/{topic_id}/exam which strips answers
    can_access = (
        current_user.id == exam.created_by_user_id or 
        current_user.role in ['ADMIN', 'SUPER_ADMIN', 'ORG_ADMIN', 'DEPT_HEAD']
    )
    
    
    if not can_access:
        raise HTTPException(status_code=403, detail="Not authorized to view full exam details")
        
    # Populate title dynamically if not set
    if not getattr(exam, 'title', None):
        topic = db.query(models.Topic).filter(models.Topic.id == exam.topic_id).first()
        # Set it on the instance so Pydantic picks it up
        exam.title = topic.title if topic else "Untitled Exam"
        
    return exam


@router.get("/{exam_id}/analytics", response_model=schemas.ExamAnalytics)
def get_exam_analytics(
    exam_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin)
):
    """
    Get deep diagnostics for an exam.
    Includes success meters and distractor analysis.
    """
    exam = db.query(models.Exam).filter(models.Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
        
    attempts = db.query(models.ExamAttempt).filter(models.ExamAttempt.exam_id == exam_id).all()
    total_attempts = len(attempts)
    
    # Count unique students
    unique_user_ids = set(a.user_id for a in attempts)
    unique_students = len(unique_user_ids)
    
    if total_attempts == 0:
        return {
            "total_attempts": 0,
            "unique_students": 0,
            "average_score": 0,
            "high_score": 0,
            "low_score": 0,
            "pass_rate": 0,
            "score_distribution": {},
            "question_stats": []
        }

    scores = [a.score for a in attempts]
    avg_score = sum(scores) / total_attempts
    high_score = max(scores)
    low_score = min(scores)
    pass_count = sum(1 for s in scores if s >= exam.passing_score)
    pass_rate = (pass_count / total_attempts) * 100

    # Score Distribution (Buckets)
    dist = {"0-20": 0, "21-40": 0, "41-60": 0, "61-80": 0, "81-100": 0}
    for s in scores:
        if s <= 20: dist["0-20"] += 1
        elif s <= 40: dist["21-40"] += 1
        elif s <= 60: dist["41-60"] += 1
        elif s <= 80: dist["61-80"] += 1
        else: dist["81-100"] += 1

    # Question-Level Diagnostics
    q_stats = []
    num_questions = len(exam.questions)
    for i in range(num_questions):
        correct_idx = exam.questions[i]['correct_index']
        q_text = exam.questions[i]['question']
        
        correct_count = 0
        options_dist = {"A": 0, "B": 0, "C": 0, "D": 0}
        char_map = {0: "A", 1: "B", 2: "C", 3: "D"}
        
        for a in attempts:
            if i < len(a.answers):
                ans = a.answers[i]
                if ans == correct_idx:
                    correct_count += 1
                if ans in char_map:
                    options_dist[char_map[ans]] += 1
        
        success_rate = (correct_count / total_attempts) * 100
        
        # Difficulty labeling based on real success rate
        if success_rate >= 80: difficulty = "Easy"
        elif success_rate >= 50: difficulty = "Medium"
        else: difficulty = "Hard"

        q_stats.append({
            "question_index": i,
            "question_text": q_text,
            "success_rate": round(success_rate, 1),
            "option_distribution": options_dist,
            "difficulty_label": difficulty
        })

    return {
        "total_attempts": total_attempts,
        "unique_students": unique_students,
        "average_score": round(avg_score, 1),
        "high_score": high_score,
        "low_score": low_score,
        "pass_rate": round(pass_rate, 1),
        "score_distribution": dist,
        "question_stats": q_stats
    }


@router.post("/{exam_id}/remediation")
def update_remediation(
    exam_id: UUID,
    remediation: schemas.RemediationUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin)
):
    """
    Update remediation notes (Teacher Takeaways) for an exam.
    These notes become visible to students in their personalized intelligence.
    """
    exam = db.query(models.Exam).filter(models.Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
        
    exam.remediation_notes = remediation.notes
    db.commit()
    return {"message": "Remediation notes updated successfully"}


@router.get("/{exam_id}/admin/attempts")
def get_admin_attempts(
    exam_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin)
):
    """
    Get unique student attempts for an exam (latest attempt per student).
    """
    # Get all attempts with user info, ordered by submission time (prefer submitted_at, fallback to started_at)
    from sqlalchemy import desc, nullslast, func
    all_attempts = db.query(models.ExamAttempt, models.User.full_name)\
        .join(models.User, models.ExamAttempt.user_id == models.User.id)\
        .filter(models.ExamAttempt.exam_id == exam_id)\
        .order_by(nullslast(desc(func.coalesce(models.ExamAttempt.submitted_at, models.ExamAttempt.started_at)))).all()
    
    # Group by user_id and keep only the latest attempt per student
    seen_users = set()
    unique_attempts = []
    
    for attempt in all_attempts:
        user_id = attempt.ExamAttempt.user_id  # Get user_id from the ExamAttempt object
        if user_id not in seen_users:
            seen_users.add(user_id)
            unique_attempts.append({
                "id": attempt.ExamAttempt.id,
                "student_name": attempt.full_name,
                "score": attempt.ExamAttempt.score,
                "passed": attempt.ExamAttempt.passed,
                "created_at": attempt.ExamAttempt.started_at
            })
    
    return unique_attempts

@router.get("/attempts/{attempt_id}")
def get_attempt_details(
    attempt_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """
    Get deep details of a specific exam attempt (answers, questions, results).
    Accessible by student (owner) or teacher/admin.
    """
    from sqlalchemy.orm import joinedload
    
    attempt = db.query(models.ExamAttempt)\
        .options(joinedload(models.ExamAttempt.user))\
        .filter(models.ExamAttempt.id == attempt_id).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
        
    exam = db.query(models.Exam).filter(models.Exam.id == attempt.exam_id).first()
    if not exam:
        # Fallback if exam is deleted but attempt exists (rare but possible)
        # We can still return score info but no question breakdown
        return {
            "id": attempt.id,
            "student_name": attempt.user.full_name if attempt.user else "Unknown Student",
            "exam_title": "Deleted Exam",
            "score": attempt.score,
            "passed": attempt.passed,
            "started_at": attempt.started_at,
            "submitted_at": attempt.submitted_at,
            "results": [],
            "analytics": {
                "total_questions": 0,
                "correct_count": 0,
                "wrong_count": 0,
                "accuracy": attempt.score or 0
            }
        }
    
    # Permission check: Owner or Admin/Teacher
    allowed_admin_roles = [
        models.UserRole.SUPER_ADMIN.value, 
        models.UserRole.ORG_ADMIN.value, 
        models.UserRole.DEPT_HEAD.value, 
        models.UserRole.TEACHER.value
    ]
    if attempt.user_id != current_user.id and current_user.role not in allowed_admin_roles:
        raise HTTPException(status_code=403, detail="Forbidden")

    # Combine questions with student's chosen answers
    questions = exam.questions or []
    answers = attempt.answers or {}
    
    print(f"\n{'='*60}")
    print(f"DEBUG: Processing Attempt {attempt.id}")
    print(f"DEBUG: Exam Questions Count: {len(questions)}")
    print(f"DEBUG: Answers Type: {type(answers)}")
    print(f"DEBUG: Questions Type: {type(questions)}")
    
    # Convert answers to dict if it's a list (legacy format)
    if isinstance(answers, list):
        print(f"DEBUG: Converting answers list to dict (length: {len(answers)})")
        # If answers is a list, assume it's indexed by position [ans0, ans1, ans2...]
        answers_dict = {str(i): answers[i] for i in range(len(answers))}
        answers = answers_dict
    
    print(f"DEBUG: Student Answers Count: {len(answers)}")
    if questions:
        print(f"DEBUG: First Question: {questions[0]}")
    if answers:
        print(f"DEBUG: Answer Keys: {list(answers.keys())[:5]}")
    print(f"{'='*60}\n")

    results = []
    correct_count = 0
    wrong_count = 0

    try:
        # Ensure questions is a list
        if isinstance(questions, str):
            import json
            questions = json.loads(questions)
        
        # Ensure answers is a dict
        if isinstance(answers, str):
            import json
            answers = json.loads(answers)
            # Check again if it's a list after parsing
            if isinstance(answers, list):
                answers = {str(i): answers[i] for i in range(len(answers))}

        for idx, q in enumerate(questions):
            if not isinstance(q, dict):
                print(f"WARNING: Skipping malformed question at index {idx}: {q}")
                continue
                
            # Robust ID matching - use index if ID is missing
            raw_id = q.get('id')
            if raw_id is None:
                # Use index as fallback
                raw_id = idx
            
            q_id_str = str(raw_id)
            
            # Try multiple matching strategies
            chosen = answers.get(q_id_str)  # Try string key
            if chosen is None and isinstance(raw_id, int):
                chosen = answers.get(raw_id)  # Try int key
            if chosen is None:
                # Try index-based (for list-converted answers)
                chosen = answers.get(str(idx))

            # Get question text - handle both 'text' and 'question' fields
            question_text = q.get('text') or q.get('question', 'Unknown Question')
            
            # Get correct answer - handle both 'correct' and 'correct_index' formats
            correct_val = q.get('correct')
            if correct_val is None and 'correct_index' in q:
                # Convert index to letter (0->A, 1->B, etc.)
                correct_idx = q.get('correct_index')
                if correct_idx is not None:
                    correct_val = chr(65 + int(correct_idx))  # 65 is ASCII 'A'
            
            # Convert student answer index to letter if needed
            student_answer_display = chosen
            if chosen is not None and isinstance(chosen, int):
                student_answer_display = chr(65 + int(chosen))
            
            # Check correctness - compare indices directly
            is_correct = False
            if chosen is not None and 'correct_index' in q:
                # Both are indices, compare directly
                is_correct = int(chosen) == int(q.get('correct_index'))
            elif chosen is not None and correct_val is not None:
                # Compare as strings with normalization
                is_correct = str(chosen).strip().lower() == str(correct_val).strip().lower()
            
            if is_correct:
                correct_count += 1
            else:
                wrong_count += 1
            
            # Debug individual question matching
            if idx < 3:
                print(f"Q{idx+1}: ID={raw_id}, Chosen={chosen}, CorrectIdx={q.get('correct_index')}, Match={is_correct}")
                
            results.append({
                "question": question_text,
                "explanation": q.get('explanation', 'No explanation provided.'),
                "options": q.get('options', []),
                "correct_answer": correct_val,
                "student_answer": student_answer_display,
                "is_correct": is_correct,
                "topic": q.get('topic', 'General')
            })
        
        print(f"\nFINAL STATS: Total={len(questions)}, Correct={correct_count}, Wrong={wrong_count}\n")
            
    except Exception as e:
        import traceback
        print(f"ERROR processing attempt details: {e}")
        traceback.print_exc()
        return {
            "id": attempt.id,
            "student_name": attempt.user.full_name if attempt.user else "Unknown Student",
            "exam_title": exam.title,
            "teacher_notes": exam.remediation_notes,
            "score": attempt.score,
            "passed": attempt.passed,
            "started_at": attempt.started_at,
            "submitted_at": attempt.submitted_at,
            "results": [],
            "analytics_error": str(e),
            "analytics": {
                "total_questions": 0,
                "correct_count": 0,
                "wrong_count": 0,
                "accuracy": attempt.score or 0
            }
        }
    
    return {
        "id": attempt.id,
        "student_name": attempt.user.full_name if attempt.user else "Unknown Student",
        "exam_title": exam.title,
        "teacher_notes": exam.remediation_notes, # Added teacher notes
        "score": attempt.score,
        "passed": attempt.passed,
        "started_at": attempt.started_at,
        "submitted_at": attempt.submitted_at,
        "results": results,
        "analytics": {
            "total_questions": len(questions),
            "correct_count": correct_count,
            "wrong_count": wrong_count,
            "accuracy": attempt.score
        }
    }

@router.post("/attempts/{attempt_id}/remediation")
def generate_student_remediation(
    attempt_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """
    Generate personalized AI remediation for a specific student attempt.
    Analyzes wrong answers and provides a tailored study plan.
    """
    attempt = db.query(models.ExamAttempt).filter(models.ExamAttempt.id == attempt_id).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
        
    exam = db.query(models.Exam).filter(models.Exam.id == attempt.exam_id).first()
    if not exam:
        return {"remediation": "This exam data is no longer available, so we cannot generate specific remediation."}
    
    # Permission check: Owner or Teacher/Admin
    allowed_admin_roles = [
        models.UserRole.SUPER_ADMIN.value, 
        models.UserRole.ORG_ADMIN.value, 
        models.UserRole.DEPT_HEAD.value, 
        models.UserRole.TEACHER.value
    ]
    if attempt.user_id != current_user.id and current_user.role not in allowed_admin_roles:
        raise HTTPException(status_code=403, detail="Forbidden")

    # Filter wrong answers
    wrong_answers = []
    questions = exam.questions or []
    answers = attempt.answers or {}
    
    for q in questions:
        q_id = str(q.get('id', ''))
        chosen = answers.get(q_id)
        if chosen != q.get('correct'):
            wrong_answers.append({
                "question": q.get('text'),
                "correct_answer": q.get('correct'),
                "student_answer": chosen,
                "topic": q.get('topic', 'General'),
                "explanation": q.get('explanation')
            })

    if not wrong_answers:
        return {"remediation": "Perfect score! You have a solid grasp of all concepts covered in this exam."}

    # Prepare prompt for AI
    from app.ai import get_ai_model
    ai_model = get_ai_model()
    prompt = f"""
    You are an expert academic tutor. Analyze the following student's incorrect answers in the exam "{exam.title}" 
    and provide a personalized remediation plan.
    
    Student Performance: {attempt.score}% accurately.
    Total Wrong: {len(wrong_answers)} questions.
    
    Incorrect Items:
    {json.dumps(wrong_answers, indent=2)}
    
    Please provide:
    1. **Conceptual Gap Analysis**: Identify the core patterns or topics the student struggles with.
    2. **Tailored Study Plan**: 3-5 specific steps the student should take to improve.
    3. **Key Advice**: A focused piece of advice for their next attempt.
    
    Format the response in Markdown. Keep it encouraging and executive in tone.
    """
    
    try:
        response = ai_model.generate_content(prompt)
        return {"remediation": response.text}
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail="Failed to generate AI remediation")



@router.get("/{exam_id}/student-analytics")
def get_student_exam_analytics(
    exam_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """
    Get anonymized relative performance data for a student.
    Includes average score, percentile, and teacher remediation notes.
    """
    exam = db.query(models.Exam).filter(models.Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    attempts = db.query(models.ExamAttempt).filter(models.ExamAttempt.exam_id == exam_id).all()
    if not attempts:
        return {
            "average_score": 0,
            "percentile": 0,
            "total_students": 0,
            "remediation_notes": exam.remediation_notes
        }

    all_scores = [a.score for a in attempts]
    avg_score = sum(all_scores) / len(all_scores)
    
    # Get student's best score for this exam
    user_attempts_scores = [a.score for a in attempts if a.user_id == current_user.id]
    if not user_attempts_scores:
         return {
             "average_score": round(avg_score, 1),
             "percentile": 0,
             "total_students": len(set(a.user_id for a in attempts)),
             "remediation_notes": exam.remediation_notes
         }
    
    best_score = max(user_attempts_scores)
    
    # Calculate percentile (fraction of students who scored below him)
    below = sum(1 for s in all_scores if s < best_score)
    percentile = (below / len(all_scores)) * 100
    
    return {
        "average_score": round(avg_score, 1),
        "percentile": round(percentile, 1),
        "total_students": len(set(a.user_id for a in attempts)),
        "remediation_notes": exam.remediation_notes
    }


# ============================================================================
# EXAM UPLOAD ENDPOINTS
# ============================================================================

@router.post("/upload")
async def upload_exam_questions(
    topic_id: UUID = None,
    difficulty: str = "medium",
    exam_type: str = "PRACTICE",
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """
    Upload exam questions from Excel file.
    Creates a new DRAFT exam with the uploaded questions.
    """
    from openpyxl import load_workbook
    from io import BytesIO

    # Role Check
    if current_user.role == 'STUDENT':
        raise HTTPException(status_code=403, detail="Students cannot upload exams")

    if not (file.filename.endswith('.xlsx') or file.filename.endswith('.xls')):
        raise HTTPException(status_code=400, detail="Only Excel files (.xlsx, .xls) are supported")

    # Read File
    try:
        contents = await file.read()
        wb = load_workbook(BytesIO(contents), data_only=True)
        ws = wb.active
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid Excel file: {str(e)}")

    questions = []
    errors = []

    # Parse Rows (Skip header)
    for row_idx, row in enumerate(ws.iter_rows(min_row=2, values_only=True), start=2):
        try:
            # Expected: Question | Option A | Option B | Option C | Option D | Correct Answer (A/B/C/D) | Explanation
            if not row or not row[0]: continue  # Skip empty rows

            q_text = str(row[0]).strip()
            opt_a = str(row[1]).strip() if row[1] else ""
            opt_b = str(row[2]).strip() if row[2] else ""
            opt_c = str(row[3]).strip() if row[3] else ""
            opt_d = str(row[4]).strip() if row[4] else ""
            correct_char = str(row[5]).strip().upper() if row[5] else ""
            explanation = str(row[6]).strip() if len(row) > 6 and row[6] else ""

            # Validation
            if not q_text:
                errors.append(f"Row {row_idx}: Missing question text")
                continue
            
            options = [opt_a, opt_b, opt_c, opt_d]
            if any(not o for o in options):
                errors.append(f"Row {row_idx}: Missing one or more options")
                continue

            # Map Correct Answer
            char_map = {'A': 0, 'B': 1, 'C': 2, 'D': 3}
            if correct_char not in char_map:
                try:
                    # Try to parse as index 1-4
                    idx = int(correct_char) - 1
                    if 0 <= idx <= 3:
                        correct_index = idx
                    else:
                        raise ValueError
                except:
                    errors.append(f"Row {row_idx}: Invalid correct answer '{correct_char}' (Must be A, B, C, D or 1-4)")
                    continue
            else:
                correct_index = char_map[correct_char]

            questions.append({
                "question": q_text,
                "options": options,
                "correct_index": correct_index,
                "explanation": explanation,
                "marks": 1
            })

        except Exception as e:
            errors.append(f"Row {row_idx}: Processing error - {str(e)}")

    if not questions:
        msg = "No valid questions found in file"
        if errors:
            msg += f". Errors: {'; '.join(errors[:3])}..."
        raise HTTPException(status_code=400, detail=msg)

    # Get Topic Info for Metadata
    topic = db.query(models.Topic).filter(models.Topic.id == topic_id).first()
    if not topic and topic_id:
        raise HTTPException(status_code=404, detail="Topic not found")
    
    # Determine Owner Type
    owner_type = 'TEACHER' if current_user.role in ['TEACHER', 'ORG_ADMIN', 'DEPT_HEAD'] else 'SYSTEM'

    # Create Exam
    exam = models.Exam(
        topic_id=topic_id,
        course_id=topic.course_id if topic else None,
        type=exam_type,
        created_by_user_id=current_user.id,
        questions=questions,
        difficulty=difficulty,
        duration_minutes=len(questions) * 2,  # Auto-calc duration
        passing_score=70,
        creation_mode='IMPORT',
        owner_type=owner_type,
        exam_status='DRAFT',
        is_published=False,
        is_public=True
    )

    db.add(exam)
    db.commit()
    db.refresh(exam)

    return {
        "message": f"Successfully imported {len(questions)} questions",
        "exam_id": str(exam.id),
        "question_count": len(questions),
        "errors": errors  # Return warnings/errors for skipped rows
    }


@router.get("/upload/template")
def get_exam_upload_template():
    """Download Excel template for exam questions"""
    from openpyxl import Workbook
    from openpyxl.styles import Font, PatternFill, Alignment
    from io import BytesIO
    from fastapi.responses import StreamingResponse

    wb = Workbook()
    ws = wb.active
    ws.title = "Exam Questions"

    # Headers
    headers = ["Question Text", "Option A", "Option B", "Option C", "Option D", "Correct Answer (A-D)", "Explanation (Optional)"]
    
    header_fill = PatternFill(start_color="4F46E5", end_color="4F46E5", fill_type="solid")
    header_font = Font(bold=True, color="FFFFFF", size=12)

    for col, header in enumerate(headers, 1):
        cell = ws.cell(row=1, column=col, value=header)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center")

    # Column Widths
    ws.column_dimensions['A'].width = 50
    ws.column_dimensions['B'].width = 25
    ws.column_dimensions['C'].width = 25
    ws.column_dimensions['D'].width = 25
    ws.column_dimensions['E'].width = 25
    ws.column_dimensions['F'].width = 20
    ws.column_dimensions['G'].width = 40

    # Sample Data
    ws.append([
        "Which of the following is a valid Python variable name?",
        "1var",
        "var_1",
        "var-1",
        "break",
        "B",
        "Variable names cannot start with numbers or use hyphens. 'break' is a keyword."
    ])
    
    excel_file = BytesIO()
    wb.save(excel_file)
    excel_file.seek(0)

    return StreamingResponse(
        excel_file,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=exam_upload_template.xlsx"}
    )

# ============================================================================
# STUDENT ASSESSMENT ENDPOINTS
# ============================================================================

@router.get("/courses/{course_id}")
def get_course_exams(
    course_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """
    Get all institution-created exams for a specific course (for Assessments tab).
    Returns: TOPIC_TEST, MODULE, FINAL, and institution-created PRACTICE exams.
    Excludes: Student-generated practice exams.
    """
    # Get all topics for this course
    topics = db.query(models.Topic).filter(models.Topic.course_id == course_id).all()
    topic_ids = [t.id for t in topics]
    
    # Get all published AND active exams for these topics OR course-level exams
    # Filter for institution-created only (exclude student-generated)
    exams = db.query(models.Exam).filter(
        models.Exam.is_published == True,
        models.Exam.exam_status == 'ACTIVE',  # Only show ACTIVE exams to students
        models.Exam.owner_type.in_(['TEACHER', 'SYSTEM'])  # Removed ORG_ADMIN - not a valid enum value
    ).filter(
        # Either linked to a topic in this course OR directly to the course
        (models.Exam.topic_id.in_(topic_ids)) | (models.Exam.course_id == course_id)
    ).all()
    
    result = []
    for exam in exams:
        # Get topic/module info
        topic = None
        module_title = None
        if exam.topic_id:
            topic = db.query(models.Topic).filter(models.Topic.id == exam.topic_id).first()
            if topic:
                module_title = topic.title
                # If this is a child topic, get parent module name
                if topic.parent_topic_id:
                    parent = db.query(models.Topic).filter(models.Topic.id == topic.parent_topic_id).first()
                    if parent:
                        module_title = parent.title
        
        result.append({
            "id": exam.id,
            "title": exam.title if hasattr(exam, 'title') else f"{exam.type} Exam",
            "type": exam.type,
            "scope": exam.scope,
            "topic_id": exam.topic_id,
            "course_id": exam.course_id,
            "module_title": module_title,
            "duration_minutes": exam.duration_minutes,
            "passing_score": exam.passing_score,
            "questions": exam.questions,
            "max_attempts": getattr(exam, 'max_attempts', None),
            "owner_type": exam.owner_type,
            "remediation_notes": exam.remediation_notes,
            "created_at": exam.created_at
        })
    
    return result

@router.get("/{exam_id}/attempts")
def get_exam_attempts(
    exam_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """
    Get all attempts for a specific exam by the current user.
    """
    attempts = db.query(models.ExamAttempt).filter(
        models.ExamAttempt.exam_id == exam_id,
        models.ExamAttempt.user_id == current_user.id
    ).order_by(models.ExamAttempt.started_at.desc()).all()
    
    return [{
        "id": attempt.id,
        "score": attempt.score,
        "passed": attempt.passed,
        "answers": attempt.answers,
        "created_at": attempt.started_at
    } for attempt in attempts]
