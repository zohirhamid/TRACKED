import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

let bootstrapInFlight = null;

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const syncAuth = () => {
      setIsAuthenticated(authAPI.isAuthenticated());
    };

    const bootstrap = async () => {
      if (!bootstrapInFlight) {
        bootstrapInFlight = authAPI.me().finally(() => {
          bootstrapInFlight = null;
        });
      }
      await bootstrapInFlight;
    };

    bootstrap()
      .catch(() => {
        // Not authenticated (expected on cold start)
      })
      .finally(() => {
        if (!isMounted) return;
        syncAuth();
        setIsLoading(false);
      });

    const onAuthChanged = () => syncAuth();
    const onStorage = (e) => {
      if (e.key === 'session_user') syncAuth();
    };

    window.addEventListener('auth:changed', onAuthChanged);
    window.addEventListener('storage', onStorage);
    return () => {
      isMounted = false;
      window.removeEventListener('auth:changed', onAuthChanged);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const login = async (email, password) => {
    try {
      await authAPI.login(email, password);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: authAPI.getErrorMessage?.(error) || 'Login failed',
      };
    }
  };

  const loginWithGoogle = async (credential, clientId) => {
    try {
      await authAPI.googleLogin(credential, clientId);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: authAPI.getErrorMessage?.(error) || 'Google sign-in failed',
      };
    }
  };

  const signup = async (email, password) => {
    try {
      await authAPI.signup(email, password);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: authAPI.getErrorMessage?.(error) || 'Signup failed',
      };
    }
  };

  const logout = () => {
    authAPI.serverLogout?.().catch((e) => {
      // eslint-disable-next-line no-console
      console.error('Server logout failed:', e?.response?.data || e);
    });
    authAPI.logout();
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        login,
        loginWithGoogle,
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
