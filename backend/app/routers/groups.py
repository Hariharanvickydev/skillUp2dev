
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
import uuid

from app import models, schemas, database, auth

router = APIRouter(
    prefix="/org/groups",
    tags=["Organization Groups (Hierarchy)"]
)

@router.get("/", response_model=List[schemas.OrgGroup])
def get_groups(
    parent_id: Optional[uuid.UUID] = None,
    type: Optional[str] = None,
    organization_id: Optional[uuid.UUID] = None,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(database.get_db)
):
    """Fetch groups. Optional filters for parent_id or type."""
    target_org_id = current_user.organization_id
    if current_user.role == models.UserRole.SUPER_ADMIN and organization_id:
        target_org_id = organization_id

    query = db.query(models.OrgGroup).filter(models.OrgGroup.organization_id == target_org_id)
    
    if parent_id:
        query = query.filter(models.OrgGroup.parent_id == parent_id)
    if type:
        query = query.filter(models.OrgGroup.type == type)
        
    return query.all()

@router.get("/tree", response_model=List[schemas.OrgGroup])
def get_group_tree(
    organization_id: Optional[uuid.UUID] = None,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(database.get_db)
):
    """Fetch full hierarchy as a nested tree."""
    target_org_id = current_user.organization_id
    
    # Allow Super Admin to fetch for any org
    if current_user.role == models.UserRole.SUPER_ADMIN and organization_id:
        target_org_id = organization_id
        
    if not target_org_id:
        return []

    # 1. Fetch all groups for org
    groups = db.query(models.OrgGroup).filter(
        models.OrgGroup.organization_id == target_org_id
    ).all()
    
    # 2. Build Tree
    # If HOD, return their specific group as the root
    if current_user.role == models.UserRole.DEPT_HEAD and current_user.org_group_id:
        # Use simple lazy loading by joining is complicated for recursive. 
        # But we need children to be populated for Pydantic to serialize them.
        # Let's rely on Pydantic's recursive parsing which should trigger lazy loads 
        # IF the session is still active.
        # But to be safe, fetch roots and let Pydantic handle it.
        # IF that fails, we can add options(selectinload(models.OrgGroup.children))
        from sqlalchemy.orm import selectinload
        root_group = db.query(models.OrgGroup).options(
            selectinload(models.OrgGroup.children)
        ).filter(models.OrgGroup.id == current_user.org_group_id).first()
        return [root_group] if root_group else []

    # Otherwise return organizational roots
    roots = db.query(models.OrgGroup).filter(
        models.OrgGroup.organization_id == target_org_id,
        models.OrgGroup.parent_id == None
    ).all()
    
    # We rely on 'children' relationship being populated. 
    # Use response_model=List[schemas.OrgGroup] which has children: List[OrgGroup]
    return roots

@router.post("/", response_model=schemas.OrgGroup)
def create_group(
    group_data: schemas.OrgGroupBase,
    organization_id: Optional[uuid.UUID] = None, # Allow Super Admin to specify
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(database.get_db)
):
    target_org_id = current_user.organization_id
    
    # Permission Check
    if current_user.role == models.UserRole.SUPER_ADMIN:
        if organization_id:
            target_org_id = organization_id
    elif current_user.role == models.UserRole.ORG_ADMIN:
        pass # OK
    else:
        raise HTTPException(status_code=403, detail="Not authorized to create groups")

    if not target_org_id:
        raise HTTPException(status_code=400, detail="Organization context required")

    # Check uniqueness of name within the parent scope
    existing = db.query(models.OrgGroup).filter(
        models.OrgGroup.organization_id == target_org_id,
        models.OrgGroup.name == group_data.name,
        models.OrgGroup.parent_id == group_data.parent_id
    ).first()
    
    if existing:
        return existing

    new_group = models.OrgGroup(
        organization_id=target_org_id,
        name=group_data.name,
        type=group_data.type,
        parent_id=group_data.parent_id
    )
    
    db.add(new_group)
    db.commit()
    db.refresh(new_group)
    return new_group

@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_group(
    group_id: uuid.UUID,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(database.get_db)
):
    group = db.query(models.OrgGroup).filter(models.OrgGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    # Permission Check
    if current_user.role != models.UserRole.SUPER_ADMIN:
        if group.organization_id != current_user.organization_id:
            raise HTTPException(status_code=403, detail="Not authorized")
        if current_user.role != models.UserRole.ORG_ADMIN:
             raise HTTPException(status_code=403, detail="Not authorized")

    db.delete(group)
    db.commit()
    return None

@router.put("/{group_id}", response_model=schemas.OrgGroup)
def update_group(
    group_id: uuid.UUID,
    group_data: schemas.OrgGroupBase,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(database.get_db)
):
    group = db.query(models.OrgGroup).filter(models.OrgGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    # Permission Check
    if current_user.role != models.UserRole.SUPER_ADMIN:
        if group.organization_id != current_user.organization_id:
            raise HTTPException(status_code=403, detail="Not authorized")
        if current_user.role != models.UserRole.ORG_ADMIN:
             raise HTTPException(status_code=403, detail="Not authorized")

    group.name = group_data.name
    # group.type = group_data.type # Allow type change?
    
    db.commit()
    db.refresh(group)
    return group
