from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
import secrets
from datetime import datetime, timedelta

router = APIRouter()

# Hardcoded users (no database needed)
HARDCODED_USERS = {
    "RulesGay": {
        "username": "RulesGay",
        "password": "GayRules",
        "email": "rulesgay@example.com",
        "id": 1,
        "is_active": True,
        "created_at": datetime.utcnow()
    },
    "Raffi": {
        "username": "Raffi",
        "password": "CooRaffi",
        "email": "raffi@example.com",
        "id": 2,
        "is_active": True,
        "created_at": datetime.utcnow()
    }
}

# Session storage (in production, use Redis or database)
active_sessions = {}

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

# Registration disabled - only hardcoded users allowed

@router.post("/login", response_model=LoginResponse)
def login_user(user_data: UserLogin):
    """Login user with hardcoded credentials"""
    
    # Check hardcoded users
    user = HARDCODED_USERS.get(user_data.username)
    if not user or user["password"] != user_data.password:
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )
    
    # Check if user is active
    if not user["is_active"]:
        raise HTTPException(
            status_code=401,
            detail="Account is disabled"
        )
    
    # Create session
    session_token = create_session_token()
    active_sessions[session_token] = {
        "user_id": user["id"],
        "username": user["username"],
        "created_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(days=7)  # 7 day session
    }
    
    # Create user response object
    user_response = UserResponse(
        id=user["id"],
        username=user["username"],
        email=user["email"],
        is_active=user["is_active"],
        created_at=user["created_at"]
    )
    
    return LoginResponse(
        user=user_response,
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
def verify_session(session_token: str):
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
    
    # Get hardcoded user data
    username = session_data["username"]
    user = HARDCODED_USERS.get(username)
    if not user or not user["is_active"]:
        del active_sessions[session_token]
        raise HTTPException(
            status_code=401,
            detail="User account not found or disabled"
        )
    
    user_response = UserResponse(
        id=user["id"],
        username=user["username"],
        email=user["email"],
        is_active=user["is_active"],
        created_at=user["created_at"]
    )
    
    return {
        "user": user_response,
        "session_valid": True,
        "expires_at": session_data["expires_at"]
    }