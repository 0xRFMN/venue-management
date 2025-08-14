import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Dashboard from './components/Dashboard.jsx';
import VenueEvents from './components/VenueEvents.jsx';
import ApiDocumentation from './components/ApiDocumentation.jsx';

function App() {
  return (
    <Router>
      <ProtectedRoute>
        <div style={{minHeight: '100vh', backgroundColor: '#f9fafb'}}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/venues/:venueId/events" element={<VenueEvents />} />
            <Route path="/api-docs" element={<ApiDocumentation />} />
          </Routes>
        </div>
      </ProtectedRoute>
    </Router>
  );
}

export default App;