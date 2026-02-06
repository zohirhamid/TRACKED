import { useState } from 'react';
import { login } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { onLogin } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      onLogin();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '"JetBrains Mono", "SF Mono", "Fira Code", monospace',
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600&display=swap');`}</style>
      <form onSubmit={handleSubmit} style={{
        width: '340px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}>
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            fontSize: '10px',
            letterSpacing: '3px',
            color: '#555',
            marginBottom: '8px',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            Life Tracker
            <span style={{
              background: 'rgba(234, 179, 8, 0.1)',
              color: '#eab308',
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
            color: '#fff',
          }}>
            Sign in
          </h1>
        </div>

        {error && (
          <div style={{
            color: '#ef4444',
            fontSize: '12px',
            padding: '10px 12px',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            background: 'rgba(239, 68, 68, 0.05)',
          }}>
            {error}
          </div>
        )}

        <input
          type="text"
          placeholder="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          style={{
            background: 'transparent',
            border: '1px solid #1a1a1a',
            color: '#e5e5e5',
            padding: '12px 14px',
            fontSize: '13px',
            fontFamily: 'inherit',
            outline: 'none',
          }}
        />
        <input
          type="password"
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{
            background: 'transparent',
            border: '1px solid #1a1a1a',
            color: '#e5e5e5',
            padding: '12px 14px',
            fontSize: '13px',
            fontFamily: 'inherit',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            background: 'rgba(234, 179, 8, 0.1)',
            border: '1px solid #eab308',
            color: '#eab308',
            padding: '12px',
            cursor: loading ? 'default' : 'pointer',
            fontSize: '10px',
            letterSpacing: '2px',
            fontFamily: 'inherit',
            textTransform: 'uppercase',
            opacity: loading ? 0.5 : 1,
          }}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
