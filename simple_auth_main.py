import os
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from pydantic import BaseModel
from database import engine, get_db, Base
from models import Venue, Event
from auth import get_api_key
from url_parser import extract_event_id_from_url, detect_base_url_pattern, parse_bulk_input
import secrets
from datetime import datetime, timedelta

# Create tables (but not user table)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Venue Management API", version="2.0.0")

# Configure CORS
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173,http://localhost:5175,https://enchanting-nasturtium-56f2a7.netlify.app").split(",")

# Add common Netlify patterns for production
if os.getenv("ENVIRONMENT") == "production":
    ALLOWED_ORIGINS.extend([
        "https://*.netlify.app",
        "https://netlify.app"
    ])

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# HARDCODED AUTHENTICATION
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

# Session storage
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

class LoginResponse(BaseModel):
    user: UserResponse
    session_token: str
    message: str

def create_session_token() -> str:
    return secrets.token_urlsafe(32)

@app.post("/auth/login", response_model=LoginResponse)
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
        "expires_at": datetime.utcnow() + timedelta(days=7)
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

@app.post("/auth/logout")
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

@app.get("/auth/verify-session")
def verify_session(session_token: str):
    """Verify if session is valid and return user info"""
    session_data = active_sessions.get(session_token)
    
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

# Rest of the venue/event endpoints stay the same...
class VenueBase(BaseModel):
    name: str
    description: str
    base_url: Optional[str] = None

class VenueCreate(VenueBase):
    pass

class VenueUpdate(VenueBase):
    pass

class VenueResponse(VenueBase):
    id: int
    
    class Config:
        from_attributes = True

class EventBase(BaseModel):
    name: str
    url: str
    venue_id: int
    event_id: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None

class EventCreate(EventBase):
    pass

class EventUpdate(EventBase):
    pass

class EventResponse(EventBase):
    id: int
    
    class Config:
        from_attributes = True

class BulkVenueCreate(BaseModel):
    bulk_input: str

class BulkEventCreate(BaseModel):
    venue_id: int
    bulk_input: str

class SearchResult(BaseModel):
    venues: List[VenueResponse]
    events: List[EventResponse]

@app.get("/")
def read_root():
    return {"message": "Venue Management API", "version": "2.0.0"}

@app.get("/venues/", response_model=List[VenueResponse])
def read_venues(db: Session = Depends(get_db), api_key: str = Depends(get_api_key)):
    venues = db.query(Venue).all()
    return venues

@app.post("/venues/", response_model=VenueResponse)
def create_venue(venue: VenueCreate, db: Session = Depends(get_db), api_key: str = Depends(get_api_key)):
    db_venue = Venue(**venue.dict())
    db.add(db_venue)
    db.commit()
    db.refresh(db_venue)
    return db_venue

@app.post("/venues/bulk", response_model=List[VenueResponse])
def create_venues_bulk(bulk_data: BulkVenueCreate, db: Session = Depends(get_db), api_key: str = Depends(get_api_key)):
    try:
        parsed_data = parse_bulk_input(bulk_data.bulk_input)
        created_venues = []
        
        for item in parsed_data:
            if item['type'] == 'url':
                base_url = detect_base_url_pattern([item['content']])
                venue = Venue(name=f"Venue from {base_url}", description=f"Auto-created from {item['content']}", base_url=base_url)
            else:
                venue = Venue(name=item['content'], description=f"Venue: {item['content']}")
                
            db.add(venue)
            db.commit()
            db.refresh(venue)
            created_venues.append(venue)
            
        return created_venues
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/venues/{venue_id}", response_model=VenueResponse)
def update_venue(venue_id: int, venue: VenueUpdate, db: Session = Depends(get_db), api_key: str = Depends(get_api_key)):
    db_venue = db.query(Venue).filter(Venue.id == venue_id).first()
    if not db_venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    
    for key, value in venue.dict(exclude_unset=True).items():
        setattr(db_venue, key, value)
    
    db.commit()
    db.refresh(db_venue)
    return db_venue

@app.delete("/venues/{venue_id}")
def delete_venue(venue_id: int, db: Session = Depends(get_db), api_key: str = Depends(get_api_key)):
    db_venue = db.query(Venue).filter(Venue.id == venue_id).first()
    if not db_venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    
    db.delete(db_venue)
    db.commit()
    return {"message": "Venue deleted"}

@app.get("/venues/{venue_id}/events/", response_model=List[EventResponse])
def read_venue_events(venue_id: int, db: Session = Depends(get_db), api_key: str = Depends(get_api_key)):
    events = db.query(Event).filter(Event.venue_id == venue_id).all()
    return events

@app.get("/events/", response_model=List[EventResponse])
def read_events(db: Session = Depends(get_db), api_key: str = Depends(get_api_key)):
    events = db.query(Event).all()
    return events

@app.post("/events/", response_model=EventResponse)
def create_event(event: EventCreate, db: Session = Depends(get_db), api_key: str = Depends(get_api_key)):
    event_data = event.dict()
    
    if not event_data.get('event_id'):
        event_data['event_id'] = extract_event_id_from_url(event_data['url'])
    
    db_event = Event(**event_data)
    
    try:
        db.add(db_event)
        db.commit()
        db.refresh(db_event)
        return db_event
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Event with this URL already exists for this venue")

@app.post("/events/bulk", response_model=List[EventResponse])
def create_events_bulk(bulk_data: BulkEventCreate, db: Session = Depends(get_db), api_key: str = Depends(get_api_key)):
    try:
        parsed_data = parse_bulk_input(bulk_data.bulk_input)
        created_events = []
        
        for item in parsed_data:
            if item['type'] == 'url':
                event_id = extract_event_id_from_url(item['content'])
                event = Event(
                    name=f"Event {event_id or 'Unknown'}",
                    url=item['content'],
                    venue_id=bulk_data.venue_id,
                    event_id=event_id
                )
            else:
                event = Event(
                    name=item['content'],
                    url=f"https://example.com/events/{item['content']}",
                    venue_id=bulk_data.venue_id,
                    event_id=item['content']
                )
            
            try:
                db.add(event)
                db.commit()
                db.refresh(event)
                created_events.append(event)
            except IntegrityError:
                db.rollback()
                continue
                
        return created_events
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/events/{event_id}", response_model=EventResponse)
def update_event(event_id: int, event: EventUpdate, db: Session = Depends(get_db), api_key: str = Depends(get_api_key)):
    db_event = db.query(Event).filter(Event.id == event_id).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    for key, value in event.dict(exclude_unset=True).items():
        setattr(db_event, key, value)
    
    db.commit()
    db.refresh(db_event)
    return db_event

@app.delete("/events/{event_id}")
def delete_event(event_id: int, db: Session = Depends(get_db), api_key: str = Depends(get_api_key)):
    db_event = db.query(Event).filter(Event.id == event_id).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    db.delete(db_event)
    db.commit()
    return {"message": "Event deleted"}

@app.get("/search", response_model=SearchResult)
def search_venues_and_events(q: str, db: Session = Depends(get_db), api_key: str = Depends(get_api_key)):
    venues = db.query(Venue).filter(Venue.name.ilike(f"%{q}%")).all()
    
    events = db.query(Event).filter(
        (Event.name.ilike(f"%{q}%")) | (Event.event_id.ilike(f"%{q}%"))
    ).all()
    
    return SearchResult(venues=venues, events=events)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)