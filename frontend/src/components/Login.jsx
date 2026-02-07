import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(username, password);

    if (!result.success) {
      setError(result.error);
      setIsLoading(false);
    }
  };

  const theme = {
    bg: '#0a0a0a',
    bgCard: '#111',
    text: '#e5e5e5',
    textMuted: '#888',
    border: '#1a1a1a',
    accent: '#eab308',
    accentBg: 'rgba(234, 179, 8, 0.06)',
  };

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
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600&display=swap');
      `}</style>

      <div style={{
        width: '100%',
        maxWidth: '400px',
        padding: '32px',
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '40px',
        }}>
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
            Sign In
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
            disabled={isLoading}
            style={{
              width: '100%',
              background: theme.accent,
              border: 'none',
              color: '#000',
              padding: '14px',
              fontSize: '10px',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              cursor: isLoading ? 'default' : 'pointer',
              fontFamily: 'inherit',
              fontWeight: '500',
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;