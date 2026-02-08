import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import LifeTracker from './components/LifeTracker';

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

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

  if (isAuthenticated) return <LifeTracker />;
  if (showLogin) return <Login onBack={() => setShowLogin(false)} />;
  return <LandingPage onSignIn={() => setShowLogin(true)} />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;