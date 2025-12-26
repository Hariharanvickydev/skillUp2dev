from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any
from uuid import UUID
from .. import crud, models, schemas, database, auth

router = APIRouter(prefix="/library", tags=["library"])

@router.get("/courses", response_model=List[schemas.Course])
def list_library_courses(
    skip: int = 0,
    limit: int = 100,
    search: str = None,
    difficulty: str = None,
    category: str = None,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """List all Master Library Courses (is_library_course=True) with filtering"""
    query = db.query(models.Course).filter(models.Course.is_library_course == True)
    
    if search:
        query = query.filter(models.Course.title.ilike(f"%{search}%"))
        
    if difficulty and difficulty != "All Levels":
        query = query.filter(models.Course.difficulty == difficulty)
        
    if category and category != "All Categories":
        query = query.filter(models.Course.category == category)
        
    courses = query.offset(skip).limit(limit).all()
    
    # Check for existing imports if user is an Org Admin
    if current_user and current_user.role == models.UserRole.ORG_ADMIN and current_user.organization_id:
        org_id = current_user.organization_id
        # Get all mapped course IDs for this org
        # Map: parent_course_id -> local_course_id
        clones = db.query(models.Course.parent_course_id, models.Course.id).filter(
            models.Course.organization_id == org_id,
            models.Course.parent_course_id.in_([c.id for c in courses])
        ).all()
        
        clone_map = {parent_id: local_id for parent_id, local_id in clones}
        
        # Attach to response (Pydantic will handle this if we set attribute)
        for c in courses:
            c.existing_clone_id = clone_map.get(c.id)

    return courses

@router.post("/courses/{course_id}/import")
def import_course_to_org(
    course_id: UUID,
    target_org_id: UUID,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """Clone a Master Course to an Organization"""
    # 1. Fetch original course
    original_course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not original_course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # 2. Verify Org exists
    org = db.query(models.Organization).filter(models.Organization.id == target_org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    # 3. Create new Course
    new_course = models.Course(
        title=original_course.title,
        description=original_course.description,
        settings=original_course.settings,
        status="DRAFT", # Start as draft in the new org
        creator_id=current_user.id, # Super Admin is the technical creator, logic can vary
        organization_id=target_org_id,
        parent_course_id=original_course.id,
        is_library_course=False,
        is_published=False
    )
    db.add(new_course)
    db.flush() # Get ID
    
    # 4. Copy Topics and Content (Deep Copy)
    # Get all topics for original course
    original_topics = db.query(models.Topic).filter(models.Topic.course_id == course_id).order_by(models.Topic.order).all()
    
    # Map old_topic_id -> new_topic_id for parent/child relationship
    topic_map = {}
    
    # First pass: Create all topics (parent and child)
    # We need to handle hierarchy. Since we ordered by 'order' and we have parent_topic_id, 
    # we might need to be careful. Safest is to create all modules first, then subtopics?
    # Or just create all and then link?
    # Or just iterate. 
    # Let's do: Create modules (parent_topic_id=None) first. Then subtopics.
    
    modules = [t for t in original_topics if t.parent_topic_id is None]
    subtopics = [t for t in original_topics if t.parent_topic_id is not None]
    
    # Create Modules
    for mod in modules:
        new_mod = models.Topic(
            course_id=new_course.id,
            title=mod.title,
            description=mod.description,
            order=mod.order,
            status="DRAFT",  # Start as DRAFT, teacher can request approval later
            is_published=False,
            source_topic_id=mod.id
        )
        db.add(new_mod)
        db.flush()
        topic_map[mod.id] = new_mod.id
        
        # Copy Content for Module if any (unlikely for module, but possible)
        copy_content(db, mod.id, new_mod.id)

    # Create Subtopics
    for sub in subtopics:
        new_parent_id = topic_map.get(sub.parent_topic_id)
        if new_parent_id:
            new_sub = models.Topic(
                course_id=new_course.id,
                title=sub.title,
                description=sub.description,
                order=sub.order,
                parent_topic_id=new_parent_id,
                status="DRAFT",  # Start as DRAFT, teacher can request approval later
                is_published=False,
                source_topic_id=sub.id
            )
            db.add(new_sub)
            db.flush()
            
            # Copy Content
            copy_content(db, sub.id, new_sub.id)
            topic_map[sub.id] = new_sub.id

    # 5. Copy Exams (Draft Mode)
    # Fetch all exams linked to this course (Course-level, Module-level, Topic-level)
    original_exams = db.query(models.Exam).filter(
        (models.Exam.course_id == course_id) |
        (models.Exam.module_id.in_(topic_map.keys())) |
        (models.Exam.topic_id.in_(topic_map.keys()))
    ).all()

    for exam in original_exams:
        new_topic_id = topic_map.get(exam.topic_id) if exam.topic_id else None
        new_module_id = topic_map.get(exam.module_id) if exam.module_id else None
        
        # Determine if we should copy this exam
        # Case 1: Course Level (linked to course_id, no topic/module)
        # Case 2: Linked to a topic/module that exists in map
        should_copy = False
        if exam.course_id == course_id: should_copy = True
        if new_topic_id or new_module_id: should_copy = True
        
        if should_copy:
            new_exam = models.Exam(
                course_id=new_course.id,
                topic_id=new_topic_id,
                module_id=new_module_id,
                difficulty=exam.difficulty,
                duration_minutes=exam.duration_minutes,
                passing_score=exam.passing_score,
                type=exam.type,
                questions=exam.questions,
                is_published=False, # Draft
                # explanation/etc if needed
            )
            db.add(new_exam)

    # 6. Copy Important Questions (IQs) - Only PUBLISHED questions
    original_iqs = db.query(models.ImportantQuestions).filter(
        (models.ImportantQuestions.course_id == course_id) |
        (models.ImportantQuestions.module_id.in_(topic_map.keys())),
        models.ImportantQuestions.status == models.QuestionStatus.PUBLISHED
    ).all()
    
    for iq in original_iqs:
        new_module_id = topic_map.get(iq.module_id) if iq.module_id else None
        
        # Similar Logic
        should_copy = False
        if iq.course_id == course_id: should_copy = True
        if new_module_id: should_copy = True
        
        if should_copy:
            new_iq = models.ImportantQuestions(
                title=iq.title,
                course_id=new_course.id,
                module_id=new_module_id,
                content=iq.content,
                source_question_id=iq.id,
                created_by_user_id=current_user.id
            )
            db.add(new_iq)
            
    db.commit()
    
    return {"message": "Course imported successfully", "new_course_id": new_course.id}

def copy_content(db: Session, original_topic_id: UUID, new_topic_id: UUID):
    """Helper to copy topic content"""
    content = db.query(models.TopicContent).filter(models.TopicContent.topic_id == original_topic_id).first()
    if content:
        new_content = models.TopicContent(
            topic_id=new_topic_id,
            content=content.content,
            is_approved=False
        )
        db.add(new_content)

@router.patch("/courses/{course_id}/review")
def review_library_course(
    course_id: UUID,
    flags: Dict[str, Any],
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.require_super_admin)
):
    """Review a course: update flags (missing_topics, low_quality, etc.)"""
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Merge flags
    current_flags = course.flags or {}
    current_flags.update(flags)
    course.flags = current_flags
    
    db.commit()
    db.refresh(course)
    return course

@router.get("/courses/{course_id}/sync-status")
def get_sync_status(
    course_id: UUID,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.require_admin)
):
    """
    Check for updates from the Master Library Course.
    Returns a list of topics that are new or have updates available.
    """
    # 1. Get Org Course
    org_course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not org_course:
        raise HTTPException(status_code=404, detail="Course not found")
        
    # Permission Check (Read Access)
    permission_error = HTTPException(status_code=403, detail="Not authorized to view this course")
    if current_user.role == models.UserRole.TEACHER:
        # Must be assigned or assignee
        is_assigned = org_course.assigned_teacher_id == current_user.id
        if not is_assigned:
             # Check assignees
             is_assignee = current_user in org_course.assignees
             if not is_assignee:
                 raise permission_error
    elif current_user.role == models.UserRole.DEPT_HEAD:
        # Must be in hierarchy (Simplified check: if course in their group tree? or just allow HODs to view anything in their org for now to match other endpoints?)
        # For simplicity, let's trust require_admin for now but ideally check group.
        # Strict: Check if course teacher is in HOD group.
        pass

    if not org_course.parent_course_id:
        return {"status": "UP_TO_DATE", "updates": [], "message": "This course is not linked to a library course."}
        
    # 2. Get Parent Course Topics (Library)
    library_topics = db.query(models.Topic).filter(models.Topic.course_id == org_course.parent_course_id).all()
    
    # 3. Get Local Topics
    local_topics = db.query(models.Topic).filter(models.Topic.course_id == course_id).all()
    
    # Map local topics by source_topic_id for easy lookup
    local_topic_map = {t.source_topic_id: t for t in local_topics if t.source_topic_id}
    
    updates = []
    
    for lib_topic in library_topics:
        # Check if topic exists locally
        local_match = local_topic_map.get(lib_topic.id)
        
        if not local_match:
            # NEW TOPIC
            updates.append({
                "type": "NEW",
                "library_topic": lib_topic,
                "local_topic": None,
                "message": "New topic available in library"
            })
        else:
            # Check for content updates based on timestamps
            lib_content = db.query(models.TopicContent).filter(models.TopicContent.topic_id == lib_topic.id).first()
            
            # Determine Library Last Modified Time
            # Use the later of Topic update or Content update
            # Topic model doesn't have updated_at, using created_at for metadata versioning
            lib_updated_at = lib_topic.created_at
            if lib_content and lib_content.updated_at:
                 # Ensure we have a valid timestamp to compare
                 if not lib_updated_at or lib_content.updated_at > lib_updated_at:
                    lib_updated_at = lib_content.updated_at
                
            # Check against Local Last Synced Time
            # If never synced, it's an update (unless we want to assume initial import is synced? 
            # No, if null, we assume we need to check or just flag it).
            # Let's say: if last_synced_at is None, we DO strictly compare content/time or assume available.
            
            is_new_update = False
            
            if local_match.last_synced_at:
                # SMART SYNC: Timestamp Comparison
                 if lib_updated_at > local_match.last_synced_at:
                     is_new_update = True
            else:
                # LEGACY FALLBACK: Content Comparison (Normalized)
                # If last_synced_at is NULL (migration case), we compare content.
                # If content is identical, we treat it as "Synced" (implicitly).
                # If content differs, we flag it.
                
                local_content = db.query(models.TopicContent).filter(models.TopicContent.topic_id == local_match.id).first()
                lib_text = (lib_content.content or "").replace('\r\n', '\n').strip() if lib_content else ""
                local_text = (local_content.content or "").replace('\r\n', '\n').strip() if local_content else ""
                
                if lib_text != local_text:
                    is_new_update = True

            if is_new_update:
                local_content = db.query(models.TopicContent).filter(models.TopicContent.topic_id == local_match.id).first()
                lib_text = lib_content.content if lib_content else ""
                local_text = local_content.content if local_content else ""

                updates.append({
                    "type": "UPDATE_AVAILABLE",
                    "library_topic": lib_topic,
                    "local_topic": local_match,
                    "library_content": lib_text,
                    "local_content": local_text,
                    "message": "Update available from library"
                })

    # 3. Check for Important Question Updates - Only PUBLISHED questions
    if org_course.parent_course_id:
        lib_questions = db.query(models.ImportantQuestions).filter(
            models.ImportantQuestions.course_id == org_course.parent_course_id,
            models.ImportantQuestions.status == models.QuestionStatus.PUBLISHED
        ).all()
        # Fetch local related questions
        local_questions = db.query(models.ImportantQuestions).filter(
            models.ImportantQuestions.course_id == course_id, 
            models.ImportantQuestions.source_question_id.isnot(None)
        ).all()
        local_q_map = {q.source_question_id: q for q in local_questions}
        
        for lib_q in lib_questions:
            local_match = local_q_map.get(lib_q.id)
            
            if not local_match:
                 updates.append({
                    "type": "NEW",
                    "library_question": lib_q, 
                    "message": "New question from library"
                })
            else:
                 # Compare content (JSON) and Title
                 # Note: lib_q.content is a dict, so direct comparison works
                 if lib_q.content != local_match.content or lib_q.title != local_match.title:
                     updates.append({
                        "type": "UPDATE_AVAILABLE",
                        "library_question": lib_q,
                        "local_question": local_match,
                        "library_content": str(lib_q.content),
                        "local_content": str(local_match.content),
                        "message": "Question updated"
                    })

    return {
        "status": "UPDATES_AVAILABLE" if updates else "UP_TO_DATE",
        "parent_course_id": org_course.parent_course_id,
        "updates": updates
    }

@router.post("/courses/{course_id}/sync")
def sync_course_content(
    course_id: UUID,
    sync_request: schemas.SyncRequest, # We need to create this schema
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.require_admin)
):
    """
    Apply selected updates from Library to Org Course.
    """
    # 1. Validation
    org_course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not org_course or not org_course.parent_course_id:
        raise HTTPException(status_code=400, detail="Invalid course for sync")

    # Permission Check (Write Access)
    if current_user.role not in [models.UserRole.SUPER_ADMIN, models.UserRole.ORG_ADMIN]:
        # Teacher/HOD Logic
        is_authorized = False
        if org_course.assigned_teacher_id == current_user.id:
            is_authorized = True
        elif current_user in org_course.assignees:
            is_authorized = True
        elif current_user.role == models.UserRole.DEPT_HEAD:
             # Basic HOD check: assume authorized if allowed to edit (router logic usually checks group)
             # For now, let's open it to HODs.
             is_authorized = True
        
        if not is_authorized:
             raise HTTPException(status_code=403, detail="Not authorized to update this course")
        
    synced_topics = []
    
    from datetime import datetime
    
    for item in sync_request.items:
        action = item.action # OVERWRITE, CREATE, IGNORE

        # --- IMPORTANT QUESTION SYNC ---
        if item.library_question_id:
            lib_quest = db.query(models.ImportantQuestions).filter(
                models.ImportantQuestions.id == item.library_question_id,
                models.ImportantQuestions.status == models.QuestionStatus.PUBLISHED
            ).first()
            if not lib_quest:
                continue

            if action == "CREATE":
                # Create duplicate
                new_quest = models.ImportantQuestions(
                    course_id=course_id,
                    title=lib_quest.title,
                    content=lib_quest.content,
                    created_by_user_id=current_user.id,
                    is_public=False, # Internal by default
                    source_question_id=lib_quest.id
                )
                db.add(new_quest)
            
            elif action == "OVERWRITE":
                local_quest = db.query(models.ImportantQuestions).filter(
                    models.ImportantQuestions.course_id == course_id,
                    models.ImportantQuestions.source_question_id == lib_quest.id
                ).first()
                if local_quest:
                    local_quest.title = lib_quest.title
                    local_quest.content = lib_quest.content
                    # local_quest.updated_at automatically handled? if not explicit datetime.utcnow()
            
            continue

        # --- TOPIC SYNC ---
        lib_topic_id = item.library_topic_id
        if not lib_topic_id:
            continue
        
        # Get Lib Topic
        lib_topic = db.query(models.Topic).filter(models.Topic.id == lib_topic_id).first()
        if not lib_topic: 
            continue
            
        if action == "IGNORE":
            # Just update last_synced_at to "Ack" the current version
            # Find local topic
            local_topic = db.query(models.Topic).filter(
                models.Topic.course_id == course_id,
                models.Topic.source_topic_id == lib_topic.id
            ).first()
            if local_topic:
                local_topic.last_synced_at = datetime.utcnow()
            continue
            
        if action == "CREATE":
            # Logic similar to import
            # Check parent locally if subtopic
            parent_id = None
            if lib_topic.parent_topic_id:
                # Find local parent that links to lib parent
                local_parent = db.query(models.Topic).filter(
                    models.Topic.course_id == course_id,
                    models.Topic.source_topic_id == lib_topic.parent_topic_id
                ).first()
                if local_parent:
                    parent_id = local_parent.id
                else:
                    # If parent doesn't exist locally, we skip or create parent first? 
                    # For simplicity, assume user syncs parent first or we handle dependency.
                    # Fallback: Create at root or skip
                    continue 

            new_topic = models.Topic(
                course_id=course_id,
                title=lib_topic.title,
                description=lib_topic.description,
                order=lib_topic.order,
                parent_topic_id=parent_id,
                status="DRAFT",
                source_topic_id=lib_topic.id,
                last_synced_at=datetime.utcnow() # Mark as synced
            )
            db.add(new_topic)
            db.flush()
            copy_content(db, lib_topic.id, new_topic.id)
            synced_topics.append(new_topic.id)
            
        elif action == "OVERWRITE":
            # Find local topic
            local_topic = db.query(models.Topic).filter(
                models.Topic.course_id == course_id,
                models.Topic.source_topic_id == lib_topic.id
            ).first()
            
            if local_topic:
                # Update metadata
                local_topic.title = lib_topic.title
                local_topic.description = lib_topic.description
                local_topic.last_synced_at = datetime.utcnow() # Mark as synced
                
                # Update Content
                # Delete old content? Or Update?
                local_content = db.query(models.TopicContent).filter(models.TopicContent.topic_id == local_topic.id).first()
                lib_content = db.query(models.TopicContent).filter(models.TopicContent.topic_id == lib_topic.id).first()
                
                if local_content:
                    local_content.content = lib_content.content if lib_content else ""
                else:
                    # Create if missing
                     new_c = models.TopicContent(topic_id=local_topic.id, content=lib_content.content if lib_content else "")
                     db.add(new_c)
                
                synced_topics.append(local_topic.id)
                
    db.commit()
    return {"message": "Sync complete", "synced_count": len(synced_topics)}

@router.delete("/questions/cloned")
def delete_all_cloned_questions(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.require_super_admin)
):
    """Delete all cloned questions (questions with source_question_id set)"""
    deleted_count = db.query(models.ImportantQuestions).filter(
        models.ImportantQuestions.source_question_id.isnot(None)
    ).delete(synchronize_session=False)
    
    db.commit()
    return {"message": f"Deleted {deleted_count} cloned questions", "count": deleted_count}
