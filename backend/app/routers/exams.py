from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import google.generativeai as genai
import json
import os
from uuid import UUID

from ..database import get_db
from .. import models, schemas
from .. import auth

router = APIRouter(prefix="/exams", tags=["exams"])

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

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
    model = genai.GenerativeModel('gemini-flash-latest')
    
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
        
        # Create exam in database
        exam = models.Exam(
            topic_id=topic_id,
            questions=questions,
            difficulty=request.difficulty,
            duration_minutes=request.num_questions * 2,  # 2 minutes per question
            passing_score=70,
            is_published=True  # Practice exams are always available
        )
        
        db.add(exam)
        db.commit()
        db.refresh(exam)
        
        return exam
        
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
    
    # Record attempt
    attempt = models.ExamAttempt(
        exam_id=exam_id,
        user_id=current_user.id,
        answers=submission.answers,
        score=score,
        passed=passed
    )
    
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    
    return schemas.ExamResult(
        score=score,
        passed=passed,
        correct_answers=correct_answers,
        explanations=explanations,
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
        difficulty=exam.difficulty,
        duration_minutes=exam.duration_minutes,
        passing_score=exam.passing_score,
        questions=questions_for_student,
        created_at=exam.created_at
    )
