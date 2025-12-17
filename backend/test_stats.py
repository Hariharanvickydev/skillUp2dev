import sys
import os

# Add backend/app directory to sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app import models, database
from app.routers.org import get_org_dashboard_stats
from sqlalchemy.orm import Session

def main():
    db = next(database.get_db())
    
    # Find the HOD user
    hod = db.query(models.User).filter(models.User.role == models.UserRole.DEPT_HEAD).first()
    
    if not hod:
        print("No HOD found!")
        return
    
    print(f"Testing stats for HOD: {hod.full_name}")
    print(f"Role: {hod.role}")
    print(f"org_group_id: {hod.org_group_id}")
    
    try:
        # Call the stats endpoint function directly
        stats = get_org_dashboard_stats(current_user=hod, db=db)
        
        print("\n=== Dashboard Stats ===")
        print(f"Total Students: {stats['total_students']}")
        print(f"Active Students (7d): {stats['active_students_7d']}")
        print(f"Total Teachers: {stats['total_teachers']}")
        print(f"Total Courses: {stats['total_courses']}")
        print(f"Published Courses: {stats['published_courses']}")
        print(f"Pending Approvals: {stats['pending_approvals']}")
        
    except Exception as e:
        print(f"\nERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
