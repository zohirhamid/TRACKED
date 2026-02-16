import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const syncAuth = () => {
      setIsAuthenticated(authAPI.isAuthenticated());
    };

    syncAuth();
    setIsLoading(false);

    const onTokens = () => syncAuth();
    const onStorage = (e) => {
      if (e.key === 'access_token' || e.key === 'refresh_token') syncAuth();
    };

    window.addEventListener('auth:tokens', onTokens);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('auth:tokens', onTokens);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const login = async (username, password) => {
    try {
      await authAPI.login(username, password);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Login failed',
      };
    }
  };

  const signup = async (username, password, email) => {
    try {
      await authAPI.signup(username, password, email);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Signup failed',
      };
    }
  };

  const logout = () => {
    authAPI.logout();
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
