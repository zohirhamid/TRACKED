import React, { useState, useEffect } from 'react';
import { trackerAPI, entryAPI, insightsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import AddTrackerModal from './AddTrackerModal';
import TrackerCell from './TrackerCell';
import TrackerManager from './TrackerManager';

const LifeTracker = () => {
  const { logout } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCell, setSelectedCell] = useState(null);
  const [isDark, setIsDark] = useState(true);
  const [showInsights, setShowInsights] = useState(true);
  const [loadingInsights, setLoadingInsights] = useState(false);
  
  // Data from backend
  const [trackers, setTrackers] = useState([]);
  const [monthData, setMonthData] = useState(null);
  const [insights, setInsights] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showManagerModal, setShowManagerModal] = useState(false);

  // Load month data
  useEffect(() => {
    loadMonthData();
  }, [currentDate]);

  // Load insights when panel is shown
  useEffect(() => {
    if (showInsights) {
      loadInsights();
    }
  }, [showInsights, currentDate]);

  const loadMonthData = async () => {
    setIsLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const data = await trackerAPI.getMonthView(year, month);
      
      console.log('Month data from backend:', data);
      console.log('Weeks structure:', data.weeks);
      
      setMonthData(data);
      setTrackers(data.trackers || []);
      
    } catch (error) {
      console.error('Failed to load month data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadInsights = async () => {
    setLoadingInsights(true);
    try {
      const latest = await insightsAPI.getLatest('monthly');
      if (latest.content) {
        // Parse the AI-generated content (assuming it's formatted JSON or text)
        setInsights(latest);
      }
    } catch (error) {
      console.error('Failed to load insights:', error);
    } finally {
      setLoadingInsights(false);
    }
  };

  const generateInsights = async () => {
    setLoadingInsights(true);
    try {
      const newInsight = await insightsAPI.generate('monthly');
      setInsights(newInsight);
    } catch (error) {
      console.error('Failed to generate insights:', error);
    } finally {
      setLoadingInsights(false);
    }
  };
  const handleAddTracker = async (data) => {
    try {
      await trackerAPI.createTracker(data);
      await loadMonthData();
    } catch (error) {
      console.error('Failed to add tracker:', error);
      alert('Failed to add tracker: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDeleteTracker = async (trackerId) => {
    if (!confirm('Are you sure you want to delete this tracker?')) return;
    
    try {
      await trackerAPI.deleteTracker(trackerId);
      await loadMonthData();
    } catch (error) {
      console.error('Failed to delete tracker:', error);
    }
  };

  const updateCellValue = async (trackerId, day, value) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    try {
      // Determine value field based on tracker type
      const tracker = trackers.find(t => t.id === trackerId);
      if (!tracker) return;

      const entryData = {
        tracker_id: trackerId,
        date: dateStr,
      };

      // Handle empty value as delete
      if (!value || value === '') {
        entryData.delete_entry = true;
      } else {
        // Map value to correct field based on tracker type
        switch (tracker.tracker_type) {
          case 'binary':
            entryData.binary_value = value.toLowerCase() === 'true' || value === '1' || value.toLowerCase() === 'yes';
            break;
          case 'number':
            entryData.number_value = parseFloat(value);
            break;
          case 'rating':
            entryData.rating_value = parseInt(value);
            break;
          case 'duration':
            entryData.duration_minutes = parseInt(value);
            break;
          case 'time':
            entryData.time_value = value;
            break;
          case 'text':
            entryData.text_value = value;
            break;
        }
      }

      await entryAPI.saveEntry(entryData);
      
      // Reload the month data to get fresh data from backend
      await loadMonthData();
    } catch (error) {
      console.error('Failed to update entry:', error);
    }
  };

  const getCellValue = (trackerId, day) => {
    if (!monthData || !monthData.weeks) return '';
    
    // Find the tracker to know its type
    const tracker = trackers.find(t => t.id === trackerId);
    if (!tracker) return '';
    
    for (const week of monthData.weeks) {
      // week is an array of day objects
      const dayData = week.find(d => d.day === day);
      if (dayData && dayData.entries && dayData.entries[trackerId]) {
        const entry = dayData.entries[trackerId];
        
        // Extract value based on tracker type
        switch (tracker.tracker_type) {
          case 'binary':
            return entry.binary_value !== undefined ? entry.binary_value.toString() : '';
          case 'number':
            return entry.number_value !== null && entry.number_value !== undefined ? entry.number_value.toString() : '';
          case 'rating':
            return entry.rating_value !== null && entry.rating_value !== undefined ? entry.rating_value.toString() : '';
          case 'duration':
            return entry.duration_minutes !== null && entry.duration_minutes !== undefined ? entry.duration_minutes.toString() : '';
          case 'time':
            return entry.time_value || '';
          case 'text':
            return entry.text_value || '';
          default:
            return '';
        }
      }
    }
    return '';
  };

  const navigateMonth = (direction) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  };

  const getMonthName = (date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getDayName = (day) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const isToday = (day) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const isWeekend = (day) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  };

  const getCellKey = (trackerId, day) => `${trackerId}-${day}`;

  const daysInMonth = getDaysInMonth(currentDate);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Theme colors - softer and easier on the eyes
  const theme = isDark ? {
    bg: '#1a1a1a',              // Softer black (was #0a0a0a - too dark)
    bgAlt: '#222222',           // Softer alt bg
    bgCard: '#252525',          // Softer card (was #111)
    text: '#e0e0e0',            // Slightly dimmer white
    textMuted: '#999',          // Lighter muted (was #888)
    textDim: '#666',            // Lighter dim (was #555)
    textDimmer: '#444',         // Lighter dimmer (was #333)
    textDimmest: '#333',        // Lighter dimmest (was #222)
    border: '#2a2a2a',          // Softer border
    borderLight: '#242424',     // Softer light border
    accent: '#eab308',
    accentBg: 'rgba(234, 179, 8, 0.06)',
    accentBgStrong: 'rgba(234, 179, 8, 0.1)',
    weekendText: '#444',        // Lighter
    weekendDayName: '#383838',  // Lighter
    hoverBorder: '#555',
    hoverText: '#fff',
    inputPlaceholder: '#333',
  } : {
    bg: '#fafafa',              // Softer white (was #ffffff - too bright)
    bgAlt: '#f5f5f0',           // Warmer alt
    bgCard: '#f0f0f0',          // Softer card
    text: '#2a2a2a',            // Softer black (was #1a1a1a)
    textMuted: '#666',          // Darker muted
    textDim: '#888',
    textDimmer: '#aaa',
    textDimmest: '#ccc',
    border: '#d0d0d0',          // Softer border
    borderLight: '#e0e0e0',     // Softer
    accent: '#ca8a04',          // Slightly darker accent
    accentBg: 'rgba(202, 138, 4, 0.08)',
    accentBgStrong: 'rgba(202, 138, 4, 0.15)',
    weekendText: '#aaa',
    weekendDayName: '#bbb',
    hoverBorder: '#999',
    hoverText: '#000',
    inputPlaceholder: '#d5d5d5',
  };

  if (isLoading && !monthData) {
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
        <div style={{ fontSize: '14px', color: theme.textMuted }}>Loading...</div>
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
        
        * {
          box-sizing: border-box;
        }
        
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: ${isDark ? '#141414' : '#f5f5f5'};
        }
        
        ::-webkit-scrollbar-thumb {
          background: ${isDark ? '#333' : '#ccc'};
          border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: ${isDark ? '#444' : '#aaa'};
        }
        
        input:focus {
          outline: none;
        }
        
        .cell-input::placeholder {
          color: ${theme.inputPlaceholder};
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        
        .loading-dot {
          animation: pulse 1.5s ease-in-out infinite;
        }
      `}</style>

      <AddTrackerModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddTracker}
        theme={theme}
      />

      <TrackerManager
        isOpen={showManagerModal}
        onClose={() => setShowManagerModal(false)}
        trackers={trackers}
        onUpdate={loadMonthData}
        theme={theme}
      />

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
                {getMonthName(currentDate)}
              </h1>
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}>
              <button
                onClick={() => setShowManagerModal(true)}
                style={{
                  background: 'transparent',
                  border: `1px solid ${theme.borderLight}`,
                  color: theme.textDim,
                  padding: '8px 14px',
                  cursor: 'pointer',
                  fontSize: '9px',
                  letterSpacing: '1px',
                  marginRight: '8px',
                  transition: 'all 0.15s ease',
                }}
              >
                MANAGE
              </button>
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
                  transition: 'all 0.15s ease',
                }}
              >
                INSIGHTS
              </button>
              <button
                onClick={logout}
                style={{
                  background: 'transparent',
                  border: `1px solid ${theme.borderLight}`,
                  color: theme.textDim,
                  padding: '8px 14px',
                  cursor: 'pointer',
                  fontSize: '9px',
                  letterSpacing: '1px',
                  marginRight: '8px',
                  transition: 'all 0.15s ease',
                }}
              >
                LOGOUT
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
                {isDark ? '☀' : '☾'}
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
                ←
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
                →
              </button>
            </div>
          </header>

          {/* Main Grid */}
          <div style={{
            overflowX: 'auto',
            paddingBottom: '16px',
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
            }}>
              <thead>
                <tr>
                  <th style={{
                    width: '10px',
                    minWidth: '8px',
                    padding: '12px 8px',
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
                  {trackers.map(tracker => {
                    // Set compact width based on tracker type
                    let cellWidth = '65px'; // Compact default
                    if (tracker.tracker_type === 'text') {
                      cellWidth = '140px'; // Double width for text
                    } else if (tracker.tracker_type === 'rating') {
                      cellWidth = '85px'; // For 5 stars
                    } else if (tracker.tracker_type === 'duration') {
                      cellWidth = '75px'; // For "2h 30m"
                    } else if (tracker.tracker_type === 'time') {
                      cellWidth = '70px'; // For "14:30"
                    }
                    
                    return (
                      <th
                        key={tracker.id}
                        style={{
                          width: cellWidth,
                          minWidth: cellWidth,
                          padding: '12px 8px',
                          textAlign: 'center',
                          borderBottom: `1px solid ${theme.border}`,
                          borderLeft: `1px solid ${theme.borderLight}`,
                        }}
                      >
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
                      </th>
                    );
                  })}
                  <th
                    style={{
                      width: '45px',
                      minWidth: '45px',
                      padding: '12px 4px',
                      textAlign: 'center',
                      borderBottom: `1px solid ${theme.border}`,
                      borderLeft: `1px solid ${theme.border}`,
                    }}
                  >
                    <button
                      onClick={() => setShowAddModal(true)}
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
                {days.map(day => (
                  <tr
                    key={day}
                    style={{
                      backgroundColor: isToday(day) 
                        ? theme.accentBg
                        : 'transparent',
                    }}
                  >
                    <td style={{
                      padding: '0 4px',
                      height: '38px',
                      borderBottom: `1px solid ${theme.borderLight}`,
                      position: 'sticky',
                      left: 0,
                      backgroundColor: isToday(day) ? theme.bgAlt : theme.bg,
                      zIndex: 5,
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}>
                        <span style={{
                          fontSize: '12px',
                          color: isToday(day) ? theme.accent : (isWeekend(day) ? theme.weekendText : theme.textMuted),
                          fontWeight: isToday(day) ? '600' : '400',
                          width: '16px',
                        }}>
                          {day}
                        </span>
                        <span style={{
                          fontSize: '9px',
                          color: isWeekend(day) ? theme.weekendDayName : theme.textDimmer,
                          width: '24px',
                        }}>
                          {getDayName(day)}
                        </span>
                      </div>
                    </td>
                    {trackers.map(tracker => {
                      const cellKey = getCellKey(tracker.id, day);
                      const value = getCellValue(tracker.id, day);
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
                          <TrackerCell
                            tracker={tracker}
                            day={day}
                            value={value}
                            isSelected={isSelected}
                            onValueChange={(newValue) => updateCellValue(tracker.id, day, newValue)}
                            onFocus={() => setSelectedCell(cellKey)}
                            onBlur={() => setSelectedCell(null)}
                            theme={theme}
                            isDark={isDark}
                          />
                        </td>
                      );
                    })}
                    <td style={{
                      borderBottom: `1px solid ${theme.borderLight}`,
                      borderLeft: `1px solid ${theme.border}`,
                    }} />
                  </tr>
                ))}
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
                onClick={generateInsights}
                disabled={loadingInsights}
                style={{
                  background: 'transparent',
                  border: `1px solid ${theme.borderLight}`,
                  color: loadingInsights ? theme.textDimmer : theme.accent,
                  padding: '6px 12px',
                  cursor: loadingInsights ? 'default' : 'pointer',
                  fontSize: '9px',
                  letterSpacing: '1px',
                  transition: 'all 0.15s ease',
                }}
              >
                {loadingInsights ? (
                  <span>
                    <span className="loading-dot">●</span>
                    <span className="loading-dot" style={{ animationDelay: '0.2s' }}>●</span>
                    <span className="loading-dot" style={{ animationDelay: '0.4s' }}>●</span>
                  </span>
                ) : 'GENERATE'}
              </button>
            </div>

            {insights && insights.content ? (
              <div style={{
                background: theme.bgCard,
                border: `1px solid ${theme.borderLight}`,
                padding: '16px',
              }}>
                <div style={{
                  fontSize: '9px',
                  letterSpacing: '1px',
                  color: theme.accent,
                  textTransform: 'uppercase',
                  marginBottom: '10px',
                }}>
                  Latest Insight
                </div>
                <p style={{
                  fontSize: '12px',
                  color: theme.text,
                  lineHeight: '1.6',
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                }}>
                  {insights.content}
                </p>
              </div>
            ) : (
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
                  Click GENERATE to create AI insights
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LifeTracker;