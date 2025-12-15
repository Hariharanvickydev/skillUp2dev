from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from uuid import UUID
from . import models, schemas, database

# Security configuration
SECRET_KEY = "your-secret-key-here-change-in-production"  # TODO: Move to environment variable
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# Password hashing
def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

# JWT token functions
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> dict:
    """Decode and verify a JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

# Authentication dependencies
def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(database.get_db)
) -> models.User:
    """Get the current authenticated user from the token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = decode_access_token(token)
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    from sqlalchemy.orm import joinedload
    user = db.query(models.User).options(joinedload(models.User.organization)).filter(models.User.id == UUID(user_id)).first()
    if user is None:
        raise credentials_exception
    
    return user

def get_current_active_user(current_user: models.User = Depends(get_current_user)) -> models.User:
    """Ensure the current user is active"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

def require_admin(current_user: models.User = Depends(get_current_active_user)) -> models.User:
    """
    Require the current user to be an admin or teacher (Content Editor).
    Allows SUPER_ADMIN, ORG_ADMIN, DEPT_HEAD, TEACHER.
    """
    allowed_roles = [
        models.UserRole.SUPER_ADMIN, 
        models.UserRole.ORG_ADMIN, 
        models.UserRole.DEPT_HEAD, 
        models.UserRole.TEACHER
    ]
    if current_user.role not in allowed_roles:  # Basic string check works if enum values are strings
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin/Teacher access required"
        )
    return current_user

def require_consumer(current_user: models.User = Depends(get_current_active_user)) -> models.User:
    """Require the current user to be a student (formerly consumer)"""
    if current_user.role != models.UserRole.STUDENT:
        # For now, let's strictly require STUDENT. 
        # In future, maybe teachers can also view consumer view.
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student access required"
        )
    return current_user

def require_super_admin(current_user: models.User = Depends(get_current_active_user)) -> models.User:
    """Require the current user to be a Super Admin"""
    if current_user.role != models.UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super Admin access required"
        )
    return current_user

def require_org_admin(current_user: models.User = Depends(get_current_active_user)) -> models.User:
    """Require the current user to be an Org Admin or higher"""
    allowed_roles = [models.UserRole.SUPER_ADMIN, models.UserRole.ORG_ADMIN]
    if current_user.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Org Admin access required"
        )
    return current_user
