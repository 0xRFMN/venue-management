import os
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from pydantic import BaseModel
from database import engine, get_db, Base
from models import Venue, Event
from user_models import User
from auth import get_api_key
from auth_endpoints import router as auth_router
from url_parser import extract_event_id_from_url, detect_base_url_pattern, parse_bulk_input

Base.metadata.create_all(bind=engine)

app = FastAPI()

# Configure CORS
# Get allowed origins from environment or use defaults
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173,http://localhost:5175").split(",")

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

# Include authentication routes
app.include_router(auth_router, prefix="/auth", tags=["authentication"])

# Pydantic models for request/response
class VenueBase(BaseModel):
    name: str
    description: str

class VenueCreate(VenueBase):
    pass

class VenueResponse(VenueBase):
    id: int
    base_url: Optional[str] = None

    class Config:
        orm_mode = True

class EventBase(BaseModel):
    name: str
    url: str
    date: Optional[str] = None
    time: Optional[str] = None

class EventCreate(EventBase):
    venue_id: int

class EventUpdate(EventBase):
    pass

class EventResponse(EventBase):
    id: int
    venue_id: int
    event_id: Optional[str] = None

    class Config:
        orm_mode = True

class BulkEventCreate(BaseModel):
    venue_id: int
    bulk_input: str  # Either URLs or event IDs, one per line

class BulkVenueCreate(BaseModel):
    bulk_input: str  # Venue data, format: "Name | Description" per line

# Helper functions
def update_venue_base_url(venue_id: int, db: Session):
    """Update venue base URL based on existing events"""
    events = db.query(Event).filter(Event.venue_id == venue_id).all()
    if len(events) >= 2:
        urls = [event.url for event in events]
        base_url = detect_base_url_pattern(urls)
        if base_url:
            venue = db.query(Venue).filter(Venue.id == venue_id).first()
            venue.base_url = base_url
            db.commit()

# API endpoints
@app.post("/venues/", response_model=VenueResponse, dependencies=[Depends(get_api_key)])
def create_venue(venue: VenueCreate, db: Session = Depends(get_db)):
    db_venue = Venue(name=venue.name, description=venue.description)
    db.add(db_venue)
    
    try:
        db.commit()
        db.refresh(db_venue)
        return db_venue
    except IntegrityError as e:
        db.rollback()
        # Check if it's a venue name unique constraint violation
        if "name" in str(e.orig).lower():
            raise HTTPException(status_code=400, detail="Venue with this name already exists")
        else:
            raise HTTPException(status_code=400, detail="Venue already exists")

@app.post("/venues/bulk", response_model=List[VenueResponse], dependencies=[Depends(get_api_key)])
def create_bulk_venues(bulk_data: BulkVenueCreate, db: Session = Depends(get_db)):
    lines = [line.strip() for line in bulk_data.bulk_input.split('\n') if line.strip()]
    created_venues = []
    
    for line in lines:
        if '|' in line:
            parts = [part.strip() for part in line.split('|')]
            name = parts[0]
            description = parts[1] if len(parts) > 1 else ""
        else:
            name = line
            description = ""
        
        # Check if venue already exists
        existing_venue = db.query(Venue).filter(Venue.name == name).first()
        if existing_venue:
            continue  # Skip duplicates
            
        db_venue = Venue(name=name, description=description)
        db.add(db_venue)
        created_venues.append(db_venue)
    
    try:
        db.commit()
        for venue in created_venues:
            db.refresh(venue)
        return created_venues
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Failed to create some venues")

@app.get("/venues/", response_model=List[VenueResponse], dependencies=[Depends(get_api_key)])
def get_venues(db: Session = Depends(get_db)):
    return db.query(Venue).all()

@app.get("/venues/{venue_id}", response_model=VenueResponse, dependencies=[Depends(get_api_key)])
def get_venue(venue_id: int, db: Session = Depends(get_db)):
    venue = db.query(Venue).filter(Venue.id == venue_id).first()
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    return venue

@app.put("/venues/{venue_id}", response_model=VenueResponse, dependencies=[Depends(get_api_key)])
def update_venue(venue_id: int, venue: VenueCreate, db: Session = Depends(get_db)):
    db_venue = db.query(Venue).filter(Venue.id == venue_id).first()
    if not db_venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    
    db_venue.name = venue.name
    db_venue.description = venue.description
    
    try:
        db.commit()
        db.refresh(db_venue)
        return db_venue
    except IntegrityError as e:
        db.rollback()
        if "name" in str(e.orig).lower():
            raise HTTPException(status_code=400, detail="Venue with this name already exists")
        else:
            raise HTTPException(status_code=400, detail="Update failed")

@app.delete("/venues/{venue_id}", dependencies=[Depends(get_api_key)])
def delete_venue(venue_id: int, db: Session = Depends(get_db)):
    venue = db.query(Venue).filter(Venue.id == venue_id).first()
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    
    db.delete(venue)
    db.commit()
    return {"message": "Venue deleted successfully"}

@app.post("/events/", response_model=EventResponse, dependencies=[Depends(get_api_key)])
def create_event(event: EventCreate, db: Session = Depends(get_db)):
    # Check if venue exists
    venue = db.query(Venue).filter(Venue.id == event.venue_id).first()
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    
    # Extract event ID from URL
    event_id = extract_event_id_from_url(event.url)
    
    db_event = Event(
        name=event.name, 
        url=event.url, 
        event_id=event_id,
        date=event.date, 
        time=event.time, 
        venue_id=event.venue_id
    )
    db.add(db_event)
    
    try:
        db.commit()
        db.refresh(db_event)
        
        # Update venue base URL if we have enough events to detect pattern
        update_venue_base_url(venue.id, db)
        
        return db_event
    except IntegrityError as e:
        db.rollback()
        # Check if it's a URL unique constraint violation
        if "url" in str(e.orig).lower():
            raise HTTPException(status_code=400, detail="Event with this URL already exists")
        else:
            raise HTTPException(status_code=400, detail="Event already exists")

@app.post("/events/bulk", response_model=List[EventResponse], dependencies=[Depends(get_api_key)])
def create_bulk_events(bulk_data: BulkEventCreate, db: Session = Depends(get_db)):
    # Check if venue exists
    venue = db.query(Venue).filter(Venue.id == bulk_data.venue_id).first()
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    
    # Parse bulk input
    parsed_events = parse_bulk_input(bulk_data.bulk_input, venue.base_url)
    
    created_events = []
    for url, event_id in parsed_events:
        # Check if event with this URL already exists
        existing_event = db.query(Event).filter(Event.url == url).first()
        if existing_event:
            continue  # Skip duplicates
            
        # Generate a name from the event ID or URL
        event_name = event_id if event_id else f"Event {len(created_events) + 1}"
        
        db_event = Event(
            name=event_name,
            url=url,
            event_id=event_id,
            venue_id=bulk_data.venue_id
        )
        db.add(db_event)
        created_events.append(db_event)
    
    try:
        db.commit()
        for event in created_events:
            db.refresh(event)
            
        # Update venue base URL
        update_venue_base_url(venue.id, db)
        
        return created_events
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Failed to create some events")

@app.get("/events/", response_model=List[EventResponse], dependencies=[Depends(get_api_key)])
def get_all_events(db: Session = Depends(get_db)):
    return db.query(Event).all()

@app.get("/events/{event_id}", response_model=EventResponse, dependencies=[Depends(get_api_key)])
def get_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event

@app.put("/events/{event_id}", response_model=EventResponse, dependencies=[Depends(get_api_key)])
def update_event(event_id: int, event: EventUpdate, db: Session = Depends(get_db)):
    db_event = db.query(Event).filter(Event.id == event_id).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    db_event.name = event.name
    db_event.url = event.url
    db_event.date = event.date
    db_event.time = event.time
    
    try:
        db.commit()
        db.refresh(db_event)
        return db_event
    except IntegrityError as e:
        db.rollback()
        if "url" in str(e.orig).lower():
            raise HTTPException(status_code=400, detail="Event with this URL already exists")
        else:
            raise HTTPException(status_code=400, detail="Update failed")

@app.delete("/events/{event_id}", dependencies=[Depends(get_api_key)])
def delete_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    db.delete(event)
    db.commit()
    return {"message": "Event deleted successfully"}

@app.get("/venues/{venue_id}/events/", response_model=List[EventResponse], dependencies=[Depends(get_api_key)])
def get_venue_events(venue_id: int, db: Session = Depends(get_db)):
    # Check if venue exists
    venue = db.query(Venue).filter(Venue.id == venue_id).first()
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    
    return db.query(Event).filter(Event.venue_id == venue_id).all()

@app.get("/venues/by-name/{venue_name}/events/", response_model=List[EventResponse], dependencies=[Depends(get_api_key)])
def get_venue_events_by_name(venue_name: str, db: Session = Depends(get_db)):
    # Find venue by name
    venue = db.query(Venue).filter(Venue.name == venue_name).first()
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    
    return db.query(Event).filter(Event.venue_id == venue.id).all()

class SearchResult(BaseModel):
    venues: List[VenueResponse]
    events: List[EventResponse]

@app.get("/search", response_model=SearchResult, dependencies=[Depends(get_api_key)])
def search(q: str, db: Session = Depends(get_db)):
    """Search venues by name and events by event_id or name"""
    
    # Search venues by name (case insensitive partial match)
    venues = db.query(Venue).filter(Venue.name.ilike(f"%{q}%")).all()
    
    # Search events by event_id or name (case insensitive partial match)
    events = db.query(Event).filter(
        (Event.event_id.ilike(f"%{q}%")) | 
        (Event.name.ilike(f"%{q}%"))
    ).all()
    
    return SearchResult(venues=venues, events=events)