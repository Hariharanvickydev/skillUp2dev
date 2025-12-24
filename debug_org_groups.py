"""
Quick test script to debug org groups for bulk upload
"""
import sys
sys.path.insert(0, '/Users/ideas2it/Documents/AI agent/backend')

from app import database, models
from sqlalchemy.orm import Session

# Get a database session
db = next(database.get_db())

# Query all org groups
org_groups = db.query(models.OrgGroup).all()

print(f"\n=== Total Org Groups: {len(org_groups)} ===\n")

for group in org_groups:
    parent_name = "None (Top Level)" if group.parent_id is None else f"Parent ID: {group.parent_id}"
    print(f"ID: {group.id}")
    print(f"Name: {group.name}")
    print(f"Parent: {parent_name}")
    print(f"Organization ID: {group.organization_id}")
    print("-" * 50)

# Check top-level groups
top_level = [g for g in org_groups if g.parent_id is None]
print(f"\n=== Top-Level Groups: {len(top_level)} ===")
for g in top_level:
    print(f"- {g.name}")

db.close()
