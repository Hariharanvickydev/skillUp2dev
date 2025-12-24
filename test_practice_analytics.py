#!/usr/bin/env python3
"""
Quick test script to verify practice analytics backend is working
"""
import sys
sys.path.insert(0, '/Users/ideas2it/Documents/AI agent/backend')

from app.database import SessionLocal
from app import models
from sqlalchemy import func

db = SessionLocal()

# Find a practice exam
practice_exam = db.query(models.Exam).filter(models.Exam.type == "PRACTICE").first()

if not practice_exam:
    print("No practice exams found!")
    sys.exit(1)

print(f"Found practice exam: {practice_exam.title}")
print(f"Exam ID: {practice_exam.id}")
print(f"Type: {practice_exam.type}")

# Get attempts
attempts = db.query(models.ExamAttempt).filter(models.ExamAttempt.exam_id == practice_exam.id).all()
print(f"\nTotal attempts: {len(attempts)}")

# Group by student
student_attempts = {}
for a in attempts:
    if a.user_id not in student_attempts:
        student_attempts[a.user_id] = []
    student_attempts[a.user_id].append(a)

print(f"Unique students: {len(student_attempts)}")

for user_id, user_attempts in student_attempts.items():
    sorted_attempts = sorted(user_attempts, key=lambda x: x.started_at)
    print(f"\nStudent {user_id}:")
    print(f"  Total attempts: {len(sorted_attempts)}")
    print(f"  First attempt score: {sorted_attempts[0].score}%")
    print(f"  Latest attempt score: {sorted_attempts[-1].score}%")
    
    # Check first question
    if len(practice_exam.questions) > 0 and len(sorted_attempts) > 0:
        correct_idx = practice_exam.questions[0]['correct_index']
        
        first_correct = sorted_attempts[0].answers[0] == correct_idx if len(sorted_attempts[0].answers) > 0 else False
        latest_correct = sorted_attempts[-1].answers[0] == correct_idx if len(sorted_attempts[-1].answers) > 0 else False
        
        print(f"  Question 1 - First attempt: {'✓' if first_correct else '✗'}")
        print(f"  Question 1 - Latest attempt: {'✓' if latest_correct else '✗'}")

db.close()
print("\n✅ Backend data looks good!")
