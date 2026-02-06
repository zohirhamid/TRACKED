import { createContext, useContext, useState } from 'react';
import { isAuthenticated, clearTokens } from '../api/client';
 
const AuthContext = createContext(null);
 
export function AuthProvider({ children }) {
  const [authed, setAuthed] = useState(isAuthenticated());
 
  const onLogin = () => setAuthed(true);
 
  const onLogout = () => {
    clearTokens();
    setAuthed(false);
  };
 
  return (
    <AuthContext.Provider value={{ authed, onLogin, onLogout }}>
      {children}
    </AuthContext.Provider>
  );
}
 
export function useAuth() {
  return useContext(AuthContext);
}