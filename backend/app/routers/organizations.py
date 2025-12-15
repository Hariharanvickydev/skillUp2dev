from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from .. import crud, models, schemas, database, auth

router = APIRouter(prefix="/organizations", tags=["organizations"])

@router.get("/", response_model=List[schemas.Organization])
def read_organizations(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.require_super_admin)
):
    """List all organizations (Super Admin only)"""
    orgs = crud.get_organizations(db, skip=skip, limit=limit)
    return orgs

@router.post("/", response_model=schemas.Organization)
def create_organization(
    organization: schemas.OrganizationBase,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.require_super_admin)
):
    """Create a new organization (Super Admin only)"""
    return crud.create_organization(db=db, organization=organization)

@router.get("/{org_id}", response_model=schemas.Organization)
def read_organization(
    org_id: UUID,
    db: Session = Depends(database.get_db),
    # current_user: models.User = Depends(auth.get_current_active_user) # Allow any authenticated user for now
):
    """Get organization details"""
    org = crud.get_organization(db, org_id=org_id)
    if org is None:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org
