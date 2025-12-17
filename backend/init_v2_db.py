
from app.database import engine, SessionLocal, Base
from app import models, auth
from sqlalchemy.orm import Session

def init_db():
    print("Creating tables in V2 Database...")
    # Drop all to ensure clean slate
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        print("Seeding Initial Data...")
        
        # 1. Super Admin
        super_admin = models.User(
            email="admin@skillup2dev.com",
            password_hash=auth.hash_password("admin123"),
            full_name="Platform Super Admin",
            role=models.UserRole.SUPER_ADMIN,
            is_active=True
        )
        db.add(super_admin)
        db.flush()
        
        # 2. Organization
        org = models.Organization(
            name="SkillUp University",
            domain="skillup.edu",
            subscription_plan=models.SubscriptionPlan.ENTERPRISE
        )
        db.add(org)
        db.flush()
        
        # 3. Department
        dept = models.Department(
            name="Computer Science",
            organization_id=org.id
        )
        db.add(dept)
        db.flush()
        
        # 4. Org Admin
        org_admin = models.User(
            email="dean@skillup.edu",
            password_hash=auth.hash_password("dean123"),
            full_name="Dean Simpson",
            role=models.UserRole.ORG_ADMIN,
            organization_id=org.id,
            is_active=True
        )
        db.add(org_admin)
        
        # 5. Teacher
        teacher = models.User(
            email="teacher@skillup.edu",
            password_hash=auth.hash_password("teacher123"),
            full_name="Prof. Alan Turing",
            role=models.UserRole.TEACHER,
            organization_id=org.id,
            department_id=dept.id,
            is_active=True
        )
        db.add(teacher)
        db.flush()
        
        # Set Dept Head
        dept.head_of_dept_user_id = teacher.id
        
        # 6. Student
        student = models.User(
            email="student@skillup.edu",
            password_hash=auth.hash_password("student123"),
            full_name="Jane Doe",
            role=models.UserRole.STUDENT,
            organization_id=org.id,
            department_id=dept.id,
            is_active=True
        )
        db.add(student)
        
        db.commit()
        print("Seeding Complete!")
        print(f"Super Admin: {super_admin.email}")
        print(f"Org Admin: {org_admin.email} (Org: {org.name})")
        print(f"Teacher: {teacher.email} (Dept: {dept.name})")
        print(f"Student: {student.email}")
        
    except Exception as e:
        print(f"Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
