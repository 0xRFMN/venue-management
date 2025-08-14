import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { venueApi, searchApi } from '../api/api';

function Dashboard() {
  const navigate = useNavigate();
  const [venues, setVenues] = useState([]);
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  // Venue forms
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [newVenue, setNewVenue] = useState({ name: '', description: '' });
  const [bulkVenueInput, setBulkVenueInput] = useState('');

  useEffect(() => {
    loadVenues();
  }, []);

  const loadVenues = async () => {
    try {
      setLoading(true);
      const response = await venueApi.getAll();
      setVenues(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load venues');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    
    try {
      setIsSearching(true);
      const response = await searchApi.search(searchQuery);
      setSearchResults(response.data);
    } catch (err) {
      setError('Search failed');
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
  };

  const handleAddVenue = async (e) => {
    e.preventDefault();
    try {
      await venueApi.create(newVenue);
      setNewVenue({ name: '', description: '' });
      setShowAddForm(false);
      loadVenues();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create venue');
    }
  };

  const handleBulkVenues = async (e) => {
    e.preventDefault();
    try {
      await venueApi.createBulk({ bulk_input: bulkVenueInput });
      setBulkVenueInput('');
      setShowBulkForm(false);
      loadVenues();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create bulk venues');
    }
  };

  if (loading) return <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>Loading dashboard...</div>;

  return (
    <div style={{maxWidth: '1400px', margin: '0 auto', padding: '24px'}}>
      {/* Header with Search */}
      <div style={{marginBottom: '32px'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
          <h1 style={{fontSize: '2.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0}}>
            Venue & Events Dashboard
          </h1>
          <button
            onClick={() => navigate('/api-docs')}
            style={{
              backgroundColor: '#6b7280',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            API Documentation
          </button>
        </div>
        
        <form onSubmit={handleSearch} style={{display: 'flex', gap: '8px', marginBottom: '16px'}}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search venues or event IDs..."
            style={{
              flex: 1,
              padding: '12px 16px',
              border: '2px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '16px'
            }}
          />
          <button
            type="submit"
            disabled={isSearching}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              cursor: isSearching ? 'not-allowed' : 'pointer',
              fontSize: '16px'
            }}
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
          {searchResults && (
            <button
              type="button"
              onClick={clearSearch}
              style={{
                backgroundColor: '#6b7280',
                color: 'white',
                padding: '12px 16px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Clear
            </button>
          )}
        </form>
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

      {/* Search Results */}
      {searchResults && (
        <div style={{marginBottom: '32px'}}>
          <h2 style={{fontSize: '1.5rem', fontWeight: '600', marginBottom: '16px'}}>
            Search Results for "{searchQuery}"
          </h2>
          
          {searchResults.venues.length > 0 && (
            <div style={{marginBottom: '24px'}}>
              <h3 style={{fontSize: '1.25rem', fontWeight: '600', marginBottom: '12px', color: '#059669'}}>
                Venues ({searchResults.venues.length})
              </h3>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px'}}>
                {searchResults.venues.map((venue) => (
                  <div
                    key={venue.id}
                    onClick={() => navigate(`/venues/${venue.id}/events`)}
                    style={{
                      backgroundColor: 'white',
                      padding: '16px',
                      borderRadius: '8px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      cursor: 'pointer',
                      border: '2px solid #10b981'
                    }}
                  >
                    <h4 style={{margin: 0, marginBottom: '8px', fontSize: '1.1rem', fontWeight: '600'}}>{venue.name}</h4>
                    <p style={{margin: 0, color: '#6b7280', fontSize: '14px'}}>{venue.description}</p>
                    {venue.base_url && (
                      <p style={{margin: '8px 0 0 0', fontSize: '12px', color: '#059669'}}>
                        <strong>Base URL:</strong> {venue.base_url}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {searchResults.events.length > 0 && (
            <div>
              <h3 style={{fontSize: '1.25rem', fontWeight: '600', marginBottom: '12px', color: '#dc2626'}}>
                Events ({searchResults.events.length})
              </h3>
              <div style={{display: 'grid', gridTemplateColumns: '1fr', gap: '12px'}}>
                {searchResults.events.map((event) => (
                  <div
                    key={event.id}
                    style={{
                      backgroundColor: 'white',
                      padding: '16px',
                      borderRadius: '8px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      border: '2px solid #dc2626'
                    }}
                  >
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start'}}>
                      <div style={{flex: 1}}>
                        <h4 style={{margin: 0, marginBottom: '8px', fontSize: '1.1rem', fontWeight: '600'}}>{event.name}</h4>
                        <a
                          href={event.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{color: '#3b82f6', textDecoration: 'none', fontSize: '14px'}}
                        >
                          {event.url}
                        </a>
                        {event.event_id && (
                          <p style={{margin: '4px 0 0 0', fontSize: '12px', color: '#6b7280'}}>
                            <strong>ID:</strong> {event.event_id}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          const venue = venues.find(v => v.id === event.venue_id);
                          if (venue) navigate(`/venues/${venue.id}/events`);
                        }}
                        style={{
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        View Venue
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {searchResults.venues.length === 0 && searchResults.events.length === 0 && (
            <p style={{color: '#6b7280', textAlign: 'center', fontSize: '16px', padding: '32px'}}>
              No results found for "{searchQuery}"
            </p>
          )}
        </div>
      )}

      {/* Venue Management Section */}
      {!searchResults && (
        <>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
            <h2 style={{fontSize: '1.75rem', fontWeight: '600', color: '#1f2937'}}>Venues</h2>
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
                {showAddForm ? 'Cancel' : 'Add Venue'}
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
                {showBulkForm ? 'Cancel' : 'Bulk Add Venues'}
              </button>
            </div>
          </div>

          {/* Add Venue Form */}
          {showAddForm && (
            <form onSubmit={handleAddVenue} style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              marginBottom: '24px'
            }}>
              <div style={{display: 'grid', gridTemplateColumns: '2fr 3fr', gap: '16px', marginBottom: '16px'}}>
                <input
                  type="text"
                  value={newVenue.name}
                  onChange={(e) => setNewVenue({ ...newVenue, name: e.target.value })}
                  placeholder="Venue Name"
                  style={{
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px'
                  }}
                  required
                />
                <input
                  type="text"
                  value={newVenue.description}
                  onChange={(e) => setNewVenue({ ...newVenue, description: e.target.value })}
                  placeholder="Description"
                  style={{
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px'
                  }}
                  required
                />
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
                Create Venue
              </button>
            </form>
          )}

          {/* Bulk Add Venues Form */}
          {showBulkForm && (
            <form onSubmit={handleBulkVenues} style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              marginBottom: '24px'
            }}>
              <h3 style={{marginBottom: '16px', fontSize: '18px', fontWeight: '600'}}>Bulk Add Venues</h3>
              <p style={{marginBottom: '12px', color: '#6b7280', fontSize: '14px'}}>
                Enter venues (one per line):<br />
                • Format: "Name | Description"<br />
                • Or just: "Name"
              </p>
              <textarea
                value={bulkVenueInput}
                onChange={(e) => setBulkVenueInput(e.target.value)}
                placeholder={`Madison Square Garden | Famous venue in NYC
Barclays Center | Brooklyn sports arena
MetLife Stadium`}
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
                  Create Venues
                </button>
              </div>
            </form>
          )}

          {/* Venues Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '24px'
          }}>
            {venues.map((venue) => (
              <div
                key={venue.id}
                onClick={() => navigate(`/venues/${venue.id}/events`)}
                style={{
                  backgroundColor: 'white',
                  padding: '24px',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}
                onMouseLeave={(e) => e.target.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}
              >
                <h3 style={{fontSize: '1.25rem', fontWeight: '600', marginBottom: '8px'}}>{venue.name}</h3>
                <p style={{color: '#6b7280', marginBottom: '8px'}}>{venue.description}</p>
                {venue.base_url && (
                  <p style={{color: '#059669', fontSize: '12px', marginBottom: '16px'}}>
                    <strong>Base URL:</strong> {venue.base_url}
                  </p>
                )}
                <div style={{color: '#3b82f6', fontSize: '14px', fontWeight: '500'}}>
                  View Events →
                </div>
              </div>
            ))}
          </div>

          {venues.length === 0 && !showAddForm && !showBulkForm && (
            <div style={{textAlign: 'center', color: '#6b7280', marginTop: '48px'}}>
              <p style={{fontSize: '18px', marginBottom: '8px'}}>No venues yet</p>
              <p>Click "Add Venue" or "Bulk Add Venues" to get started</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Dashboard;