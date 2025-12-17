import sys
import os

# Add backend/app directory to sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app import models, database
from sqlalchemy.orm import Session
from sqlalchemy import func

def print_hierarchy(db: Session, group_id, level=0):
    group = db.query(models.OrgGroup).filter(models.OrgGroup.id == group_id).first()
    if not group:
        return
        
    indent = "  " * level
    student_count = db.query(models.User).filter(
        models.User.org_group_id == group.id,
        models.User.role == models.UserRole.STUDENT
    ).count()
    
    print(f"{indent}- {group.name} ({group.type}) [ID: {group.id}] - Students: {student_count}")
    
    children = db.query(models.OrgGroup).filter(models.OrgGroup.parent_id == group.id).all()
    for child in children:
        print_hierarchy(db, child.id, level + 1)

def main():
    db = next(database.get_db())
    
    # 1. Find "Computer Science" dept
    cs_dept = db.query(models.OrgGroup).filter(func.lower(models.OrgGroup.name).like("%computer science%")).first()
    
    if not cs_dept:
        print("Could not find 'Computer Science' department.")
        # List all top level groups
        print("Top level groups:")
        top_groups = db.query(models.OrgGroup).filter(models.OrgGroup.parent_id == None).all()
        for g in top_groups:
             print(f"- {g.name} ({g.type})")
        return

    print(f"Found Dept: {cs_dept.name}")
    print("Hierarchy & Direct Student Counts:")
    print_hierarchy(db, cs_dept.id)
    
    # Verify Recursive Count logic match
    ids = [cs_dept.id]
    queue = [cs_dept.id]
    all_ids = {cs_dept.id}
    while queue:
        current = queue.pop(0)
        children = db.query(models.OrgGroup).filter(models.OrgGroup.parent_id == current).all()
        for child in children:
            if child.id not in all_ids:
                all_ids.add(child.id)
                queue.append(child.id)
    
    total_recursive = db.query(models.User).filter(
        models.User.org_group_id.in_(list(all_ids)),
        models.User.role == models.UserRole.STUDENT
    ).count()
    
    print(f"\nTotal Recursive Count: {total_recursive}")

if __name__ == "__main__":
    main()
