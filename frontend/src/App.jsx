import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import LifeTracker from './components/LifeTracker';

function AppContent() {
  const { authed } = useAuth();
  return authed ? <LifeTracker /> : <LoginPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
