import React, { useState, useEffect } from 'react';
import { trackerAPI, entryAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import AddTrackerModal from './AddTrackerModal';
import PlaceholderModal from './PlaceholderModal';
import TrackerCell from './TrackerCell';
import TrackerManager from './TrackerManager';
import InsightPanel from './InsightPanel';
import UserMenu from './UserMenu';

const LifeTracker = () => {
  const { logout } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCell, setSelectedCell] = useState(null);
  const [isDark, setIsDark] = useState(true);
  const [showInsights, setShowInsights] = useState(true);
  const [placeholderModalTitle, setPlaceholderModalTitle] = useState(null);
  
  // Data from backend
  const [trackers, setTrackers] = useState([]);
  const [monthData, setMonthData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showManagerModal, setShowManagerModal] = useState(false);

  // Load month data
  useEffect(() => {
    loadMonthData();
  }, [currentDate]);

  const loadMonthData = async () => {
    setIsLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const data = await trackerAPI.getMonthView(year, month);
      
      setMonthData(data);
      setTrackers(data.trackers || []);
      
    } catch (error) {
      console.error('Failed to load month data:', error);
    } finally {
      setIsLoading(false);
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
      const tracker = trackers.find(t => t.id === trackerId);
      if (!tracker) return;

      const entryData = {
        tracker_id: trackerId,
        date: dateStr,
      };

      const isEmptyPrayerValues = tracker.tracker_type === 'prayer'
        && value
        && typeof value === 'object'
        && !Array.isArray(value)
        && Object.values(value).every(v => v === null || v === undefined);

      if (!value || value === '' || isEmptyPrayerValues) {
        entryData.delete_entry = true;
      } else {
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
          case 'prayer':
            entryData.prayer_values = value;
            break;
        }
      }

      await entryAPI.saveEntry(entryData);
      await loadMonthData();
    } catch (error) {
      console.error('Failed to update entry:', error);
    }
  };

  const getCellValue = (trackerId, day) => {
    if (!monthData || !monthData.weeks) return '';
    
    const tracker = trackers.find(t => t.id === trackerId);
    if (!tracker) return '';
    
    for (const week of monthData.weeks) {
      const dayData = week.find(d => d.day === day);
      if (dayData && dayData.entries && dayData.entries[trackerId]) {
        const entry = dayData.entries[trackerId];
        
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
          case 'prayer':
            return entry.prayer_values || null;
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

  const theme = isDark ? {
    bg: '#1a1a1a',
    bgAlt: '#222222',
    bgCard: '#252525',
    text: '#e0e0e0',
    textMuted: '#999',
    textDim: '#666',
    textDimmer: '#444',
    textDimmest: '#333',
    border: '#2a2a2a',
    borderLight: '#242424',
    accent: '#eab308',
    accentBg: 'rgba(234, 179, 8, 0.06)',
    accentBgStrong: 'rgba(234, 179, 8, 0.1)',
    weekendText: '#444',
    weekendDayName: '#383838',
    hoverBorder: '#555',
    hoverText: '#fff',
    inputPlaceholder: '#333',
  } : {
    bg: '#fafafa',
    bgAlt: '#f5f5f0',
    bgCard: '#f0f0f0',
    text: '#2a2a2a',
    textMuted: '#666',
    textDim: '#888',
    textDimmer: '#aaa',
    textDimmest: '#ccc',
    border: '#d0d0d0',
    borderLight: '#e0e0e0',
    accent: '#ca8a04',
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

      <PlaceholderModal
        isOpen={Boolean(placeholderModalTitle)}
        onClose={() => setPlaceholderModalTitle(null)}
        title={placeholderModalTitle || ''}
        description="working on it 🛠️"
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
                  fontFamily: 'inherit',
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
                →
              </button>
              <div style={{ marginLeft: '8px' }}>
                <UserMenu
                  theme={theme}
                  onLogout={logout}
                  onOpenPlaceholder={(title) => setPlaceholderModalTitle(title)}
                />
              </div>
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
                    let cellWidth = '65px';
                    if (tracker.tracker_type === 'text') {
                      cellWidth = '140px';
                    } else if (tracker.tracker_type === 'rating') {
                      cellWidth = '85px';
                    } else if (tracker.tracker_type === 'duration') {
                      cellWidth = '75px';
                    } else if (tracker.tracker_type === 'time') {
                      cellWidth = '70px';
                    } else if (tracker.tracker_type === 'prayer') {
                      cellWidth = '150px';
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
          <InsightPanel
            theme={theme}
            monthData={monthData}
            trackers={trackers}
            currentDate={currentDate}
          />
        )}
      </div>
    </div>
  );
};

export default LifeTracker;
