import React, { useState, useEffect } from 'react';
import { insightsAPI } from '../services/api';

const InsightPanel = ({ theme }) => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [reportType, setReportType] = useState('daily');

  // Load latest insight on mount
  useEffect(() => {
    loadInsight();
  }, [reportType]);

  const loadInsight = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await insightsAPI.getLatest(reportType);
      setInsights(data.content ? data : null);
    } catch (err) {
      console.error('Failed to load insight:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateInsight = async () => {
    setGenerating(true);
    setError(null);
    try {
      const data = await insightsAPI.generate(reportType);
      setInsights(data);
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to generate insight';
      setError(message);
    } finally {
      setGenerating(false);
    }
  };

  const content = insights?.content;

  return (
    <div style={{
      width: '320px',
      flexShrink: 0,
      borderLeft: `1px solid ${theme.border}`,
      paddingLeft: '32px',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
      }}>
        <div style={{
          fontSize: '10px',
          letterSpacing: '2px',
          color: theme.textDim,
          textTransform: 'uppercase',
        }}>
          AI Insights
        </div>
        <button
          onClick={generateInsight}
          disabled={generating}
          style={{
            background: 'transparent',
            border: `1px solid ${generating ? theme.borderLight : theme.accent}`,
            color: generating ? theme.textDimmer : theme.accent,
            padding: '6px 12px',
            cursor: generating ? 'default' : 'pointer',
            fontSize: '9px',
            letterSpacing: '1px',
            fontFamily: 'inherit',
            transition: 'all 0.15s ease',
          }}
        >
          {generating ? (
            <span>
              <span className="loading-dot">●</span>
              <span className="loading-dot" style={{ animationDelay: '0.2s' }}>●</span>
              <span className="loading-dot" style={{ animationDelay: '0.4s' }}>●</span>
            </span>
          ) : 'ANALYZE'}
        </button>
      </div>

      {/* Report type selector */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '16px',
      }}>
        <div style={{
          fontSize: '9px',
          color: theme.textDim,
          letterSpacing: '0.5px',
        }}>
          Report type
        </div>
        <select
          value={reportType}
          onChange={(e) => setReportType(e.target.value)}
          style={{
            background: theme.bgCard,
            border: `1px solid ${theme.borderLight}`,
            color: theme.text,
            padding: '6px 8px',
            fontSize: '10px',
            fontFamily: 'inherit',
          }}
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>

      {/* Error message */}
      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          padding: '10px 14px',
          marginBottom: '16px',
          fontSize: '11px',
          color: '#ef4444',
          lineHeight: '1.5',
        }}>
          {error}
        </div>
      )}

      {/* Loading state */}
      {(loading || generating) && !error && (
        <div style={{
          background: theme.bgCard,
          border: `1px solid ${theme.borderLight}`,
          padding: '40px 16px',
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: '11px',
            color: theme.textMuted,
          }}>
            {generating ? 'Analyzing your data...' : 'Loading...'}
          </div>
        </div>
      )}

      {/* Content */}
      {!loading && !generating && content && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Period badge */}
          {insights?.period_start && insights?.period_end && (
            <div style={{
              fontSize: '9px',
              color: theme.textDim,
              letterSpacing: '0.5px',
            }}>
              {insights.period_start} → {insights.period_end}
            </div>
          )}

          {/* Summary */}
          {content.summary && (
            <Section title="Summary" theme={theme}>
              <p style={{
                fontSize: '12px',
                color: theme.text,
                lineHeight: '1.7',
                margin: 0,
              }}>
                {content.summary}
              </p>
            </Section>
          )}

          {/* Trends */}
          {content.trends && content.trends.length > 0 && (
            <Section title="Trends" theme={theme}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {content.trends.map((trend, i) => (
                  <TrendItem key={i} trend={trend} theme={theme} />
                ))}
              </div>
            </Section>
          )}

          {/* Correlations */}
          {content.correlations && content.correlations.length > 0 && (
            <Section title="Correlations" theme={theme}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {content.correlations.map((corr, i) => (
                  <CorrelationItem key={i} correlation={corr} theme={theme} />
                ))}
              </div>
            </Section>
          )}

          {/* Advice */}
          {content.advice && content.advice.length > 0 && (
            <Section title="Advice" theme={theme}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {content.advice.map((item, i) => (
                  <div key={i} style={{
                    fontSize: '11px',
                    color: theme.text,
                    lineHeight: '1.6',
                    paddingLeft: '12px',
                    borderLeft: `2px solid ${theme.accent}`,
                  }}>
                    {item}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Updated timestamp */}
          {(insights?.updated_at || insights?.created_at) && (
            <div style={{
              fontSize: '9px',
              color: theme.textDimmer,
              textAlign: 'right',
              letterSpacing: '0.5px',
            }}>
              {new Date(insights.updated_at || insights.created_at).toLocaleString()}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!loading && !generating && !content && !error && (
        <div style={{
          background: theme.bgCard,
          border: `1px solid ${theme.borderLight}`,
          padding: '40px 16px',
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: '12px',
            color: theme.textMuted,
            marginBottom: '12px',
          }}>
            No insights yet
          </div>
          <div style={{
            fontSize: '10px',
            color: theme.textDim,
          }}>
            Click ANALYZE to get AI-powered insights
          </div>
        </div>
      )}
    </div>
  );
};


/* ---- Sub-components ---- */

const Section = ({ title, theme, children }) => (
  <div style={{
    background: theme.bgCard,
    border: `1px solid ${theme.borderLight}`,
    padding: '14px 16px',
  }}>
    <div style={{
      fontSize: '9px',
      letterSpacing: '1px',
      color: theme.accent,
      textTransform: 'uppercase',
      marginBottom: '10px',
    }}>
      {title}
    </div>
    {children}
  </div>
);

const TrendItem = ({ trend, theme }) => {
  const arrow = trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→';
  const arrowColor = trend.direction === 'up' ? '#22c55e' : trend.direction === 'down' ? '#ef4444' : theme.textMuted;

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
      <span style={{
        fontSize: '14px',
        color: arrowColor,
        lineHeight: '1',
        marginTop: '1px',
      }}>
        {arrow}
      </span>
      <div>
        <div style={{
          fontSize: '11px',
          color: theme.text,
          fontWeight: '500',
        }}>
          {trend.metric}
          {trend.change && (
            <span style={{
              color: arrowColor,
              marginLeft: '6px',
              fontSize: '10px',
              fontWeight: '400',
            }}>
              {trend.change}
            </span>
          )}
        </div>
        {trend.note && (
          <div style={{
            fontSize: '10px',
            color: theme.textMuted,
            marginTop: '2px',
            lineHeight: '1.4',
          }}>
            {trend.note}
          </div>
        )}
      </div>
    </div>
  );
};

const CorrelationItem = ({ correlation, theme }) => {
  const strengthColor = {
    strong: '#22c55e',
    moderate: theme.accent,
    weak: theme.textDim,
  }[correlation.strength] || theme.textMuted;

  return (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '3px',
      }}>
        <span style={{
          fontSize: '11px',
          color: theme.text,
          fontWeight: '500',
        }}>
          {correlation.pair}
        </span>
        <span style={{
          fontSize: '8px',
          color: strengthColor,
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
          border: `1px solid ${strengthColor}`,
          padding: '1px 5px',
        }}>
          {correlation.strength}
        </span>
      </div>
      {correlation.description && (
        <div style={{
          fontSize: '10px',
          color: theme.textMuted,
          lineHeight: '1.4',
        }}>
          {correlation.description}
        </div>
      )}
    </div>
  );
};

export default InsightPanel;
