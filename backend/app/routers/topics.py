from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from uuid import UUID
from .. import crud, models, schemas, database, auth
import google.generativeai as genai
import os
from datetime import datetime

router = APIRouter(prefix="/topics", tags=["topics"])

@router.post("/{topic_id}/generate-content")
def generate_content(
    topic_id: UUID,
    request_body: dict = Body(default={}),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.require_admin)
):
    """Generate AI content for a topic with optional feedback"""
    topic = db.query(models.Topic).filter(models.Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    # Get course context
    course = db.query(models.Course).filter(models.Course.id == topic.course_id).first()

    # Setup AI
    # Setup AI
    try:
        from ..ai import get_ai_model
        model = get_ai_model()
    except ImportError as e:
        print(f"CRITICAL ERROR: Failed to import AI module: {e}")
        raise HTTPException(status_code=500, detail=f"Server Configuration Error: Could not load AI module. {str(e)}")
    except Exception as e:
        print(f"CRITICAL ERROR: Failed to initialize AI model: {e}")
        raise HTTPException(status_code=500, detail=f"AI Configuration Error: {str(e)}")

    # 2. Prepare the prompt with optional feedback
    feedback = request_body.get('feedback') if request_body else None
    
    base_prompt = f"""
    Generate comprehensive and engaging educational content for a topic titled "{topic.title}".
    The topic belongs to a course titled "{course.title}" which is described as: "{course.description}".

    The content should be suitable for an educational setting, covering key concepts,
    examples, and practical applications related to "{topic.title}".
    Ensure the content is well-structured, easy to understand, and informative.
    Aim for a length of approximately 500-800 words.
    
    CRITICAL FORMATTING INSTRUCTIONS:
    - Return ONLY the markdown content itself
    - DO NOT wrap the content in code blocks (no ```markdown or ``` tags)
    - DO NOT add any preamble or explanation
    - Use proper markdown formatting: # for headers, ** for bold, * for italic, - for lists, etc.
    - Start directly with the content (e.g., "# Introduction to...")
    - Include code examples in proper markdown code blocks when relevant
    
    Example of correct format:
    # Introduction to {topic.title}
    
    This topic covers...
    
    ## Key Concepts
    
    **Important Point**: Description here...
    """
    
    if feedback:
        prompt = f"""{base_prompt}

IMPORTANT USER FEEDBACK:
{feedback}

Please address this feedback and decide whether to:
- Replace the content entirely if major changes are needed
- Append/modify specific sections if minor improvements are needed
"""
    else:
        prompt = base_prompt

    # 3. Generate content
    try:
        response = model.generate_content(prompt)
        content_text = response.text
        
        # Clean up any markdown code blocks that the AI might have added
        content_text = content_text.strip()
        if content_text.startswith("```markdown"):
            content_text = content_text[len("```markdown"):].strip()
        elif content_text.startswith("```"):
            content_text = content_text[3:].strip()
        
        if content_text.endswith("```"):
            content_text = content_text[:-3].strip()
            
    except Exception as e:
        error_msg = str(e)
        print(f"ERROR in generate_content: {error_msg}")  # Debug logging
        print(f"Exception type: {type(e)}")  # Debug logging
        import traceback
        traceback.print_exc()  # Print full traceback
        
        # Check for quota/rate limit errors
        if "429" in error_msg or "quota" in error_msg.lower() or "rate limit" in error_msg.lower():
            raise HTTPException(
                status_code=429,
                detail={
                    "error": "API_QUOTA_EXCEEDED",
                    "message": "Gemini API quota exceeded. Please wait for quota reset or upgrade your plan.",
                    "suggestion": "Free tier: 20 requests/day. Consider upgrading to paid tier for higher limits.",
                    "docs": "https://ai.google.dev/gemini-api/docs/rate-limits"
                }
            )
        # Generic AI error
        raise HTTPException(status_code=500, detail=f"AI Generation Failed: {error_msg}")

    # 4. Save to DB
    # Check if content already exists
    existing_content = db.query(models.TopicContent).filter(
        models.TopicContent.topic_id == topic_id
    ).first()

    if existing_content:
        existing_content.content = content_text
        existing_content.updated_at = datetime.utcnow()
    else:
        new_content = models.TopicContent(
            topic_id=topic_id,
            content=content_text
        )
        db.add(new_content)

    db.commit()

    return {
        "message": "Content generated successfully",
        "content": content_text
    }

@router.get("/{topic_id}/content", response_model=schemas.TopicContent)
def get_topic_content(
    topic_id: UUID,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """Get content for a topic"""
    content = db.query(models.TopicContent).filter(
        models.TopicContent.topic_id == topic_id
    ).first()

    if not content:
        raise HTTPException(status_code=404, detail="Content not found")

    return content

@router.post("/{topic_id}/approve", response_model=schemas.Topic)
def approve_topic(
    topic_id: UUID,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.require_admin)
):
    """Approve a topic (Admin only)"""
    topic = db.query(models.Topic).filter(models.Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    # Mark content as approved
    content = crud.get_topic_content(db, topic_id)
    if content:
        content.is_approved = True
        db.commit()

    # Mark topic as approved
    topic.status = "APPROVED"
    db.commit()
    db.refresh(topic)

    return topic

@router.put("/{topic_id}", response_model=schemas.Topic)
def update_topic(
    topic_id: UUID,
    topic_update: schemas.TopicUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.require_admin)
):
    """Update a topic (Admin only)"""
    topic = db.query(models.Topic).filter(models.Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    
    if topic_update.title is not None:
        topic.title = topic_update.title
    if topic_update.description is not None:
        topic.description = topic_update.description
    if topic_update.order is not None:
        topic.order = topic_update.order
    
    db.commit()
    db.refresh(topic)
    
    return topic

@router.delete("/{topic_id}")
def delete_topic(
    topic_id: UUID,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.require_admin)
):
    """Delete a topic (Admin only)"""
    topic = db.query(models.Topic).filter(models.Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    
    db.delete(topic)
    db.commit()
    return {"message": "Topic deleted successfully"}

@router.post("/{topic_id}/request-approval")
def request_topic_approval(
    topic_id: UUID,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(database.get_db)
):
    """
    Topic/Module Approval Request (Teacher Action).
    """
    topic = db.query(models.Topic).filter(models.Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
        
    is_teacher = current_user.role == models.UserRole.TEACHER
    if is_teacher:
        course = topic.course
        # Check if assigned via primary field OR M2M assignees
        is_assigned = (course.assigned_teacher_id == current_user.id or 
                      current_user in course.assignees)
        is_creator = course.creator_id == current_user.id
        if not (is_assigned or is_creator):
             raise HTTPException(status_code=403, detail="Not authorized to edit this course")

    # Validation: Check content for module (children)
    children = db.query(models.Topic).filter(models.Topic.parent_topic_id == topic.id).all()
    if children:
        for child in children:
            if not child.content:
                 # Check if content exists in TopicContent
                 if not child.has_content and not db.query(models.TopicContent).filter(models.TopicContent.topic_id == child.id).first():
                     raise HTTPException(status_code=400, detail=f"Topic '{child.title}' is empty. Please add content.")
    
    topic.status = "PENDING_APPROVAL"
    db.commit()
    return {"status": "PENDING_APPROVAL"}

@router.post("/{topic_id}/approve")
def approve_topic(
    topic_id: UUID,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(database.get_db)
):
    """
    Approve Topic/Module (HOD/Admin Action).
    """
    if current_user.role not in [models.UserRole.ORG_ADMIN, models.UserRole.DEPT_HEAD, models.UserRole.SUPER_ADMIN]:
        raise HTTPException(status_code=403, detail="Only HOD or Admin can approve content")

    topic = db.query(models.Topic).filter(models.Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    topic.status = "APPROVED"
    db.commit()
    return {"status": "APPROVED"}

@router.post("/{topic_id}/reject")
def reject_topic(
    topic_id: UUID,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(database.get_db)
):
    """
    Reject Topic/Module (HOD/Admin Action).
    """
    if current_user.role not in [models.UserRole.ORG_ADMIN, models.UserRole.DEPT_HEAD, models.UserRole.SUPER_ADMIN]:
        raise HTTPException(status_code=403, detail="Only HOD or Admin can reject content")

    topic = db.query(models.Topic).filter(models.Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    topic.status = "REJECTED"
    db.commit()
    return {"status": "REJECTED"}

@router.put("/{topic_id}/content")
def update_topic_content(
    topic_id: UUID,
    content_body: dict = Body(...),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.require_admin)
):
    """Update topic content manually (Admin/Teacher)"""
    topic = db.query(models.Topic).filter(models.Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
        
    content_text = content_body.get('content')
    if content_text is None:
        raise HTTPException(status_code=400, detail="Content is required")

    # Check if content already exists
    existing_content = db.query(models.TopicContent).filter(
        models.TopicContent.topic_id == topic_id
    ).first()

    if existing_content:
        existing_content.content = content_text
        existing_content.updated_at = datetime.utcnow()
    else:
        new_content = models.TopicContent(
            topic_id=topic_id,
            content=content_text
        )
        db.add(new_content)
    
    # NEW: Mark as synced (since user manually merged/edited) to avoid flagging as out-of-date immediately
    topic.last_synced_at = datetime.utcnow()
    
    # CONTENT VERSIONING: If topic is APPROVED, unpublish the module
    if topic.status == "APPROVED":
        # Find the module (parent topic)
        if topic.parent_topic_id:
            module = db.query(models.Topic).filter(models.Topic.id == topic.parent_topic_id).first()
        else:
            module = topic  # This IS the module
        
        # Unpublish the module so students see old version until HOD re-approves
        if module and module.is_published:
            module.is_published = False
            # Mark course as having pending updates
            course = topic.course
            if course:
                course.has_pending_updates = True

    db.commit()
    return {"message": "Content updated successfully"}

@router.post("/{module_id}/republish")
def republish_module(
    module_id: UUID,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """
    Re-publish a module after reviewing updates to approved content.
    Only HOD and Admins can re-publish.
    """
    # Permission check: HOD or Admin only
    if current_user.role not in [models.UserRole.DEPT_HEAD, models.UserRole.ORG_ADMIN, models.UserRole.SUPER_ADMIN]:
        raise HTTPException(status_code=403, detail="Only HOD or Admin can re-publish modules")
    
    module = db.query(models.Topic).filter(models.Topic.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    # Verify this is a module (parent topic)
    if module.parent_topic_id is not None:
        raise HTTPException(status_code=400, detail="Can only republish modules, not sub-topics")
    
    # Verify all children topics are APPROVED
    children = db.query(models.Topic).filter(models.Topic.parent_topic_id == module_id).all()
    for child in children:
        if child.status != "APPROVED":
            raise HTTPException(
                status_code=400, 
                detail=f"Topic '{child.title}' is not approved. All topics must be approved before publishing."
            )
    
    # Re-publish the module
    module.is_published = True
    
    # Clear pending updates flag on course
    course = module.course
    if course:
        course.has_pending_updates = False
    
    db.commit()
    db.refresh(module)
    
    return {"message": "Module re-published successfully", "module": module}

