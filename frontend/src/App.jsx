import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import LifeTracker from './components/LifeTracker';
 
function AppContent() {
  const { authed } = useAuth();
  const [page, setPage] = useState('login');
 
  if (authed) return <LifeTracker />;
 
  if (page === 'signup') {
    return <SignUpPage onSwitchToLogin={() => setPage('login')} />;
  }
 
  return <LoginPage onSwitchToSignUp={() => setPage('signup')} />;
}
 
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}