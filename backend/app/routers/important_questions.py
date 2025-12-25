from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from .. import crud, models, schemas, database, auth

router = APIRouter(prefix="/courses/{course_id}/important-questions", tags=["important-questions"])

def verify_course_access(course_id: UUID, db: Session, current_user: models.User, require_write: bool = False):
    course = crud.get_course(db, course_id=course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
        
    # Super Admin / Org Admin can always access
    if current_user.role in [models.UserRole.SUPER_ADMIN, models.UserRole.ORG_ADMIN]:
        return course
        
    # Write access: Admins, HODs, and Teachers (can draft)
    if require_write:
        if current_user.role in [models.UserRole.TEACHER, models.UserRole.DEPT_HEAD, models.UserRole.ORG_ADMIN, models.UserRole.SUPER_ADMIN]:
            return course
        raise HTTPException(status_code=403, detail="Only Teachers and Admins can manage important questions")
        
    # Read access for students/teachers
    if current_user.role == models.UserRole.STUDENT:
        # Students: Must be enrolled (Organization check typical)
        if course.organization_id != current_user.organization_id:
             raise HTTPException(status_code=403, detail="Course not accessible")
    
    return course

@router.post("/", response_model=schemas.ImportantQuestion)
def create_important_question(
    course_id: UUID,
    question: schemas.ImportantQuestionCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """Create a new Important Question (Teachers/Admins)"""
    verify_course_access(course_id, db, current_user, require_write=True)
    
    db_question = models.ImportantQuestions(
        course_id=course_id,
        title=question.title,
        module_id=question.module_id,
        content=question.content,
        is_public=question.is_public,
        status="DRAFT", # Always start as DRAFT
        created_by_user_id=current_user.id
    )
    db.add(db_question)
    db.commit()
    db.refresh(db_question)
    return db_question

@router.get("/", response_model=List[schemas.ImportantQuestion])
def list_important_questions(
    course_id: UUID,
    module_id: Optional[UUID] = None,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """List important questions for a course"""
    course = verify_course_access(course_id, db, current_user)
    
    query = db.query(models.ImportantQuestions).filter(models.ImportantQuestions.course_id == course_id)
    
    if module_id:
        query = query.filter(models.ImportantQuestions.module_id == module_id)
        
    # Filtering Logic based on Roles
    if current_user.role == models.UserRole.STUDENT:
        query = query.filter(models.ImportantQuestions.status == models.QuestionStatus.PUBLISHED.value)
    elif current_user.role == models.UserRole.TEACHER:
        # Teachers see: PUBLISHED (all) OR their own questions (DRAFT/PENDING)
        # Or should they see all? Let's say they see all for collaboration, but strictly speaking maybe only theirs?
        # For simplicity and collaboration, Teachers see ALL questions, but status visibility differs?
        # Usually Teachers can see everything in the course they teach.
        pass 
        
    return query.all()

@router.get("/{question_id}", response_model=schemas.ImportantQuestion)
def get_important_question(
    course_id: UUID,
    question_id: UUID,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """Get specific question details"""
    verify_course_access(course_id, db, current_user)
    
    question = db.query(models.ImportantQuestions).filter(
        models.ImportantQuestions.id == question_id,
        models.ImportantQuestions.course_id == course_id
    ).first()
    
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
        
    # Student check
    if current_user.role == models.UserRole.STUDENT and not question.is_public:
         raise HTTPException(status_code=403, detail="Question not available")
         
    return question

@router.put("/{question_id}", response_model=schemas.ImportantQuestion)
def update_important_question(
    course_id: UUID,
    question_id: UUID,
    update_data: schemas.ImportantQuestionUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """Update a question"""
    verify_course_access(course_id, db, current_user, require_write=True)
    
    question = db.query(models.ImportantQuestions).filter(
        models.ImportantQuestions.id == question_id,
        models.ImportantQuestions.course_id == course_id
    ).first()
    
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
        
    data = update_data.dict(exclude_unset=True)
    for key, value in data.items():
        setattr(question, key, value)
        
    db.commit()
    db.refresh(question)
    return question

@router.delete("/{question_id}")
def delete_important_question(
    course_id: UUID,
    question_id: UUID,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """Delete a question"""
    verify_course_access(course_id, db, current_user, require_write=True)
    
    question = db.query(models.ImportantQuestions).filter(
        models.ImportantQuestions.id == question_id,
        models.ImportantQuestions.course_id == course_id
    ).first()
    
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
        
    db.delete(question)
    db.commit()
    return {"message": "Question deleted successfully"}

@router.post("/bulk-import", response_model=schemas.BulkImportResponse)
def bulk_import_important_questions(
    course_id: UUID,
    bulk_data: schemas.ImportantQuestionBulkImport,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.require_admin)
):
    """Bulk create questions"""
    verify_course_access(course_id, db, current_user, require_write=True)
    
    count = 0
    errors = []
    
    for idx, q_data in enumerate(bulk_data.questions):
        try:
            db_question = models.ImportantQuestions(
                course_id=course_id,
                title=q_data.title,
                module_id=q_data.module_id,
                content=q_data.content,
                is_public=q_data.is_public,
                created_by_user_id=current_user.id
            )
            db.add(db_question)
            count += 1
        except Exception as e:
            errors.append(f"Row {idx+1}: {str(e)}")
            
    if count > 0:
        db.commit()
        
    return {"imported_count": count, "errors": errors}

@router.patch("/{question_id}/publish")
def publish_important_question(
    course_id: UUID,
    question_id: UUID,
    status_data: dict, # { "is_public": boolean }
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.require_admin)
):
    """Toggle publish status"""
    verify_course_access(course_id, db, current_user, require_write=True)
    
    question = db.query(models.ImportantQuestions).filter(
        models.ImportantQuestions.id == question_id,
        models.ImportantQuestions.course_id == course_id
    ).first()
    
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
        
    question.is_public = status_data.get("is_public", False)
    db.commit()
    
    return {"message": "Status updated", "is_public": question.is_public}

@router.post("/{question_id}/request-approval")
def request_approval(
    course_id: UUID,
    question_id: UUID,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    verify_course_access(course_id, db, current_user, require_write=True)
    
    question = db.query(models.ImportantQuestions).filter(
        models.ImportantQuestions.id == question_id,
        models.ImportantQuestions.course_id == course_id
    ).first()
    
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
        
    if question.status != models.QuestionStatus.DRAFT.value and question.status != models.QuestionStatus.CHANGES_REQUESTED.value:
         raise HTTPException(status_code=400, detail="Only Draft or ChangesRequested questions can be submitted for approval")

    question.status = models.QuestionStatus.PENDING_APPROVAL.value
    db.commit()
    return {"message": "Approval requested", "status": question.status}


@router.post("/{question_id}/approve")
def approve_question(
    course_id: UUID,
    question_id: UUID,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    verify_course_access(course_id, db, current_user, require_write=True)
    
    question = db.query(models.ImportantQuestions).filter(
        models.ImportantQuestions.id == question_id,
        models.ImportantQuestions.course_id == course_id
    ).first()
    
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
        
    question.status = models.QuestionStatus.PUBLISHED.value
    question.is_public = True # Sync legacy field
    db.commit()
    return {"message": "Question approved and published", "status": question.status}


@router.post("/{question_id}/reject")
def reject_question(
    course_id: UUID,
    question_id: UUID,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    verify_course_access(course_id, db, current_user, require_write=True)
    
    question = db.query(models.ImportantQuestions).filter(
        models.ImportantQuestions.id == question_id,
        models.ImportantQuestions.course_id == course_id
    ).first()
    
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
        
    question.status = models.QuestionStatus.CHANGES_REQUESTED.value
    question.is_public = False
    db.commit()
    return {"message": "Question returned for changes", "status": question.status}
