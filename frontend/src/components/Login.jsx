import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { navigate } from '../app/router.jsx';
import { useTheme } from '../theme/ThemeContext';

const DEMO_USERNAME = 'demo';
const DEMO_PASSWORD = 'london2024';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { login, signup } = useAuth();
  const { theme } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = isSignUp
      ? await signup(username, password, email)
      : await login(username, password);

    if (!result.success) {
      setError(result.error);
      setIsLoading(false);
    }
  };

  const handleDemo = async () => {
    setError('');
    setIsDemoLoading(true);

    const result = await login(DEMO_USERNAME, DEMO_PASSWORD);

    if (!result.success) {
      setError('Demo account unavailable. Please try again later.');
      setIsDemoLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
  };

  const anyLoading = isLoading || isDemoLoading;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: theme.bg,
      color: theme.text,
      fontFamily: '"JetBrains Mono", "SF Mono", "Fira Code", monospace',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        padding: '32px',
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '40px',
        }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'transparent',
              border: 'none',
              color: theme.textMuted,
              fontSize: '12px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              marginBottom: '24px',
              display: 'block',
            }}
          >
            ← Back
          </button>
          <div style={{
            fontSize: '10px',
            letterSpacing: '3px',
            color: theme.textMuted,
            marginBottom: '8px',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
        }}>
          Life Tracker
          <span style={{
            background: theme.accentBg,
            color: theme.accent,
            padding: '2px 6px',
            fontSize: '8px',
            letterSpacing: '1px',
          }}>
            AI
          </span>
        </div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '300',
            margin: 0,
            letterSpacing: '-0.5px',
          }}>
            {isSignUp ? 'Sign Up' : 'Sign In'}
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '10px',
              letterSpacing: '1px',
              color: theme.textMuted,
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{
                width: '100%',
                background: theme.bgCard,
                border: `1px solid ${theme.border}`,
                color: theme.text,
                padding: '12px 16px',
                fontSize: '14px',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {isSignUp && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '10px',
                letterSpacing: '1px',
                color: theme.textMuted,
                textTransform: 'uppercase',
                marginBottom: '8px',
              }}>
                Email <span style={{ color: theme.textMuted, fontSize: '9px', textTransform: 'none' }}>(optional)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  background: theme.bgCard,
                  border: `1px solid ${theme.border}`,
                  color: theme.text,
                  padding: '12px 16px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          )}

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '10px',
              letterSpacing: '1px',
              color: theme.textMuted,
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                background: theme.bgCard,
                border: `1px solid ${theme.border}`,
                color: theme.text,
                padding: '12px 16px',
                fontSize: '14px',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              padding: '12px 16px',
              marginBottom: '20px',
              fontSize: '12px',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={anyLoading}
            style={{
              width: '100%',
              background: theme.accent,
              border: 'none',
              color: '#000',
              padding: '14px',
              fontSize: '10px',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              cursor: anyLoading ? 'default' : 'pointer',
              fontFamily: 'inherit',
              fontWeight: '500',
              opacity: anyLoading ? 0.6 : 1,
            }}
          >
            {isLoading
              ? (isSignUp ? 'Creating account...' : 'Signing in...')
              : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
        </form>

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          margin: '24px 0',
        }}>
          <div style={{ flex: 1, height: '1px', background: theme.border }} />
          <span style={{ fontSize: '9px', color: theme.textMuted, letterSpacing: '1px' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: theme.border }} />
        </div>

        {/* Demo Button */}
        <button
          onClick={handleDemo}
          disabled={anyLoading}
          style={{
            width: '100%',
            background: 'transparent',
            border: `1px solid ${theme.accent}`,
            color: theme.accent,
            padding: '14px',
            fontSize: '10px',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            cursor: anyLoading ? 'default' : 'pointer',
            fontFamily: 'inherit',
            fontWeight: '500',
            opacity: anyLoading ? 0.6 : 1,
            transition: 'all 0.15s ease',
          }}
        >
          {isDemoLoading ? 'Loading demo...' : 'Try Demo'}
        </button>

        <div style={{
          textAlign: 'center',
          marginTop: '24px',
          fontSize: '12px',
          color: theme.textMuted,
        }}>
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <span
            onClick={toggleMode}
            style={{
              color: theme.accent,
              cursor: 'pointer',
            }}
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Login;
