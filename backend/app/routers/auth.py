from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from .. import models, schemas, database, auth

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/signup", response_model=schemas.Token)
def signup(user_data: schemas.UserCreate, db: Session = Depends(database.get_db)):
    """Register a new user"""
    # Check if user already exists
    existing_user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Validate role
    if user_data.role not in [
        models.UserRole.SUPER_ADMIN, 
        models.UserRole.ORG_ADMIN, 
        models.UserRole.DEPT_HEAD, 
        models.UserRole.TEACHER, 
        models.UserRole.STUDENT
    ]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role"
        )
    
    # Create new user
    hashed_password = auth.hash_password(user_data.password)
    db_user = models.User(
        email=user_data.email,
        password_hash=hashed_password,
        full_name=user_data.full_name,
        role=user_data.role
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Create access token
    access_token = auth.create_access_token(
        data={"sub": str(db_user.id), "role": db_user.role}
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user_role": db_user.role
    }

@router.post("/login", response_model=schemas.Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(database.get_db)
):
    """Login with email and password"""
    # Find user by email (username field in OAuth2 form)
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    
    if not user or not auth.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    # Create access token
    access_token = auth.create_access_token(
        data={"sub": str(user.id), "role": user.role}
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user_role": user.role,
        "force_password_reset": user.force_password_reset
    }

@router.get("/me", response_model=schemas.User)
def get_current_user_info(current_user: models.User = Depends(auth.get_current_active_user)):
    """Get current user information"""
    return current_user

    return {"message": "Successfully logged out"}

@router.post("/change-password")
def change_password(
    password_data: schemas.PasswordChange,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(database.get_db)
):
    """Change current user's password"""
    current_user.password_hash = auth.hash_password(password_data.new_password)
    current_user.force_password_reset = False
    current_user.updated_at = database.datetime.utcnow()
    
    db.commit()
    return {"message": "Password changed successfully"}
