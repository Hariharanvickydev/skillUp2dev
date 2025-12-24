import requests
import json
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base, DATABASE_URL
from app import models

# Setup DB connection to find a user and exam
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

def debug_attempts():
    print("--- Debugging Attempts Endpoint ---")
    
    # 1. Login as a student (or find one)
    # Find a student user
    student = db.query(models.User).filter(models.User.role == 'STUDENT').first()
    if not student:
        print("No student user found in DB.")
        return

    print(f"Testing with student: {student.email}")
    
    # We need a token. Let's try to login via API if possible, or just hack it if we knew the secret.
    # Since we don't know the password for sure (hashed), we rely on login endpoint or creating a token if we have the util.
    # Let's try to simulate login with a known test user if exists, or create one.
    
    # Actually, simpler: Use `TestClient` to bypass auth if I can override dependency? 
    # No, we want to test the running server.
    
    # Let's try to login with common credentials, or create a temp user.
    # But wait, the user is likely logged in on frontend.
    
    # Let's just try to hit the endpoint using `requests` with a fake token to see if we get 401 (server up) or Connection Error.
    try:
        res = requests.get("http://localhost:8000/exams/123/attempts", timeout=5)
        print(f"Random ID Request Check: Status {res.status_code}")
        if res.status_code == 422:
             print("Server is reachable (Validation Error as expected for non-UUID)")
        elif res.status_code == 401:
             print("Server is reachable (Unauthorized as expected)")
        else:
             print(f"Server response unexpected: {res.text}")
             
    except Exception as e:
        print(f"CRITICAL: Server unreachable. Connection error: {e}")
        return

    # 2. Get Course Exams (assuming we have a course)
    # Find an exam
    exam = db.query(models.Exam).first()
    if not exam:
        print("No exams found in DB.")
        return
        
    print(f"Found exam: {exam.id} ({exam.title})")
    
    # Since we can't easily get a valid token without password, 
    # we verified server is up above. 
    # The "Network Error" in frontend often implies CORS or 500 crash where CORS headers are lost.
    
    # Let's check if there are any obvious schema mismatches causing crash in `get_exam_attempts`
    # The endpoint calls:
    # attempts = db.query(models.ExamAttempt).filter(...)
    # return [dict(attempt) for attempt in attempts]
    
    # Check ExamAttempt model columns vs DB
    from sqlalchemy import inspect
    inspector = inspect(engine)
    columns = [c['name'] for c in inspector.get_columns('exam_attempts')]
    print(f"DB Columns in 'exam_attempts': {columns}")
    
    expected_cols = ['id', 'exam_id', 'user_id', 'answers', 'score', 'passed', 'created_at'] # based on router
    missing = [c for c in expected_cols if c not in columns]
    if missing:
        print(f"CRITICAL: Missing columns in 'exam_attempts': {missing}")
    else:
        print("'exam_attempts' schema looks correct.")

if __name__ == "__main__":
    try:
        debug_attempts()
    except Exception as e:
        print(f"Script Error: {e}")
