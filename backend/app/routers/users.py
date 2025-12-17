from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from uuid import UUID
from .. import crud, models, schemas, database, auth

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/", response_model=List[schemas.User])
def read_users(
    skip: int = 0,
    limit: int = 100,
    organization_id: Optional[UUID] = None,
    org_group_id: Optional[UUID] = None,
    role: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """
    List users.
    - Super Admins can see all.
    - Org Admins can only see users in their org.
    """
    if current_user.role != models.UserRole.SUPER_ADMIN:
        # If not Super Admin, enforce org filter
        if current_user.organization_id:
             organization_id = current_user.organization_id
        else:
             # Regular user without org? Should probably not see list
             return []
        
        # If Department Head, enforce group filter (Recursive)
        if current_user.role == models.UserRole.DEPT_HEAD and current_user.org_group_id:
            # Helper to get all descendant group IDs
            def _get_all_descendant_ids(session: Session, root_group_id: UUID) -> List[UUID]:
                all_ids = {root_group_id}
                queue = [root_group_id]
                while queue:
                    current = queue.pop(0)
                    children = session.query(models.OrgGroup).filter(models.OrgGroup.parent_id == current).all()
                    for child in children:
                        if child.id not in all_ids:
                            all_ids.add(child.id)
                            queue.append(child.id)
                return list(all_ids)
            
            org_group_id = _get_all_descendant_ids(db, current_user.org_group_id)

    users = crud.get_users(db, skip=skip, limit=limit, organization_id=organization_id, org_group_id=org_group_id, role=role, search=search)
    return users

import secrets
import string

@router.post("/", response_model=schemas.UserCreateResponse)
def create_user(
    user: schemas.UserCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.require_admin) # Super or Org Admin
):
    """
    Create a new user (admin only).
    """
    # Verify permission: only Super Admin can create Org Admins or Users in other orgs
    if current_user.role != models.UserRole.SUPER_ADMIN:
        if user.role == models.UserRole.SUPER_ADMIN:
            raise HTTPException(status_code=403, detail="Cannot create Super Admin")
        
        if user.organization_id and user.organization_id != current_user.organization_id:
            raise HTTPException(status_code=403, detail="Cannot create user in another organization")
            
        # Enforce org id for org admins
        if current_user.organization_id:
            user.organization_id = current_user.organization_id

    # Generate password if not provided
    temp_password = None
    if not user.password:
        alphabet = string.ascii_letters + string.digits
        temp_password = ''.join(secrets.choice(alphabet) for i in range(10))
        user.password = temp_password
    else:
        # If admin provides a password, we can optionally return it or not. 
        # Typically we don't return manually set passwords, but user asked for "generated a password".
        # Let's assume if they provided it, they know it.
        pass

    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Handle Department/Group Name (Hierarchy Support)
    if user.department_name and not user.org_group_id:
        # Get Organization Type to determine label
        org = db.query(models.Organization).filter(models.Organization.id == user.organization_id).first()
        org_type = org.type if org else "COLLEGE"
        
        # Determine Group Type based on Org Type
        group_type = "DEPARTMENT"
        if org_type == "SCHOOL":
            group_type = "STANDARD"
        
        # Check if top-level group exists in this org
        group = db.query(models.OrgGroup).filter(
            models.OrgGroup.organization_id == user.organization_id,
            func.lower(models.OrgGroup.name) == user.department_name.lower(),
            models.OrgGroup.parent_id == None # Top level
        ).first()

        if group:
            user.org_group_id = group.id
        else:
            # Create new group
            new_group = models.OrgGroup(
                organization_id=user.organization_id,
                name=user.department_name,
                type=group_type
            )
            db.add(new_group)
            db.flush() # Get ID
            user.org_group_id = new_group.id

    new_user = crud.create_user(db=db, user=user)
    
    # Attach temp password to response model
    # Convert SQLAlchemy model to Pydantic model response
    response = schemas.UserCreateResponse.from_orm(new_user)
    if temp_password:
        response.temp_password = temp_password
        
    return response

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: UUID,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.require_admin)
):
    """
    Delete a user.
    - Super Admin can delete anyone.
    - Org Admin can delete users in their org (except Super Admins).
    """
    user_to_delete = crud.get_user(db, user_id=user_id)
    if not user_to_delete:
        raise HTTPException(status_code=404, detail="User not found")

    if current_user.role != models.UserRole.SUPER_ADMIN:
        # Org Admin checks
        if user_to_delete.organization_id != current_user.organization_id:
            raise HTTPException(status_code=403, detail="Cannot delete user from another organization")
        if user_to_delete.role == models.UserRole.SUPER_ADMIN:
            raise HTTPException(status_code=403, detail="Cannot delete Super Admin")
            
    crud.delete_user(db, user_id=user_id)
    return None

@router.put("/{user_id}", response_model=schemas.User)
def update_user(
    user_id: UUID,
    user_update: schemas.UserUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.require_admin)
):
    """
    Update a user (e.g. suspend/activate).
    - Super Admin can update anyone.
    - Org Admin can update users in their org (except Super Admins).
    """
    db_user = crud.get_user(db, user_id=user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    if current_user.role != models.UserRole.SUPER_ADMIN:
        # Org Admin checks
        if db_user.organization_id != current_user.organization_id:
            raise HTTPException(status_code=403, detail="Cannot update user from another organization")
        if db_user.role == models.UserRole.SUPER_ADMIN:
            raise HTTPException(status_code=403, detail="Cannot update Super Admin")

    return crud.update_user(db, user_id=user_id, user=user_update)

@router.put("/{user_id}/reset-password", response_model=schemas.User)
def reset_password(
    user_id: UUID,
    password_data: schemas.PasswordReset,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.require_admin)
):
    """
    Reset a user's password.
    - Super Admin can reset anyone.
    - Org Admin can reset users in their org (except Super Admins).
    """
    db_user = crud.get_user(db, user_id=user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    if current_user.role != models.UserRole.SUPER_ADMIN:
        # Org Admin checks
        if db_user.organization_id != current_user.organization_id:
            raise HTTPException(status_code=403, detail="Cannot update user from another organization")
        if db_user.role == models.UserRole.SUPER_ADMIN:
            raise HTTPException(status_code=403, detail="Cannot update Super Admin")

    return crud.reset_password(db, user_id=user_id, new_password=password_data.new_password)
