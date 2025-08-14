from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List
from pydantic import BaseModel
from database import engine, get_db, Base
from models import Venue, Event
from auth import get_api_key

Base.metadata.create_all(bind=engine)

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite's default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for request/response
class VenueBase(BaseModel):
    name: str
    description: str

class VenueCreate(VenueBase):
    pass

class VenueResponse(VenueBase):
    id: int

    class Config:
        orm_mode = True

class EventBase(BaseModel):
    name: str
    url: str

class EventCreate(EventBase):
    venue_id: int

class EventResponse(EventBase):
    id: int
    venue_id: int

    class Config:
        orm_mode = True

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

@app.get("/venues/", response_model=List[VenueResponse], dependencies=[Depends(get_api_key)])
def get_venues(db: Session = Depends(get_db)):
    return db.query(Venue).all()

@app.post("/events/", response_model=EventResponse, dependencies=[Depends(get_api_key)])
def create_event(event: EventCreate, db: Session = Depends(get_db)):
    # Check if venue exists
    venue = db.query(Venue).filter(Venue.id == event.venue_id).first()
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    
    db_event = Event(name=event.name, url=event.url, venue_id=event.venue_id)
    db.add(db_event)
    
    try:
        db.commit()
        db.refresh(db_event)
        return db_event
    except IntegrityError as e:
        db.rollback()
        # Check if it's a URL unique constraint violation
        if "url" in str(e.orig).lower():
            raise HTTPException(status_code=400, detail="Event with this URL already exists")
        # Check if it's a venue name unique constraint violation (shouldn't happen here but just in case)
        else:
            raise HTTPException(status_code=400, detail="Event already exists")

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