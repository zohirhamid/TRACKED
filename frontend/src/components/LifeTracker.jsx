import React, { useState, useEffect } from 'react';
import { trackerAPI, entryAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { useHotkeys } from '../hooks/useHotkeys';
import AddTrackerModal from './AddTrackerModal';
import PlaceholderModal from './PlaceholderModal';
import TrackerCell from './TrackerCell';
import TrackerManager from './TrackerManager';
import InsightPanel from './InsightPanel';
import UserMenu from './UserMenu';

const LifeTracker = () => {
  const { logout } = useAuth();
  const { isDark, theme, toggle } = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCell, setSelectedCell] = useState(null);
  const [showInsights, setShowInsights] = useState(true);
  const [placeholderModalTitle, setPlaceholderModalTitle] = useState(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  
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

  const getCellValueFromEntry = (tracker, entry) => {
    if (!entry) return '';
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
  };

  const hasEntryData = (entry, trackerType) => {
    if (!entry) return false;
    switch (trackerType) {
      case 'binary':
        return entry.binary_value !== null && entry.binary_value !== undefined;
      case 'number':
        return entry.number_value !== null && entry.number_value !== undefined;
      case 'rating':
        return entry.rating_value !== null && entry.rating_value !== undefined;
      case 'duration':
        return entry.duration_minutes !== null && entry.duration_minutes !== undefined;
      case 'time':
        return entry.time_value !== null && entry.time_value !== undefined && String(entry.time_value).trim() !== '';
      case 'text':
        return entry.text_value !== null && entry.text_value !== undefined && String(entry.text_value).trim() !== '';
      case 'prayer': {
        const val = entry.prayer_values;
        if (!val) return false;
        if (typeof val === 'object' && !Array.isArray(val)) {
          return Object.values(val).some(v => v !== null && v !== undefined && v !== '');
        }
        if (typeof val === 'string') {
          try {
            const parsed = JSON.parse(val);
            if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return false;
            return Object.values(parsed).some(v => v !== null && v !== undefined && v !== '');
          } catch (e) {
            return false;
          }
        }
        return false;
      }
      default:
        return false;
    }
  };

  const formatAvg = (value) => {
    if (value === null || value === undefined || Number.isNaN(value)) return '—';
    const rounded = Math.round(value * 10) / 10;
    return Number.isInteger(rounded) ? `${rounded}` : `${rounded.toFixed(1)}`;
  };

  const formatDurationMinutes = (totalMinutes) => {
    const minutes = parseInt(totalMinutes, 10) || 0;
    if (minutes <= 0) return '—';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h`;
    return `${mins}m`;
  };

  const normalizePrayerValues = (val) => {
    if (!val) return null;
    if (typeof val === 'object' && !Array.isArray(val)) return val;
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  const computePeriodStat = (tracker, periodDays) => {
    const days = Array.isArray(periodDays) ? periodDays : [];
    const totalDays = days.length;
    if (totalDays === 0) return '—';

    if (tracker.tracker_type === 'binary') {
      let countTrue = 0;
      for (const dayData of days) {
        const entry = dayData?.entries?.[tracker.id];
        if (entry?.binary_value === true) countTrue += 1;
      }
      return `${countTrue}/${totalDays}`;
    }

    if (tracker.tracker_type === 'duration') {
      let totalMinutes = 0;
      for (const dayData of days) {
        const entry = dayData?.entries?.[tracker.id];
        if (entry?.duration_minutes !== null && entry?.duration_minutes !== undefined) {
          totalMinutes += parseInt(entry.duration_minutes, 10) || 0;
        }
      }
      return formatDurationMinutes(totalMinutes);
    }

    if (tracker.tracker_type === 'number') {
      let sum = 0;
      let count = 0;
      for (const dayData of days) {
        const entry = dayData?.entries?.[tracker.id];
        if (entry?.number_value !== null && entry?.number_value !== undefined) {
          sum += parseFloat(entry.number_value);
          count += 1;
        }
      }
      if (count === 0) return '—';
      return `${formatAvg(sum / count)}`;
    }

    if (tracker.tracker_type === 'rating') {
      let sum = 0;
      let count = 0;
      for (const dayData of days) {
        const entry = dayData?.entries?.[tracker.id];
        if (entry?.rating_value !== null && entry?.rating_value !== undefined) {
          sum += parseInt(entry.rating_value, 10);
          count += 1;
        }
      }
      if (count === 0) return '—';
      return `${formatAvg(sum / count)}`;
    }

    if (tracker.tracker_type === 'prayer') {
      let done = 0;
      for (const dayData of days) {
        const entry = dayData?.entries?.[tracker.id];
        const values = normalizePrayerValues(entry?.prayer_values);
        if (!values) continue;
        done += Object.values(values).filter(v => v === true).length;
      }
      const possible = totalDays * 5;
      return `${done}/${possible}`;
    }

    // time/text/other: coverage
    let filled = 0;
    for (const dayData of days) {
      const entry = dayData?.entries?.[tracker.id];
      if (hasEntryData(entry, tracker.tracker_type)) filled += 1;
    }
    return `${filled}/${totalDays}`;
  };

  useHotkeys({
    t: () => toggle(),
    i: () => setShowInsights(v => !v),
    a: () => setShowAddModal(true),
    m: () => setShowManagerModal(true),
    g: () => setCurrentDate(new Date()),
    'shift+?': () => setShowShortcuts(true),
    escape: () => setShowShortcuts(false),
  });

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
      padding: '16px 32px 32px',
      boxSizing: 'border-box',
      transition: 'background-color 0.2s ease, color 0.2s ease',
    }}>
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

      <PlaceholderModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
        title="Keyboard shortcuts"
        kicker="Keyboard"
        description={(
          <div style={{ display: 'grid', gap: '10px' }}>
            <div><span style={{ color: theme.textDim }}>T</span> — toggle theme</div>
            <div><span style={{ color: theme.textDim }}>I</span> — toggle insights</div>
            <div><span style={{ color: theme.textDim }}>A</span> — add tracker</div>
            <div><span style={{ color: theme.textDim }}>M</span> — manage trackers</div>
            <div><span style={{ color: theme.textDim }}>G</span> — jump to today</div>
            <div><span style={{ color: theme.textDim }}>Shift + ?</span> — open this panel</div>
            <div><span style={{ color: theme.textDim }}>Esc</span> — close</div>
          </div>
        )}
        theme={theme}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Header (sticky) */}
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backgroundColor: theme.bg,
          paddingTop: '8px',
          paddingBottom: '16px',
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
              onClick={toggle}
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

        <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
          {/* Main Grid */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              overflow: 'auto',
            }}>
              <table style={{
                width: '100%',
                border: `1px solid ${theme.border}`,
                borderCollapse: 'collapse',
              }}>
                <thead>
                  <tr>
                    <th style={{
                      width: '10px',
                      minWidth: '8px',
                      padding: '8px 8px',
                      textAlign: 'left',
                      fontSize: '10px',
                      fontWeight: '500',
                      color: theme.textDim,
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                      border: `1px solid ${theme.borderLight}`,
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
                            padding: '8px 8px',
                            textAlign: 'center',
                            border: `1px solid ${theme.borderLight}`,
                          }}
                        >
                          <div style={{
                            fontSize: '11px',
                            color: theme.text,
                            fontWeight: '700',
                        }}>
                          {tracker.name}
                        </div>
                      </th>
                    );
                  })}
                    <th
                    style={{
                      width: '45px',
                      minWidth: '45px',
                      padding: '8px 4px',
                      textAlign: 'center',
                      border: `1px solid ${theme.borderLight}`,
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
                  {(() => {
                    const weeks = monthData?.weeks || [];
                    const rows = [];
                    for (let weekIndex = 0; weekIndex < weeks.length; weekIndex += 1) {
                      const week = weeks[weekIndex] || [];
                      for (const dayData of week) {
                        rows.push({ type: 'day', dayData });
                      }
                      rows.push({ type: 'weekStats', weekIndex, days: week });
                    }
                    rows.push({ type: 'monthStats', days: weeks.flat() });

                    return rows.map((row) => {
                      if (row.type === 'day') {
                        const day = row.dayData.day;
                        return (
                          <tr
                            key={`day-${row.dayData.date}`}
                            style={{
                              backgroundColor: isToday(day)
                                ? theme.accentBg
                                : 'transparent',
                            }}
                          >
                            <td style={{
                              paddingLeft: '10px',
                              paddingRight: '2px',
                              height: '32px',
                              border: `1px solid ${theme.borderLight}`,
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
                                  fontSize: '9px',
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
                              const entry = row.dayData?.entries?.[tracker.id];
                              const value = getCellValueFromEntry(tracker, entry);
                              const isSelected = selectedCell === cellKey;
                              
                              return (
                                <td
                                  key={tracker.id}
                                  style={{
                                    padding: '0',
                                    border: `1px solid ${theme.borderLight}`,
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
                              border: `1px solid ${theme.borderLight}`,
                            }} />
                          </tr>
                        );
                      }

                      const isMonth = row.type === 'monthStats';
                      const label = isMonth ? 'MONTH' : `WEEK ${row.weekIndex + 1}`;
                      const statTopBorder = `2px solid ${theme.border}`;
                      const weekDividerBorder = `1px solid ${theme.border}`;
                      const statsRowHeight = '30px';
                      return (
                        <tr
                          key={isMonth ? 'month-stats' : `week-${row.weekIndex}`}
                          style={{}}
                        >
                          <td style={{
                            paddingLeft: '10px',
                            paddingRight: '2px',
                            height: statsRowHeight,
                            border: `1px solid ${theme.borderLight}`,
                            borderTop: isMonth ? statTopBorder : undefined,
                            borderBottom: !isMonth ? weekDividerBorder : undefined,
                            position: 'sticky',
                            left: 0,
                            backgroundColor: theme.bg,
                            zIndex: 5,
                          }}>
                            <div style={{
                              fontSize: '9px',
                              color: theme.textDimmer,
                              letterSpacing: '1.5px',
                              textTransform: 'uppercase',
                              fontWeight: '700',
                            }}>
                              {label}
                            </div>
                          </td>
                          {trackers.map((tracker) => (
                            <td
                              key={tracker.id}
                              style={{
                                border: `1px solid ${theme.borderLight}`,
                                borderTop: isMonth ? statTopBorder : undefined,
                                borderBottom: !isMonth ? weekDividerBorder : undefined,
                                padding: '0 6px',
                                textAlign: 'center',
                                height: statsRowHeight,
                              }}
                            >
                              <div style={{
                                fontSize: '9px',
                                color: theme.textDim,
                                fontWeight: '400',
                                whiteSpace: 'nowrap',
                              }}>
                                {computePeriodStat(tracker, row.days)}
                              </div>
                            </td>
                          ))}
                          <td style={{
                            border: `1px solid ${theme.borderLight}`,
                            borderTop: isMonth ? statTopBorder : undefined,
                            borderBottom: !isMonth ? weekDividerBorder : undefined,
                          }} />
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Insights */}
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
    </div>
  );
};

export default LifeTracker;
