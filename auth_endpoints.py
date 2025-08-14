from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from database import get_db
from user_models import User
import secrets
import hashlib
from datetime import datetime, timedelta

router = APIRouter()

# Session storage (in production, use Redis or database)
active_sessions = {}

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class LoginResponse(BaseModel):
    user: UserResponse
    session_token: str
    message: str

def create_session_token() -> str:
    """Generate a secure session token"""
    return secrets.token_urlsafe(32)

def verify_session_token(token: str) -> dict:
    """Verify and return session data"""
    return active_sessions.get(token)

@router.post("/register", response_model=UserResponse)
def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    
    # Check if username already exists
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Username already registered"
        )
    
    # Check if email already exists
    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = User.hash_password(user_data.password)
    db_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_password
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user

@router.post("/login", response_model=LoginResponse)
def login_user(user_data: UserLogin, db: Session = Depends(get_db)):
    """Login user and create session"""
    
    # Find user by username
    user = db.query(User).filter(User.username == user_data.username).first()
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )
    
    # Verify password
    if not User.verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=401,
            detail="Account is disabled"
        )
    
    # Create session
    session_token = create_session_token()
    active_sessions[session_token] = {
        "user_id": user.id,
        "username": user.username,
        "created_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(days=7)  # 7 day session
    }
    
    return LoginResponse(
        user=user,
        session_token=session_token,
        message="Login successful"
    )

@router.post("/logout")
def logout_user(session_token: str):
    """Logout user and invalidate session"""
    if session_token in active_sessions:
        del active_sessions[session_token]
        return {"message": "Logout successful"}
    else:
        raise HTTPException(
            status_code=401,
            detail="Invalid session"
        )

@router.get("/verify-session")
def verify_session(session_token: str, db: Session = Depends(get_db)):
    """Verify if session is valid and return user info"""
    session_data = verify_session_token(session_token)
    
    if not session_data:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired session"
        )
    
    # Check if session is expired
    if datetime.utcnow() > session_data["expires_at"]:
        del active_sessions[session_token]
        raise HTTPException(
            status_code=401,
            detail="Session expired"
        )
    
    # Get current user data
    user = db.query(User).filter(User.id == session_data["user_id"]).first()
    if not user or not user.is_active:
        del active_sessions[session_token]
        raise HTTPException(
            status_code=401,
            detail="User account not found or disabled"
        )
    
    return {
        "user": user,
        "session_valid": True,
        "expires_at": session_data["expires_at"]
    }