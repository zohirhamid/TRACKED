import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import LifeTracker from './components/LifeTracker';

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0a0a0a',
        color: '#888',
        fontFamily: '"JetBrains Mono", monospace',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        Loading...
      </div>
    );
  }

  return isAuthenticated ? <LifeTracker /> : <Login />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;