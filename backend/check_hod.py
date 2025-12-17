import sys
import os

# Add backend/app directory to sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app import models, database
from sqlalchemy.orm import Session
from sqlalchemy import func

def main():
    db = next(database.get_db())
    
    # Find DEPT_HEAD users
    hods = db.query(models.User).filter(models.User.role == models.UserRole.DEPT_HEAD).all()
    
    if not hods:
        print("No DEPT_HEAD users found!")
        return
        
    for hod in hods:
        print(f"\nHOD: {hod.full_name} ({hod.email})")
        print(f"  org_group_id: {hod.org_group_id}")
        
        if hod.org_group_id:
            group = db.query(models.OrgGroup).filter(models.OrgGroup.id == hod.org_group_id).first()
            if group:
                print(f"  Assigned to: {group.name} ({group.type})")
                
                # Get parent hierarchy
                parent = group
                hierarchy = [group.name]
                while parent.parent_id:
                    parent = db.query(models.OrgGroup).filter(models.OrgGroup.id == parent.parent_id).first()
                    if parent:
                        hierarchy.insert(0, parent.name)
                
                print(f"  Full Hierarchy: {' -> '.join(hierarchy)}")
            else:
                print(f"  WARNING: Group not found!")
        else:
            print(f"  WARNING: No org_group_id assigned!")
    
    # Also show Computer Science group ID
    cs_dept = db.query(models.OrgGroup).filter(func.lower(models.OrgGroup.name) == "computer science").first()
    if cs_dept:
        print(f"\nComputer Science Department ID: {cs_dept.id}")

if __name__ == "__main__":
    main()
