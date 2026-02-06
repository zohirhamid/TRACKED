import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  fetchMonthData,
  createTracker,
  updateTracker,
  deleteTracker,
  saveEntry,
  deleteEntry,
  fetchLatestInsight,
  generateInsight,
} from '../api/client';

const LifeTracker = () => {
  const { onLogout } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCell, setSelectedCell] = useState(null);
  const [isDark, setIsDark] = useState(true);
  const [showInsights, setShowInsights] = useState(true);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Data from backend
  const [trackers, setTrackers] = useState([]);
  const [weeks, setWeeks] = useState([]);
  const [weekStats, setWeekStats] = useState([]);
  const [monthInfo, setMonthInfo] = useState({ month_name: '', total_days: 0, today: '' });

  const [editingCategory, setEditingCategory] = useState(null);
  const debounceTimers = useRef({});

  const [insights, setInsights] = useState({
    summary: '',
    trends: [],
    advice: [],
    correlations: [],
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  // Flatten weeks into a list of days for the grid
  const days = weeks.flat();

  const loadMonthData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMonthData(year, month);
      setTrackers(data.trackers || []);
      setWeeks(data.weeks || []);
      setWeekStats(data.week_stats || []);
      setMonthInfo({
        month_name: data.month_name || '',
        total_days: data.total_days || 0,
        today: data.today || '',
      });
    } catch (err) {
      if (err.message === 'Session expired') {
        onLogout();
        return;
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [year, month, onLogout]);

  useEffect(() => {
    loadMonthData();
  }, [loadMonthData]);

  const loadInsights = useCallback(async () => {
    try {
      const data = await fetchLatestInsight('weekly');
      if (data.content) {
        setInsights({
          summary: data.content.summary || '',
          trends: data.content.trends || [],
          advice: data.content.advice || [],
          correlations: data.content.correlations || [],
        });
      }
    } catch {
      // Insights are optional — fail silently
    }
  }, []);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  const getDayNumber = (dateStr) => new Date(dateStr).getDate();

  const getDayName = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' });
  };

  const isToday = (dateStr) => dateStr === monthInfo.today;

  const isWeekend = (dateStr) => {
    const d = new Date(dateStr);
    return d.getDay() === 0 || d.getDay() === 6;
  };

  const navigateMonth = (direction) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  };

  const getCellKey = (trackerId, dateStr) => `${trackerId}-${dateStr}`;

  // Extract display value from an entry based on tracker type
  const getEntryDisplayValue = (tracker, entry) => {
    if (!entry) return '';
    switch (tracker.tracker_type) {
      case 'binary': return entry.binary_value === true ? 'Yes' : entry.binary_value === false ? 'No' : '';
      case 'number': return entry.number_value != null ? String(entry.number_value) : '';
      case 'rating': return entry.rating_value != null ? String(entry.rating_value) : '';
      case 'time': return entry.time_value || '';
      case 'duration': return entry.duration_minutes != null ? String(entry.duration_minutes) : '';
      case 'text': return entry.text_value || '';
      default: return '';
    }
  };

  // Build the value payload for saveEntry based on tracker type
  const buildEntryPayload = (tracker, rawValue) => {
    const val = rawValue.trim();
    switch (tracker.tracker_type) {
      case 'binary': {
        const lower = val.toLowerCase();
        if (['yes', 'y', '1', 'true'].includes(lower)) return { binary_value: true };
        if (['no', 'n', '0', 'false'].includes(lower)) return { binary_value: false };
        return null;
      }
      case 'number': return { number_value: val };
      case 'rating': return { rating_value: val };
      case 'time': return { time_value: val };
      case 'duration': return { duration_minutes: val };
      case 'text': return { text_value: val };
      default: return null;
    }
  };

  const handleCellChange = (tracker, dateStr, value) => {
    // Optimistically update local state
    setWeeks(prevWeeks =>
      prevWeeks.map(week =>
        week.map(day => {
          if (day.date !== dateStr) return day;
          const updatedEntries = { ...day.entries };
          if (!value.trim()) {
            delete updatedEntries[tracker.id];
          } else {
            updatedEntries[tracker.id] = {
              ...updatedEntries[tracker.id],
              _displayOverride: value,
            };
          }
          return { ...day, entries: updatedEntries };
        })
      )
    );

    // Debounce the API call
    const key = getCellKey(tracker.id, dateStr);
    clearTimeout(debounceTimers.current[key]);
    debounceTimers.current[key] = setTimeout(async () => {
      try {
        if (!value.trim()) {
          await deleteEntry(tracker.id, dateStr);
        } else {
          const payload = buildEntryPayload(tracker, value);
          if (payload) {
            await saveEntry(tracker.id, dateStr, payload);
          }
        }
      } catch {
        // Reload on error to sync state
        loadMonthData();
      }
    }, 500);
  };

  const handleAddTracker = async () => {
    try {
      const maxOrder = trackers.reduce((max, t) => Math.max(max, t.display_order || 0), 0);
      const data = await createTracker({
        name: 'New',
        tracker_type: 'number',
        unit: '',
        display_order: maxOrder + 1,
        is_active: true,
      });
      setTrackers([...trackers, data]);
      setEditingCategory(data.id);
    } catch {
      setError('Failed to create tracker');
    }
  };

  const handleUpdateTracker = async (id, updates) => {
    const tracker = trackers.find(t => t.id === id);
    if (!tracker) return;

    // Optimistic update
    setTrackers(trackers.map(t => t.id === id ? { ...t, ...updates } : t));

    try {
      await updateTracker(id, { ...tracker, ...updates });
    } catch {
      loadMonthData();
    }
  };

  const handleDeleteTracker = async (id) => {
    if (trackers.length <= 1) return;
    setTrackers(trackers.filter(t => t.id !== id));
    try {
      await deleteTracker(id);
    } catch {
      loadMonthData();
    }
  };

  const handleGenerateInsights = async () => {
    setLoadingInsights(true);
    try {
      const data = await generateInsight('weekly');
      if (data.content) {
        setInsights({
          summary: data.content.summary || '',
          trends: data.content.trends || [],
          advice: data.content.advice || [],
          correlations: data.content.correlations || [],
        });
      }
    } catch {
      // fail silently
    } finally {
      setLoadingInsights(false);
    }
  };

  const getStats = (tracker) => {
    const values = [];
    for (const day of days) {
      const entry = day.entries?.[tracker.id];
      if (!entry) continue;
      let v = null;
      if (tracker.tracker_type === 'number' && entry.number_value != null) v = Number(entry.number_value);
      else if (tracker.tracker_type === 'rating' && entry.rating_value != null) v = Number(entry.rating_value);
      else if (tracker.tracker_type === 'duration' && entry.duration_minutes != null) v = Number(entry.duration_minutes);
      if (v != null && !isNaN(v)) values.push(v);
    }
    if (values.length === 0) return { avg: '\u2014', count: 0 };
    const total = values.reduce((a, b) => a + b, 0);
    return { avg: (total / values.length).toFixed(1), count: values.length };
  };

  // Theme colors
  const theme = isDark ? {
    bg: '#0a0a0a',
    bgAlt: '#12110a',
    bgCard: '#111',
    text: '#e5e5e5',
    textMuted: '#888',
    textDim: '#555',
    textDimmer: '#333',
    textDimmest: '#222',
    border: '#1a1a1a',
    borderLight: '#141414',
    accent: '#eab308',
    accentBg: 'rgba(234, 179, 8, 0.06)',
    accentBgStrong: 'rgba(234, 179, 8, 0.1)',
    weekendText: '#333',
    weekendDayName: '#262626',
    hoverBorder: '#444',
    hoverText: '#fff',
    inputPlaceholder: '#222',
    positive: '#22c55e',
    negative: '#ef4444',
    neutral: '#888',
  } : {
    bg: '#ffffff',
    bgAlt: '#fffef5',
    bgCard: '#fafafa',
    text: '#1a1a1a',
    textMuted: '#555',
    textDim: '#888',
    textDimmer: '#aaa',
    textDimmest: '#ccc',
    border: '#e5e5e5',
    borderLight: '#f0f0f0',
    accent: '#b8960a',
    accentBg: 'rgba(184, 150, 10, 0.08)',
    accentBgStrong: 'rgba(184, 150, 10, 0.15)',
    weekendText: '#bbb',
    weekendDayName: '#ccc',
    hoverBorder: '#999',
    hoverText: '#000',
    inputPlaceholder: '#ddd',
    positive: '#16a34a',
    negative: '#dc2626',
    neutral: '#666',
  };

  if (loading && trackers.length === 0) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: theme.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '"JetBrains Mono", monospace',
        color: theme.textDim,
        fontSize: '12px',
        letterSpacing: '2px',
      }}>
        LOADING...
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: theme.bg,
      color: theme.text,
      fontFamily: '"JetBrains Mono", "SF Mono", "Fira Code", monospace',
      padding: '32px',
      boxSizing: 'border-box',
      transition: 'background-color 0.2s ease, color 0.2s ease',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600&display=swap');

        * { box-sizing: border-box; }

        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: ${isDark ? '#141414' : '#f5f5f5'}; }
        ::-webkit-scrollbar-thumb { background: ${isDark ? '#333' : '#ccc'}; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: ${isDark ? '#444' : '#aaa'}; }

        input:focus { outline: none; }
        .cell-input::placeholder { color: ${theme.inputPlaceholder}; }

        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        .loading-dot { animation: pulse 1.5s ease-in-out infinite; }
      `}</style>

      <div style={{ display: 'flex', gap: '32px' }}>
        {/* Main Tracker */}
        <div style={{ flex: 1 }}>
          {/* Header */}
          <header style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: '40px',
            borderBottom: `1px solid ${theme.border}`,
            paddingBottom: '24px',
          }}>
            <div>
              <div style={{
                fontSize: '10px',
                letterSpacing: '3px',
                color: theme.textDim,
                marginBottom: '8px',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                Life Tracker
                <span style={{
                  background: theme.accentBgStrong,
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
                color: isDark ? '#fff' : '#000',
              }}>
                {monthInfo.month_name} {year}
              </h1>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}>
              <button
                onClick={() => setShowInsights(!showInsights)}
                style={{
                  background: showInsights ? theme.accentBgStrong : 'transparent',
                  border: `1px solid ${showInsights ? theme.accent : theme.borderLight}`,
                  color: showInsights ? theme.accent : theme.textDim,
                  padding: '8px 14px',
                  cursor: 'pointer',
                  fontSize: '9px',
                  letterSpacing: '1px',
                  marginRight: '8px',
                  fontFamily: 'inherit',
                  transition: 'all 0.15s ease',
                }}
              >
                INSIGHTS
              </button>
              <button
                onClick={() => setIsDark(!isDark)}
                style={{
                  background: 'transparent',
                  border: `1px solid ${theme.borderLight}`,
                  color: theme.textDim,
                  padding: '8px 14px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  marginRight: '8px',
                  transition: 'all 0.15s ease',
                }}
              >
                {isDark ? '\u2600' : '\u263E'}
              </button>
              <button
                onClick={() => navigateMonth(-1)}
                style={{
                  background: 'transparent',
                  border: `1px solid ${theme.borderLight}`,
                  color: theme.textDim,
                  padding: '8px 14px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  transition: 'all 0.15s ease',
                }}
              >
                \u2190
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                style={{
                  background: 'transparent',
                  border: `1px solid ${theme.borderLight}`,
                  color: theme.textDim,
                  padding: '8px 14px',
                  cursor: 'pointer',
                  fontSize: '9px',
                  letterSpacing: '1px',
                  fontFamily: 'inherit',
                  transition: 'all 0.15s ease',
                }}
              >
                TODAY
              </button>
              <button
                onClick={() => navigateMonth(1)}
                style={{
                  background: 'transparent',
                  border: `1px solid ${theme.borderLight}`,
                  color: theme.textDim,
                  padding: '8px 14px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  transition: 'all 0.15s ease',
                }}
              >
                \u2192
              </button>
              <button
                onClick={onLogout}
                style={{
                  background: 'transparent',
                  border: `1px solid ${theme.borderLight}`,
                  color: theme.textDim,
                  padding: '8px 14px',
                  cursor: 'pointer',
                  fontSize: '9px',
                  letterSpacing: '1px',
                  fontFamily: 'inherit',
                  marginLeft: '8px',
                  transition: 'all 0.15s ease',
                }}
              >
                LOGOUT
              </button>
            </div>
          </header>

          {error && (
            <div style={{
              color: theme.negative,
              fontSize: '12px',
              padding: '10px 12px',
              border: `1px solid rgba(239, 68, 68, 0.2)`,
              background: 'rgba(239, 68, 68, 0.05)',
              marginBottom: '20px',
            }}>
              {error}
            </div>
          )}

          {/* Main Grid */}
          <div style={{ overflowX: 'auto', paddingBottom: '16px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{
                    width: '100px',
                    minWidth: '100px',
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '10px',
                    fontWeight: '500',
                    color: theme.textDim,
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    borderBottom: `1px solid ${theme.border}`,
                    position: 'sticky',
                    left: 0,
                    backgroundColor: theme.bg,
                    zIndex: 10,
                  }}>
                    Date
                  </th>
                  {trackers.map(tracker => (
                    <th
                      key={tracker.id}
                      style={{
                        minWidth: '80px',
                        padding: '12px 12px',
                        textAlign: 'center',
                        borderBottom: `1px solid ${theme.border}`,
                        borderLeft: `1px solid ${theme.borderLight}`,
                        cursor: 'pointer',
                      }}
                      onClick={() => setEditingCategory(editingCategory === tracker.id ? null : tracker.id)}
                    >
                      {editingCategory === tracker.id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                          <input
                            type="text"
                            value={tracker.name}
                            onChange={(e) => handleUpdateTracker(tracker.id, { name: e.target.value })}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              borderBottom: `1px solid ${theme.textDimmer}`,
                              color: isDark ? '#fff' : '#000',
                              fontSize: '11px',
                              fontFamily: 'inherit',
                              padding: '2px 4px',
                              width: '70px',
                              textAlign: 'center',
                            }}
                            autoFocus
                          />
                          <input
                            type="text"
                            value={tracker.unit || ''}
                            onChange={(e) => handleUpdateTracker(tracker.id, { unit: e.target.value })}
                            onClick={(e) => e.stopPropagation()}
                            placeholder="unit"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              borderBottom: `1px solid ${theme.textDimmest}`,
                              color: theme.textDim,
                              fontSize: '9px',
                              fontFamily: 'inherit',
                              padding: '2px 4px',
                              width: '50px',
                              textAlign: 'center',
                            }}
                          />
                          {trackers.length > 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTracker(tracker.id);
                              }}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: theme.textDim,
                                cursor: 'pointer',
                                padding: '2px',
                                fontSize: '12px',
                              }}
                            >
                              \u00d7
                            </button>
                          )}
                        </div>
                      ) : (
                        <>
                          <div style={{
                            fontSize: '11px',
                            color: theme.text,
                            fontWeight: '400',
                          }}>
                            {tracker.name}
                          </div>
                          {tracker.unit && (
                            <div style={{
                              fontSize: '9px',
                              color: theme.textDim,
                              marginTop: '2px',
                            }}>
                              {tracker.unit}
                            </div>
                          )}
                        </>
                      )}
                    </th>
                  ))}
                  <th style={{
                    width: '50px',
                    minWidth: '50px',
                    padding: '12px 8px',
                    textAlign: 'center',
                    borderBottom: `1px solid ${theme.border}`,
                    borderLeft: `1px solid ${theme.border}`,
                  }}>
                    <button
                      onClick={handleAddTracker}
                      style={{
                        background: 'transparent',
                        border: `1px dashed ${theme.textDimmest}`,
                        color: theme.textDimmer,
                        padding: '4px 8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      +
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {days.map(day => {
                  const dayNum = getDayNumber(day.date);
                  const dayName = getDayName(day.date);
                  const todayFlag = isToday(day.date);
                  const weekendFlag = isWeekend(day.date);

                  return (
                    <tr
                      key={day.date}
                      style={{
                        backgroundColor: todayFlag ? theme.accentBg : 'transparent',
                      }}
                    >
                      <td style={{
                        padding: '0 16px',
                        height: '38px',
                        borderBottom: `1px solid ${theme.borderLight}`,
                        position: 'sticky',
                        left: 0,
                        backgroundColor: todayFlag ? theme.bgAlt : theme.bg,
                        zIndex: 5,
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                        }}>
                          <span style={{
                            fontSize: '12px',
                            color: todayFlag ? theme.accent : (weekendFlag ? theme.weekendText : theme.textMuted),
                            fontWeight: todayFlag ? '600' : '400',
                            width: '18px',
                          }}>
                            {dayNum}
                          </span>
                          <span style={{
                            fontSize: '9px',
                            color: weekendFlag ? theme.weekendDayName : theme.textDimmer,
                            width: '26px',
                          }}>
                            {dayName}
                          </span>
                        </div>
                      </td>
                      {trackers.map(tracker => {
                        const entry = day.entries?.[tracker.id];
                        const displayValue = entry?._displayOverride != null
                          ? entry._displayOverride
                          : getEntryDisplayValue(tracker, entry);
                        const cellKey = getCellKey(tracker.id, day.date);
                        const isSelected = selectedCell === cellKey;

                        return (
                          <td
                            key={tracker.id}
                            style={{
                              padding: '0',
                              borderBottom: `1px solid ${theme.borderLight}`,
                              borderLeft: `1px solid ${theme.borderLight}`,
                            }}
                          >
                            <input
                              type="text"
                              className="cell-input"
                              value={displayValue}
                              onChange={(e) => handleCellChange(tracker, day.date, e.target.value)}
                              onFocus={() => setSelectedCell(cellKey)}
                              onBlur={() => setSelectedCell(null)}
                              style={{
                                width: '100%',
                                height: '38px',
                                background: isSelected ? theme.accentBgStrong : 'transparent',
                                border: 'none',
                                borderTop: `1px solid ${isSelected ? theme.accent : 'transparent'}`,
                                borderBottom: `1px solid ${isSelected ? theme.accent : 'transparent'}`,
                                color: displayValue ? (isDark ? '#fff' : '#000') : theme.textDimmest,
                                textAlign: 'center',
                                fontSize: '12px',
                                fontFamily: 'inherit',
                                padding: '0 8px',
                                transition: 'all 0.1s ease',
                              }}
                              placeholder="\u00b7"
                            />
                          </td>
                        );
                      })}
                      <td style={{
                        borderBottom: `1px solid ${theme.borderLight}`,
                        borderLeft: `1px solid ${theme.border}`,
                      }} />
                    </tr>
                  );
                })}
                {/* Summary Row */}
                <tr>
                  <td style={{
                    padding: '14px 16px',
                    borderTop: `1px solid ${theme.border}`,
                    position: 'sticky',
                    left: 0,
                    backgroundColor: theme.bg,
                    zIndex: 5,
                  }}>
                    <span style={{
                      fontSize: '9px',
                      color: theme.textDim,
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                    }}>
                      Avg
                    </span>
                  </td>
                  {trackers.map(tracker => {
                    const stats = getStats(tracker);
                    return (
                      <td
                        key={tracker.id}
                        style={{
                          padding: '14px 12px',
                          borderTop: `1px solid ${theme.border}`,
                          borderLeft: `1px solid ${theme.borderLight}`,
                          textAlign: 'center',
                        }}
                      >
                        <div style={{
                          fontSize: '12px',
                          color: stats.count > 0 ? (isDark ? '#fff' : '#000') : theme.textDimmest,
                          fontWeight: '500',
                        }}>
                          {stats.avg}
                        </div>
                      </td>
                    );
                  })}
                  <td style={{
                    borderTop: `1px solid ${theme.border}`,
                    borderLeft: `1px solid ${theme.border}`,
                  }} />
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Insights Panel */}
        {showInsights && (
          <div style={{
            width: '320px',
            flexShrink: 0,
            borderLeft: `1px solid ${theme.border}`,
            paddingLeft: '32px',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
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
                onClick={handleGenerateInsights}
                disabled={loadingInsights}
                style={{
                  background: 'transparent',
                  border: `1px solid ${theme.borderLight}`,
                  color: loadingInsights ? theme.textDimmer : theme.accent,
                  padding: '6px 12px',
                  cursor: loadingInsights ? 'default' : 'pointer',
                  fontSize: '9px',
                  letterSpacing: '1px',
                  fontFamily: 'inherit',
                  transition: 'all 0.15s ease',
                }}
              >
                {loadingInsights ? (
                  <span>
                    <span className="loading-dot">{'\u25cf'}</span>
                    <span className="loading-dot" style={{ animationDelay: '0.2s' }}>{'\u25cf'}</span>
                    <span className="loading-dot" style={{ animationDelay: '0.4s' }}>{'\u25cf'}</span>
                  </span>
                ) : 'REFRESH'}
              </button>
            </div>

            {/* Summary */}
            {insights.summary && (
              <div style={{
                background: theme.bgCard,
                border: `1px solid ${theme.borderLight}`,
                padding: '16px',
                marginBottom: '20px',
              }}>
                <div style={{
                  fontSize: '9px',
                  letterSpacing: '1px',
                  color: theme.accent,
                  textTransform: 'uppercase',
                  marginBottom: '10px',
                }}>
                  Summary
                </div>
                <p style={{
                  fontSize: '12px',
                  color: theme.text,
                  lineHeight: '1.6',
                  margin: 0,
                }}>
                  {insights.summary}
                </p>
              </div>
            )}

            {/* Trends */}
            {insights.trends.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{
                  fontSize: '9px',
                  letterSpacing: '1px',
                  color: theme.textDim,
                  textTransform: 'uppercase',
                  marginBottom: '12px',
                }}>
                  Trends
                </div>
                {insights.trends.map((trend, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 0',
                      borderBottom: `1px solid ${theme.borderLight}`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        fontSize: '14px',
                        color: trend.direction === 'up' ? theme.positive :
                               trend.direction === 'down' ? theme.negative : theme.neutral,
                      }}>
                        {trend.direction === 'up' ? '\u2191' : trend.direction === 'down' ? '\u2193' : '\u2192'}
                      </span>
                      <div>
                        <div style={{ fontSize: '12px', color: theme.text }}>{trend.metric}</div>
                        <div style={{ fontSize: '10px', color: theme.textDim }}>{trend.note}</div>
                      </div>
                    </div>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '500',
                      color: trend.direction === 'up' ? theme.positive :
                             trend.direction === 'down' ? theme.negative : theme.neutral,
                    }}>
                      {trend.change}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Correlations */}
            {insights.correlations.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{
                  fontSize: '9px',
                  letterSpacing: '1px',
                  color: theme.textDim,
                  textTransform: 'uppercase',
                  marginBottom: '12px',
                }}>
                  Correlations
                </div>
                {insights.correlations.map((corr, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '10px 12px',
                      background: theme.bgCard,
                      border: `1px solid ${theme.borderLight}`,
                      marginBottom: '8px',
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '4px',
                    }}>
                      <span style={{ fontSize: '11px', color: theme.text }}>{corr.pair}</span>
                      <span style={{
                        fontSize: '9px',
                        padding: '2px 6px',
                        background: corr.strength === 'strong' ? theme.accentBgStrong :
                                   corr.strength === 'moderate' ? theme.accentBg : 'transparent',
                        color: corr.strength === 'strong' ? theme.accent :
                               corr.strength === 'moderate' ? theme.accent : theme.textDim,
                        border: corr.strength === 'weak' ? `1px solid ${theme.borderLight}` : 'none',
                      }}>
                        {corr.strength}
                      </span>
                    </div>
                    <div style={{ fontSize: '10px', color: theme.textDim }}>
                      {corr.description}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Advice */}
            {insights.advice.length > 0 && (
              <div>
                <div style={{
                  fontSize: '9px',
                  letterSpacing: '1px',
                  color: theme.textDim,
                  textTransform: 'uppercase',
                  marginBottom: '12px',
                }}>
                  Recommendations
                </div>
                {insights.advice.map((advice, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      gap: '10px',
                      padding: '10px 0',
                      borderBottom: `1px solid ${theme.borderLight}`,
                    }}
                  >
                    <span style={{
                      color: theme.accent,
                      fontSize: '10px',
                      marginTop: '2px',
                    }}>
                      {'\u2192'}
                    </span>
                    <p style={{
                      fontSize: '11px',
                      color: theme.text,
                      lineHeight: '1.5',
                      margin: 0,
                    }}>
                      {typeof advice === 'string' ? advice : advice.text || ''}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {!insights.summary && insights.trends.length === 0 && (
              <div style={{
                color: theme.textDim,
                fontSize: '11px',
                textAlign: 'center',
                padding: '40px 0',
              }}>
                No insights yet. Add some data and click REFRESH.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LifeTracker;
