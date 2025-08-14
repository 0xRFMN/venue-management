import { useNavigate } from 'react-router-dom';

function ApiDocumentation() {
  const navigate = useNavigate();

  const apiEndpoints = [
    {
      category: 'Venues',
      endpoints: [
        {
          method: 'GET',
          path: '/venues/',
          description: 'Get all venues',
          parameters: 'None',
          returns: 'List[VenueResponse]'
        },
        {
          method: 'POST',
          path: '/venues/',
          description: 'Create a new venue',
          parameters: '{"name": string, "description": string}',
          returns: 'VenueResponse'
        },
        {
          method: 'POST',
          path: '/venues/bulk',
          description: 'Create multiple venues at once',
          parameters: '{"bulk_input": string} - Format: "Name | Description" per line',
          returns: 'List[VenueResponse]'
        },
        {
          method: 'GET',
          path: '/venues/{venue_id}',
          description: 'Get a specific venue by ID',
          parameters: 'venue_id: int (path parameter)',
          returns: 'VenueResponse'
        },
        {
          method: 'PUT',
          path: '/venues/{venue_id}',
          description: 'Update a venue',
          parameters: 'venue_id: int (path), {"name": string, "description": string}',
          returns: 'VenueResponse'
        },
        {
          method: 'DELETE',
          path: '/venues/{venue_id}',
          description: 'Delete a venue',
          parameters: 'venue_id: int (path parameter)',
          returns: '{"message": "Venue deleted successfully"}'
        }
      ]
    },
    {
      category: 'Events',
      endpoints: [
        {
          method: 'GET',
          path: '/events/',
          description: 'Get all events across all venues',
          parameters: 'None',
          returns: 'List[EventResponse]'
        },
        {
          method: 'POST',
          path: '/events/',
          description: 'Create a new event',
          parameters: '{"name": string, "url": string, "venue_id": int, "date": string?, "time": string?}',
          returns: 'EventResponse'
        },
        {
          method: 'POST',
          path: '/events/bulk',
          description: 'Create multiple events for a venue',
          parameters: '{"venue_id": int, "bulk_input": string} - URLs or event IDs, one per line',
          returns: 'List[EventResponse]'
        },
        {
          method: 'GET',
          path: '/events/{event_id}',
          description: 'Get a specific event by ID',
          parameters: 'event_id: int (path parameter)',
          returns: 'EventResponse'
        },
        {
          method: 'PUT',
          path: '/events/{event_id}',
          description: 'Update an event',
          parameters: 'event_id: int (path), {"name": string, "url": string, "date": string?, "time": string?}',
          returns: 'EventResponse'
        },
        {
          method: 'DELETE',
          path: '/events/{event_id}',
          description: 'Delete an event',
          parameters: 'event_id: int (path parameter)',
          returns: '{"message": "Event deleted successfully"}'
        },
        {
          method: 'GET',
          path: '/venues/{venue_id}/events/',
          description: 'Get all events for a specific venue',
          parameters: 'venue_id: int (path parameter)',
          returns: 'List[EventResponse]'
        },
        {
          method: 'GET',
          path: '/venues/by-name/{venue_name}/events/',
          description: 'Get all events for a venue by name',
          parameters: 'venue_name: string (path parameter)',
          returns: 'List[EventResponse]'
        }
      ]
    },
    {
      category: 'Search',
      endpoints: [
        {
          method: 'GET',
          path: '/search',
          description: 'Search venues by name and events by event_id or name',
          parameters: 'q: string (query parameter)',
          returns: '{"venues": List[VenueResponse], "events": List[EventResponse]}'
        }
      ]
    }
  ];

  const dataModels = {
    VenueResponse: {
      id: 'integer',
      name: 'string',
      description: 'string',
      base_url: 'string | null (auto-detected from event URLs)'
    },
    EventResponse: {
      id: 'integer',
      name: 'string',
      url: 'string',
      venue_id: 'integer',
      event_id: 'string | null (extracted from URL)',
      date: 'string | null (YYYY-MM-DD format)',
      time: 'string | null (HH:MM format)'
    }
  };

  const getMethodColor = (method) => {
    const colors = {
      'GET': '#10b981',
      'POST': '#3b82f6',
      'PUT': '#f59e0b',
      'DELETE': '#ef4444'
    };
    return colors[method] || '#6b7280';
  };

  return (
    <div style={{maxWidth: '1400px', margin: '0 auto', padding: '24px'}}>
      <div style={{marginBottom: '32px'}}>
        <button
          onClick={() => navigate('/')}
          style={{color: '#3b82f6', textDecoration: 'none', marginBottom: '16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '16px'}}
        >
          ← Back to Dashboard
        </button>
        <h1 style={{fontSize: '2.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px'}}>
          API Documentation
        </h1>
        <div style={{backgroundColor: '#f3f4f6', padding: '16px', borderRadius: '8px', marginBottom: '24px'}}>
          <h3 style={{margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600'}}>Base URL</h3>
          <code style={{fontSize: '16px', color: '#374151'}}>http://localhost:8000</code>
          <p style={{margin: '8px 0 0 0', fontSize: '14px', color: '#6b7280'}}>
            All endpoints require the <code>X-API-Key</code> header with value: <code>your-secret-api-key</code>
          </p>
        </div>
      </div>

      {/* API Endpoints */}
      {apiEndpoints.map((category, categoryIndex) => (
        <div key={categoryIndex} style={{marginBottom: '48px'}}>
          <h2 style={{fontSize: '2rem', fontWeight: '600', color: '#1f2937', marginBottom: '24px', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px'}}>
            {category.category}
          </h2>
          
          <div style={{display: 'grid', gap: '16px'}}>
            {category.endpoints.map((endpoint, endpointIndex) => (
              <div key={endpointIndex} style={{
                backgroundColor: 'white',
                padding: '24px',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px'}}>
                  <span style={{
                    backgroundColor: getMethodColor(endpoint.method),
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '600',
                    minWidth: '60px',
                    textAlign: 'center'
                  }}>
                    {endpoint.method}
                  </span>
                  <code style={{fontSize: '16px', fontWeight: '600', color: '#374151'}}>
                    {endpoint.path}
                  </code>
                </div>
                
                <p style={{color: '#6b7280', marginBottom: '16px', fontSize: '16px'}}>
                  {endpoint.description}
                </p>
                
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
                  <div>
                    <h4 style={{fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px'}}>
                      Parameters
                    </h4>
                    <div style={{
                      backgroundColor: '#f9fafb',
                      padding: '12px',
                      borderRadius: '6px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <code style={{fontSize: '13px', color: '#374151', whiteSpace: 'pre-wrap'}}>
                        {endpoint.parameters}
                      </code>
                    </div>
                  </div>
                  
                  <div>
                    <h4 style={{fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px'}}>
                      Returns
                    </h4>
                    <div style={{
                      backgroundColor: '#f0fdf4',
                      padding: '12px',
                      borderRadius: '6px',
                      border: '1px solid #bbf7d0'
                    }}>
                      <code style={{fontSize: '13px', color: '#15803d'}}>
                        {endpoint.returns}
                      </code>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Data Models */}
      <div style={{marginBottom: '48px'}}>
        <h2 style={{fontSize: '2rem', fontWeight: '600', color: '#1f2937', marginBottom: '24px', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px'}}>
          Data Models
        </h2>
        
        {Object.entries(dataModels).map(([modelName, fields]) => (
          <div key={modelName} style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb',
            marginBottom: '16px'
          }}>
            <h3 style={{fontSize: '1.5rem', fontWeight: '600', color: '#374151', marginBottom: '16px'}}>
              {modelName}
            </h3>
            
            <div style={{display: 'grid', gap: '8px'}}>
              {Object.entries(fields).map(([fieldName, fieldType]) => (
                <div key={fieldName} style={{display: 'flex', justifyContent: 'space-between', padding: '8px', backgroundColor: '#f9fafb', borderRadius: '4px'}}>
                  <code style={{fontWeight: '600', color: '#374151'}}>{fieldName}</code>
                  <code style={{color: '#6b7280'}}>{fieldType}</code>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Usage Examples */}
      <div style={{marginBottom: '48px'}}>
        <h2 style={{fontSize: '2rem', fontWeight: '600', color: '#1f2937', marginBottom: '24px', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px'}}>
          Usage Examples
        </h2>
        
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{fontSize: '1.25rem', fontWeight: '600', marginBottom: '16px'}}>
            Creating a venue with events
          </h3>
          
          <div style={{marginBottom: '16px'}}>
            <h4 style={{fontSize: '16px', fontWeight: '500', marginBottom: '8px'}}>1. Create a venue</h4>
            <div style={{backgroundColor: '#1f2937', padding: '16px', borderRadius: '6px', overflowX: 'auto'}}>
              <code style={{color: '#f9fafb', fontSize: '14px', whiteSpace: 'pre'}}>
{`curl -X POST "http://localhost:8000/venues/" \\
  -H "X-API-Key: your-secret-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Madison Square Garden",
    "description": "Famous venue in NYC"
  }'`}
              </code>
            </div>
          </div>
          
          <div style={{marginBottom: '16px'}}>
            <h4 style={{fontSize: '16px', fontWeight: '500', marginBottom: '8px'}}>2. Add events to the venue</h4>
            <div style={{backgroundColor: '#1f2937', padding: '16px', borderRadius: '6px', overflowX: 'auto'}}>
              <code style={{color: '#f9fafb', fontSize: '14px', whiteSpace: 'pre'}}>
{`curl -X POST "http://localhost:8000/events/bulk" \\
  -H "X-API-Key: your-secret-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "venue_id": 1,
    "bulk_input": "https://msg.com/events/123\\nhttps://msg.com/events/456"
  }'`}
              </code>
            </div>
          </div>
          
          <div>
            <h4 style={{fontSize: '16px', fontWeight: '500', marginBottom: '8px'}}>3. Search for events</h4>
            <div style={{backgroundColor: '#1f2937', padding: '16px', borderRadius: '6px', overflowX: 'auto'}}>
              <code style={{color: '#f9fafb', fontSize: '14px', whiteSpace: 'pre'}}>
{`curl -X GET "http://localhost:8000/search?q=Madison" \\
  -H "X-API-Key: your-secret-api-key"`}
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ApiDocumentation;