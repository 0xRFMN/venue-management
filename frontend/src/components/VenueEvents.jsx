import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventApi, venueApi } from '../api/api';

function VenueEvents() {
  const { venueId } = useParams();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEvent, setNewEvent] = useState({ name: '', url: '', date: '', time: '' });
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [bulkInput, setBulkInput] = useState('');
  const [selectedEvents, setSelectedEvents] = useState(new Set());

  useEffect(() => {
    if (venueId) {
      loadVenueAndEvents();
    }
  }, [venueId]);

  const loadVenueAndEvents = async () => {
    try {
      setLoading(true);
      
      // Load venue info
      const venuesResponse = await venueApi.getAll();
      const currentVenue = venuesResponse.data.find(v => v.id === parseInt(venueId));
      setVenue(currentVenue || null);
      
      // Load events
      const eventsResponse = await eventApi.getByVenue(parseInt(venueId));
      setEvents(eventsResponse.data);
    } catch (err) {
      setError('Failed to load events');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    try {
      await eventApi.create({
        ...newEvent,
        venue_id: parseInt(venueId),
      });
      setNewEvent({ name: '', url: '', date: '', time: '' });
      setShowAddForm(false);
      loadVenueAndEvents();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create event');
    }
  };

  const handleBulkEvents = async (e) => {
    e.preventDefault();
    try {
      await eventApi.createBulk({
        venue_id: parseInt(venueId),
        bulk_input: bulkInput
      });
      setBulkInput('');
      setShowBulkForm(false);
      loadVenueAndEvents();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create bulk events');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    
    try {
      await eventApi.delete(eventId);
      loadVenueAndEvents();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete event');
    }
  };

  const handleSelectAll = () => {
    if (selectedEvents.size === events.length) {
      setSelectedEvents(new Set());
    } else {
      setSelectedEvents(new Set(events.map(e => e.id)));
    }
  };

  const handleSelectEvent = (eventId) => {
    const newSelected = new Set(selectedEvents);
    if (newSelected.has(eventId)) {
      newSelected.delete(eventId);
    } else {
      newSelected.add(eventId);
    }
    setSelectedEvents(newSelected);
  };

  const handleDeleteSelected = async () => {
    if (selectedEvents.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedEvents.size} selected events?`)) return;

    try {
      const deletePromises = Array.from(selectedEvents).map(eventId => eventApi.delete(eventId));
      await Promise.all(deletePromises);
      setSelectedEvents(new Set());
      loadVenueAndEvents();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete selected events');
    }
  };

  if (loading) return <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>Loading events...</div>;

  return (
    <div style={{maxWidth: '1200px', margin: '0 auto', padding: '24px'}}>
      <div style={{marginBottom: '32px'}}>
        <button
          onClick={() => navigate('/')}
          style={{color: '#3b82f6', textDecoration: 'none', marginBottom: '16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '16px'}}
        >
          ← Back to Venues
        </button>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div>
            <h1 style={{fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', margin: 0}}>{venue?.name}</h1>
            <p style={{color: '#6b7280', marginTop: '8px', margin: '8px 0 0 0'}}>{venue?.description}</p>
            {venue?.base_url && (
              <p style={{color: '#059669', fontSize: '14px', marginTop: '4px'}}>
                <strong>Base URL:</strong> {venue.base_url}
              </p>
            )}
          </div>
          <div style={{display: 'flex', gap: '8px'}}>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              {showAddForm ? 'Cancel' : 'Add Event'}
            </button>
            <button
              onClick={() => setShowBulkForm(!showBulkForm)}
              style={{
                backgroundColor: '#10b981',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              {showBulkForm ? 'Cancel' : 'Bulk Add'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fca5a5',
          color: '#dc2626',
          padding: '12px 16px',
          borderRadius: '6px',
          marginBottom: '16px'
        }}>
          {error}
        </div>
      )}

      {showAddForm && (
        <form onSubmit={handleAddEvent} style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          marginBottom: '24px'
        }}>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
            <div style={{marginBottom: '16px'}}>
              <label style={{display: 'block', color: '#374151', fontSize: '14px', fontWeight: '600', marginBottom: '8px'}}>
                Event Name
              </label>
              <input
                type="text"
                value={newEvent.name}
                onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
                required
              />
            </div>
            <div style={{marginBottom: '16px'}}>
              <label style={{display: 'block', color: '#374151', fontSize: '14px', fontWeight: '600', marginBottom: '8px'}}>
                Event URL
              </label>
              <input
                type="url"
                value={newEvent.url}
                onChange={(e) => setNewEvent({ ...newEvent, url: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
                placeholder="https://..."
                required
              />
            </div>
            <div style={{marginBottom: '16px'}}>
              <label style={{display: 'block', color: '#374151', fontSize: '14px', fontWeight: '600', marginBottom: '8px'}}>
                Date
              </label>
              <input
                type="date"
                value={newEvent.date}
                onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div style={{marginBottom: '16px'}}>
              <label style={{display: 'block', color: '#374151', fontSize: '14px', fontWeight: '600', marginBottom: '8px'}}>
                Time
              </label>
              <input
                type="time"
                value={newEvent.time}
                onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>
          <button
            type="submit"
            style={{
              backgroundColor: '#10b981',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Create Event
          </button>
        </form>
      )}

      {showBulkForm && (
        <form onSubmit={handleBulkEvents} style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          marginBottom: '24px'
        }}>
          <h3 style={{marginBottom: '16px', fontSize: '18px', fontWeight: '600'}}>Bulk Add Events</h3>
          <p style={{marginBottom: '12px', color: '#6b7280', fontSize: '14px'}}>
            Enter URLs or Event IDs (one per line):
            {venue?.base_url && <><br />• Full URLs: https://example.com/events/123<br />• Event IDs only: 123 (will use base URL)</>}
          </p>
          <textarea
            value={bulkInput}
            onChange={(e) => setBulkInput(e.target.value)}
            placeholder={venue?.base_url ? 
              `https://example.com/events/123\nhttps://example.com/events/456\nor just:\n123\n456` :
              `https://example.com/events/123\nhttps://example.com/events/456`
            }
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              minHeight: '120px',
              fontFamily: 'monospace',
              fontSize: '14px'
            }}
            required
          />
          <div style={{marginTop: '16px'}}>
            <button
              type="submit"
              style={{
                backgroundColor: '#10b981',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Create Events
            </button>
          </div>
        </form>
      )}

      {/* Event Selection Controls */}
      {events.length > 0 && (
        <div style={{
          backgroundColor: 'white',
          padding: '16px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
            <label style={{display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'}}>
              <input
                type="checkbox"
                checked={selectedEvents.size === events.length && events.length > 0}
                onChange={handleSelectAll}
                style={{width: '16px', height: '16px'}}
              />
              <span style={{fontWeight: '500', color: '#374151'}}>
                Select All ({selectedEvents.size}/{events.length})
              </span>
            </label>
          </div>
          {selectedEvents.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              style={{
                backgroundColor: '#ef4444',
                color: 'white',
                padding: '6px 12px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Delete Selected ({selectedEvents.size})
            </button>
          )}
        </div>
      )}

      <div style={{display: 'grid', gridTemplateColumns: '1fr', gap: '16px'}}>
        {events.map((event) => (
          <div key={event.id} style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: selectedEvents.has(event.id) ? '2px solid #3b82f6' : '1px solid #e5e7eb'
          }}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start'}}>
              <div style={{display: 'flex', alignItems: 'start', gap: '12px', flex: 1}}>
                <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer', marginTop: '2px'}}>
                  <input
                    type="checkbox"
                    checked={selectedEvents.has(event.id)}
                    onChange={() => handleSelectEvent(event.id)}
                    style={{width: '16px', height: '16px'}}
                  />
                </label>
                <div style={{flex: 1}}>
                <h3 style={{fontSize: '1.25rem', fontWeight: '600', marginBottom: '8px'}}>{event.name}</h3>
                <a
                  href={event.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{color: '#3b82f6', textDecoration: 'none', wordBreak: 'break-all'}}
                >
                  {event.url}
                </a>
                {event.event_id && (
                  <div style={{marginTop: '4px', color: '#6b7280', fontSize: '14px'}}>
                    <strong>ID:</strong> {event.event_id}
                  </div>
                )}
                {(event.date || event.time) && (
                  <div style={{marginTop: '8px', color: '#6b7280'}}>
                    {event.date && <span style={{marginRight: '16px'}}>📅 {event.date}</span>}
                    {event.time && <span>🕐 {event.time}</span>}
                  </div>
                )}
                </div>
              </div>
              <button
                onClick={() => handleDeleteEvent(event.id)}
                style={{
                  backgroundColor: '#ef4444',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
                title="Delete event"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {events.length === 0 && !showAddForm && (
        <div style={{textAlign: 'center', color: '#6b7280', marginTop: '32px'}}>
          No events yet for this venue. Click "Add Event" to create one.
        </div>
      )}
    </div>
  );
}

export default VenueEvents;