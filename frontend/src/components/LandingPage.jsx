import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { coreAPI } from '../services/api';
import { navigate } from '../app/router.jsx';
import { useTheme } from '../theme/ThemeContext';

const DEMO_USERNAME = 'demo';
const DEMO_PASSWORD = 'london2024';
const LandingPage = () => {
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [userCount, setUserCount] = useState(null);
  const { login } = useAuth();
  const { theme } = useTheme();

  const handleDemo = async () => {
    setIsDemoLoading(true);
    const result = await login(DEMO_USERNAME, DEMO_PASSWORD);
    if (!result.success) {
      setIsDemoLoading(false);
      alert('Demo account unavailable. Please try again later.');
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadUserCount = async () => {
      try {
        const data = await coreAPI.getUserCount();
        if (isMounted && Number.isFinite(data?.count)) {
          setUserCount(data.count);
        }
      } catch (error) {
        // Silently fail; keep placeholder on landing page.
      }
    };

    loadUserCount();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: theme.bg,
      color: theme.text,
      fontFamily: '"JetBrains Mono", "SF Mono", "Fira Code", monospace',
    }}>
      {/* ── Navigation ── */}
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '24px 48px',
        borderBottom: `1px solid ${theme.border}`,
      }}>
        <div style={{
          fontSize: '10px',
          letterSpacing: '3px',
          color: theme.textMuted,
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center',
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
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleDemo}
            disabled={isDemoLoading}
            className="cta-btn"
            style={{
              background: 'transparent',
              border: `1px solid ${theme.accent}`,
              color: theme.accent,
              padding: '8px 16px',
              fontSize: '9px',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              cursor: isDemoLoading ? 'default' : 'pointer',
              fontFamily: 'inherit',
              opacity: isDemoLoading ? 0.6 : 1,
            }}
          >
            {isDemoLoading ? '...' : 'Try Demo'}
          </button>
          <button
            onClick={() => navigate('/login')}
            className="cta-btn"
            style={{
              background: theme.accent,
              border: 'none',
              color: '#000',
              padding: '8px 16px',
              fontSize: '9px',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontWeight: '500',
            }}
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section style={{
        padding: '120px 48px 80px',
        maxWidth: '800px',
        margin: '0 auto',
        textAlign: 'center',
      }}>
        <div className="fade-up fade-up-1" style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '12px',
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            border: `1px solid ${theme.border}`,
            background: theme.bgCard,
            fontSize: '10px',
            letterSpacing: '1px',
            color: theme.textMuted,
            textTransform: 'uppercase',
            borderRadius: '2px',
            minWidth: '140px',
            justifyContent: 'center',
          }}>
            <span style={{
              display: 'inline-block',
              width: '6px',
              height: '6px',
              background: '#22c55e',
            }} />
            {Number.isFinite(userCount) ? userCount.toLocaleString() : '...'} users
          </div>
        </div>

        <div className="fade-up fade-up-1" style={{
          fontSize: '9px',
          letterSpacing: '3px',
          color: theme.accent,
          textTransform: 'uppercase',
          marginBottom: '24px',
        }}>
          Track · Analyze · Improve
        </div>

        <h1 className="fade-up fade-up-2" style={{
          fontSize: '42px',
          fontWeight: '300',
          lineHeight: '1.3',
          margin: '0 0 24px',
          letterSpacing: '-1px',
        }}>
          Your habits,<br />
          <span style={{ color: theme.accent }}>understood by AI</span>
        </h1>

        <p className="fade-up fade-up-3" style={{
          fontSize: '14px',
          color: theme.textMuted,
          lineHeight: '1.8',
          maxWidth: '500px',
          margin: '0 auto 48px',
          fontWeight: '300',
        }}>
          Log your daily habits in a minimal spreadsheet-like interface.
          Hit analyze and let AI find the patterns, correlations, and
          insights you'd never spot yourself.
        </p>

        <div className="fade-up fade-up-4" style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
        }}>
          <button
            onClick={handleDemo}
            disabled={isDemoLoading}
            className="cta-btn"
            style={{
              background: theme.accent,
              border: 'none',
              color: '#000',
              padding: '14px 32px',
              fontSize: '10px',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              cursor: isDemoLoading ? 'default' : 'pointer',
              fontFamily: 'inherit',
              fontWeight: '500',
              opacity: isDemoLoading ? 0.6 : 1,
            }}
          >
            {isDemoLoading ? 'Loading...' : 'Try Demo →'}
          </button>
          <button
            onClick={() => navigate('/login')}
            className="cta-btn"
            style={{
              background: 'transparent',
              border: `1px solid ${theme.border}`,
              color: theme.textMuted,
              padding: '14px 32px',
              fontSize: '10px',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Sign Up
          </button>
        </div>

      </section>

      {/* ── How It Works ── */}
      <section style={{
        padding: '80px 48px',
        borderTop: `1px solid ${theme.border}`,
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{
            fontSize: '9px',
            letterSpacing: '2px',
            color: theme.textDim,
            textTransform: 'uppercase',
            marginBottom: '40px',
            textAlign: 'center',
          }}>
            How it works
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '24px',
          }}>
            <StepCard
              number="01"
              title="Track"
              description="Log sleep, exercise, mood, productivity — anything you want. The grid makes daily logging fast and frictionless."
              theme={theme}
            />
            <StepCard
              number="02"
              title="Analyze"
              description="Hit one button. AI examines up to 30 days of your data, understanding each tracker's context — units, scales, and types."
              theme={theme}
            />
            <StepCard
              number="03"
              title="Improve"
              description="Get trends, correlations between habits, and actionable advice. Discover that planning your day leads to 40% more deep work."
              theme={theme}
            />
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{
        padding: '80px 48px',
        borderTop: `1px solid ${theme.border}`,
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{
            fontSize: '9px',
            letterSpacing: '2px',
            color: theme.textDim,
            textTransform: 'uppercase',
            marginBottom: '40px',
            textAlign: 'center',
          }}>
            Features
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px',
          }}>
            <FeatureCard
              label="Multiple Tracker Types"
              detail="Binary, number, time, duration, rating, text — track anything your way"
              theme={theme}
            />
            <FeatureCard
              label="AI-Powered Insights"
              detail="GPT analyzes your patterns and finds correlations between habits"
              theme={theme}
            />
            <FeatureCard
              label="Spreadsheet Interface"
              detail="Minimal, fast, keyboard-friendly — like Excel but purpose-built"
              theme={theme}
            />
            <FeatureCard
              label="Trend Detection"
              detail="See what's improving, declining, or staying stable across weeks"
              theme={theme}
            />
          </div>
        </div>
      </section>

      {/* ── Tech Stack ── */}
      <section style={{
        padding: '60px 48px',
        borderTop: `1px solid ${theme.border}`,
      }}>
        <div style={{
          maxWidth: '900px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'center',
          gap: '48px',
          flexWrap: 'wrap',
        }}>
          {['Django', 'React', 'PostgreSQL', 'OpenAI API'].map(tech => (
            <span key={tech} style={{
              fontSize: '10px',
              letterSpacing: '2px',
              color: theme.textDim,
              textTransform: 'uppercase',
            }}>
              {tech}
            </span>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        padding: '32px 48px',
        borderTop: `1px solid ${theme.border}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{
          fontSize: '9px',
          color: theme.textDim,
          letterSpacing: '1px',
        }}>
          Built by Zohir Hamid
        </span>
        <a
          href="https://github.com/zohirhamid"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: '9px',
            color: theme.textDim,
            letterSpacing: '1px',
            textDecoration: 'none',
          }}
        >
          GITHUB ↗
        </a>
      </footer>
    </div>
  );
};


/* ── Sub-components ── */

const StepCard = ({ number, title, description, theme }) => (
  <div style={{
    padding: '32px 24px',
    border: `1px solid ${theme.border}`,
    background: theme.bgCard,
  }}>
    <div style={{
      fontSize: '32px',
      fontWeight: '300',
      color: theme.accent,
      marginBottom: '16px',
      letterSpacing: '-1px',
    }}>
      {number}
    </div>
    <div style={{
      fontSize: '13px',
      fontWeight: '500',
      color: theme.text,
      marginBottom: '8px',
      letterSpacing: '0.5px',
    }}>
      {title}
    </div>
    <div style={{
      fontSize: '11px',
      color: theme.textMuted,
      lineHeight: '1.7',
    }}>
      {description}
    </div>
  </div>
);

const FeatureCard = ({ label, detail, theme }) => (
  <div
    className="feature-card"
    style={{
      padding: '24px',
      border: `1px solid ${theme.border}`,
      background: theme.bgCard,
    }}
  >
    <div style={{
      fontSize: '11px',
      fontWeight: '500',
      color: theme.text,
      marginBottom: '6px',
    }}>
      {label}
    </div>
    <div style={{
      fontSize: '10px',
      color: theme.textMuted,
      lineHeight: '1.6',
    }}>
      {detail}
    </div>
  </div>
);

export default LandingPage;
