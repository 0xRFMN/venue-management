import { useEffect, useState } from 'react';
import Login from './Login.jsx';
import { userApi } from '../api/api.ts';

function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const sessionToken = localStorage.getItem('sessionToken');
    
    if (!sessionToken) {
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }

    try {
      await userApi.verifySession(sessionToken);
      setIsAuthenticated(true);
    } catch (error) {
      // Session invalid or expired
      localStorage.removeItem('sessionToken');
      localStorage.removeItem('user');
      setIsAuthenticated(false);
    }
    setIsLoading(false);
  };

  const handleLogin = (loginSuccess) => {
    if (loginSuccess) {
      setIsAuthenticated(true);
    }
  };

  const handleLogout = async () => {
    const sessionToken = localStorage.getItem('sessionToken');
    
    if (sessionToken) {
      try {
        await userApi.logout(sessionToken);
      } catch (error) {
        // Even if logout API fails, clear local storage
        console.warn('Logout API failed:', error);
      }
    }
    
    localStorage.removeItem('sessionToken');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{fontSize: '18px', color: '#6b7280'}}>Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div style={{position: 'relative'}}>
      {/* Logout button */}
      <div style={{
        position: 'fixed',
        top: '16px',
        right: '16px',
        zIndex: 1000
      }}>
        <button
          onClick={handleLogout}
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
          Logout
        </button>
      </div>
      {children}
    </div>
  );
}

export default ProtectedRoute;