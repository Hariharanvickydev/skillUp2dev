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
    model = genai.GenerativeModel('gemini-flash-latest')

    prompt = f"""
    You are an expert curriculum designer for a learning platform called 'SkillUp2Dev'.
    
    The user wants a course titled: "{course.title}"
    User Description/Context: "{course.description or ''}"

    Your task is to generate a COMPREHENSIVE and COMPLETE structured list of topics (syllabus) for this course.
    
    CRITICAL INSTRUCTIONS:
    1. ANALYZE the inputs. 
       - If the input contains a raw syllabus (e.g. "Unit I: ... Unit II: ..."), structure that exact syllabus into the output.
       - If the input is just a topic (e.g. "Python Bootcamp"), GENERATE a comprehensive curriculum from scratch.
    
    2. COMPREHENSIVE COVERAGE:
       - Include ALL essential topics needed for complete mastery of the subject.
       - DO NOT limit yourself to a specific number of topics (e.g., 10 or 15).
       - For "Python Basic Training", include ALL fundamental Python concepts (variables, data types, control flow, functions, OOP, file I/O, error handling, modules, etc.).
       - For advanced courses, include all intermediate and advanced topics as appropriate.
       - Think about what a student needs to know to be job-ready or proficient in the subject.
    
    3. QUALITY OVER ARBITRARY LIMITS:
       - If a beginner course needs 20+ topics to cover fundamentals properly, include all 20+.
       - If an advanced course needs 30+ topics, include all 30+.
       - Each topic should be substantial and meaningful, not artificially split or combined.
    
    4. FORMAT the output as a strict JSON array of objects. Do not include markdown formatting (like ```json).
    
    JSON Structure:
    [
        {{
            "title": "Topic Title (e.g. 'Unit I: Basics' or 'Chapter 1: Setup')",
            "description": "Brief summary of what this topic covers (2-3 sentences).",
            "order": 1
        }},
        ...
    ]
    
    Remember: COMPLETENESS is more important than brevity. Include everything a learner needs.
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
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Delete the course (cascade will delete topics and content)
    db.delete(course)
    db.commit()
    
    return {"message": "Course deleted successfully"}
