from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from .. import crud, models, schemas, database, auth
import time

router = APIRouter(prefix="/courses", tags=["courses"])

@router.post("/", response_model=schemas.Course)
def create_course(
    course: schemas.CourseCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.require_admin)
):
    """Create a new course (Admin only)"""
    db_course = crud.create_course(db=db, course=course, creator_id=current_user.id)
    return db_course

@router.get("/", response_model=List[schemas.Course])
def read_courses(
    skip: int = 0,
    limit: int = 100,
    published_only: bool = False,
    db: Session = Depends(database.get_db)
):
    """List courses (public endpoint, optionally filter by published)"""
    courses = crud.get_courses(db, skip=skip, limit=limit, published_only=published_only)
    return courses

@router.get("/{course_id}", response_model=schemas.Course)
def read_course(course_id: UUID, db: Session = Depends(database.get_db)):
    course = crud.get_course(db, course_id=course_id)
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")
    return course

@router.post("/{course_id}/generate-topics", response_model=List[schemas.Topic])
def generate_topics(
    course_id: UUID,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.require_admin)
):
    """Generate topics for a course (Admin only)"""
    course = crud.get_course(db, course_id=course_id)
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Real AI Generation using Gemini
    import google.generativeai as genai
    import os
    import json
    
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-2.0-flash-exp')


    prompt = f"""
    You are an expert curriculum designer for a learning platform called 'SkillUp2Dev'.
    
    The user wants a course titled: "{course.title}"
    User Description/Context: "{course.description or ''}"

    Your task is to generate a COMPREHENSIVE and HIERARCHICAL structured curriculum for this course.
    
    CRITICAL INSTRUCTIONS:
    1. ANALYZE the inputs. 
       - If the input contains a raw syllabus (e.g. "Unit I: ... Unit II: ..."), structure that exact syllabus into the output.
       - If the input is just a topic (e.g. "Python Bootcamp"), GENERATE a comprehensive curriculum from scratch.
    
    2. HIERARCHICAL STRUCTURE (MANDATORY):
       - Create MODULES (parent topics) with order: 1, 2, 3, etc.
       - Each module MUST have SUB-TOPICS (child topics) with order: 1.1, 1.2, 1.3, etc.
       - Example: Module 1 has sub-topics 1.1, 1.2, 1.3; Module 2 has 2.1, 2.2, 2.3, etc.
       - Each module should have 4-8 sub-topics covering specific concepts within that module.
    
    3. COMPREHENSIVE COVERAGE:
       - Include ALL essential topics needed for complete mastery of the subject.
       - For "Python Basic Training", include ALL fundamental Python concepts organized into modules.
       - Each sub-topic should be a specific, learnable concept (not too broad, not too narrow).
    
    4. FORMAT the output as a strict JSON array of objects. Do not include markdown formatting (like ```json).
    
    JSON Structure (MUST include both modules and sub-topics):
    [
        {{
            "title": "Module 1: Introduction to Python",
            "description": "Overview of Python programming language and setup",
            "order": 1
        }},
        {{
            "title": "Topic 1.1: What is Python?",
            "description": "History, features, and applications of Python",
            "order": 1.1
        }},
        {{
            "title": "Topic 1.2: Installing Python",
            "description": "Setting up Python environment and IDE",
            "order": 1.2
        }},
        {{
            "title": "Module 2: Python Basics",
            "description": "Fundamental syntax and concepts",
            "order": 2
        }},
        {{
            "title": "Topic 2.1: Variables and Data Types",
            "description": "Understanding variables, integers, floats, strings",
            "order": 2.1
        }},
        ...
    ]
    
    Remember: 
    - EVERY module (order: 1, 2, 3...) MUST have sub-topics (order: 1.1, 1.2, 2.1, 2.2...)
    - This creates a clear learning path with organized modules and specific lessons
    """


    try:
        response = model.generate_content(prompt)
        # Clean potential markdown code blocks if the model adds them
        cleaned_text = response.text.replace("```json", "").replace("```", "").strip()
        generated_data = json.loads(cleaned_text)
        
        # Validate that it is a list
        if not isinstance(generated_data, list):
             raise ValueError("AI did not return a list")

    except Exception as e:
        print(f"AI Generation Error: {e}")
        raise HTTPException(status_code=500, detail=f"AI Generation Failed: {str(e)}")

    # Clear existing topics if we want to regenerate clean
    db.query(models.Topic).filter(models.Topic.course_id == course_id).delete()
    
    created_topics = []
    parent_map = {}  # Map parent order (e.g., "1") to topic object
    
    for t_data in generated_data:
        order_str = str(t_data.get("order", ""))
        
        # Parse hierarchical order (e.g., "1.1" means child of "1")
        if "." in order_str:
            # This is a sub-topic (e.g., "1.1", "2.3")
            parts = order_str.split(".")
            parent_order = parts[0]  # "1" from "1.1"
            child_order = int(parts[1]) if len(parts) > 1 else 1  # "1" from "1.1"
            
            # Find parent topic
            parent_topic = parent_map.get(parent_order)
            
            topic_in = schemas.TopicCreate(
                title=t_data.get("title", "Untitled Topic"),
                description=t_data.get("description", ""),
                order=child_order,
                parent_topic_id=parent_topic.id if parent_topic else None
            )
        else:
            # This is a parent topic (e.g., "1", "2")
            parent_order = int(float(order_str)) if order_str else len(parent_map) + 1
            
            topic_in = schemas.TopicCreate(
                title=t_data.get("title", "Untitled Topic"),
                description=t_data.get("description", ""),
                order=parent_order,
                parent_topic_id=None
            )
        
        topic = crud.create_topic(db=db, topic=topic_in, course_id=course_id)
        created_topics.append(topic)
        
        # Store parent topics for reference
        if "." not in order_str:
            parent_map[order_str if order_str else str(len(parent_map) + 1)] = topic
        
    return created_topics

@router.post("/{course_id}/topics", response_model=schemas.Topic)
def add_topic_manually(
    course_id: UUID,
    topic: schemas.TopicCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.require_admin)
):
    """Manually add a new topic to a course without AI generation (Admin only)"""
    course = crud.get_course(db, course_id=course_id)
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Create the topic
    new_topic = crud.create_topic(db=db, topic=topic, course_id=course_id)
    return new_topic

@router.delete("/{course_id}")
def delete_course(
    course_id: UUID,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.require_admin)
):
    """Delete a course and all its topics (Admin only)"""
    course = crud.get_course(db, course_id=course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    db.delete(course)
    db.commit()
    
    return {"message": "Course deleted successfully"}

@router.post("/{course_id}/publish")
def publish_course(
    course_id: UUID,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.require_admin)
):
    """Publish entire course - publishes all modules at once (Admin only)"""
    course = crud.get_course(db, course_id=course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Get all topics for this course
    topics = db.query(models.Topic).filter(models.Topic.course_id == course_id).all()
    
    if not topics:
        raise HTTPException(status_code=400, detail="Cannot publish course with no topics")
    
    # Check if all topics are approved
    unapproved_topics = [t for t in topics if t.status != "APPROVED"]
    if unapproved_topics:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot publish: {len(unapproved_topics)} topic(s) are not approved"
        )
    
    # Check if all topics have content
    topics_without_content = []
    for topic in topics:
        # Only check non-module topics (topics with parent_topic_id or no children)
        if topic.parent_topic_id is not None:  # This is a sub-topic, must have content
            content = db.query(models.TopicContent).filter(
                models.TopicContent.topic_id == topic.id
            ).first()
            if not content:
                topics_without_content.append(topic.title)
    
    if topics_without_content:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot publish: {len(topics_without_content)} topic(s) missing content"
        )
    
    # All validations passed, publish the course and all modules
    course.status = "PUBLISHED"
    
    # Publish all parent topics (modules)
    for topic in topics:
        if topic.parent_topic_id is None:  # This is a module
            topic.is_published = True
    
    db.commit()
    db.refresh(course)
    
    return {"message": "Course and all modules published successfully", "course": course}

@router.post("/{course_id}/modules/{module_id}/publish")
def publish_module(
    course_id: UUID,
    module_id: UUID,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.require_admin)
):
    """Publish a specific module (parent topic) independently (Admin only)"""
    # Validate course exists
    course = crud.get_course(db, course_id=course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Get the module (parent topic)
    module = db.query(models.Topic).filter(
        models.Topic.id == module_id,
        models.Topic.course_id == course_id,
        models.Topic.parent_topic_id == None  # Must be a parent topic (module)
    ).first()
    
    if not module:
        raise HTTPException(status_code=404, detail="Module not found or is not a parent topic")
    
    # Get all sub-topics for this module
    sub_topics = db.query(models.Topic).filter(
        models.Topic.parent_topic_id == module_id
    ).all()
    
    if not sub_topics:
        raise HTTPException(status_code=400, detail="Cannot publish module with no sub-topics")
    
    # Check if all sub-topics are approved
    unapproved = [t for t in sub_topics if t.status != "APPROVED"]
    if unapproved:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot publish module: {len(unapproved)} sub-topic(s) are not approved"
        )
    
    # Check if all sub-topics have content
    topics_without_content = []
    for topic in sub_topics:
        content = db.query(models.TopicContent).filter(
            models.TopicContent.topic_id == topic.id
        ).first()
        if not content:
            topics_without_content.append(topic.title)
    
    if topics_without_content:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot publish module: {len(topics_without_content)} sub-topic(s) missing content"
        )
    
    # All validations passed, publish the module
    module.is_published = True
    
    # Auto-publish course when first module is published (if not already published)
    if course.status != "PUBLISHED":
        course.status = "PUBLISHED"
    
    db.commit()
    db.refresh(module)
    db.refresh(course)
    
    return {
        "message": f"Module '{module.title}' published successfully",
        "module": module,
        "course_published": course.status == "PUBLISHED"
    }

