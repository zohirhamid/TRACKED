import React, { useState, useEffect } from 'react';

const TrackerCell = ({ 
  tracker, 
  day, 
  value, 
  isSelected, 
  onValueChange, 
  onFocus, 
  onBlur,
  theme,
  isDark 
}) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (newValue) => {
    setLocalValue(newValue);
    onValueChange(newValue);
  };

  const prayerOptions = [
    { key: 'fajr', label: 'Fajr', short: 'F' },
    { key: 'dhuhr', label: 'Dhuhr', short: 'D' },
    { key: 'asr', label: 'Asr', short: 'A' },
    { key: 'maghrib', label: 'Maghrib', short: 'M' },
    { key: 'isha', label: 'Isha', short: 'I' },
  ];

  const normalizePrayerValues = (val) => {
    if (!val) return {};
    if (typeof val === 'object') return val;
    if (typeof val === 'string') {
      try {
        return JSON.parse(val);
      } catch (error) {
        return {};
      }
    }
    return {};
  };

  // Binary (check/x icons)
  if (tracker.tracker_type === 'binary') {
    const isChecked = localValue === 'true' || localValue === true;
    
    return (
      <div
        style={{
          width: '100%',
          height: '38px',
          background: isSelected ? theme.accentBgStrong : 'transparent',
          borderTop: `1px solid ${isSelected ? theme.accent : 'transparent'}`,
          borderBottom: `1px solid ${isSelected ? theme.accent : 'transparent'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.1s ease',
        }}
        onClick={() => {
          // Toggle: empty -> true -> false -> empty
          let newVal = '';
          if (localValue === '' || localValue === null || localValue === undefined) {
            newVal = 'true';
          } else if (localValue === 'true' || localValue === true) {
            newVal = 'false';
          } else {
            newVal = '';
          }
          handleChange(newVal);
        }}
        onFocus={onFocus}
        onBlur={onBlur}
        tabIndex={0}
      >
        {localValue === 'true' || localValue === true ? (
          <span style={{ color: '#22c55e', fontSize: '18px', fontWeight: 'bold' }}>✓</span>
        ) : localValue === 'false' || localValue === false ? (
          <span style={{ color: '#ef4444', fontSize: '18px', fontWeight: 'bold' }}>✗</span>
        ) : (
          <span style={{ color: theme.textDimmest, fontSize: '12px' }}>·</span>
        )}
      </div>
    );
  }

  // Prayer (5 daily prayers with on/off)
  if (tracker.tracker_type === 'prayer') {
    const prayerValues = normalizePrayerValues(localValue);

    const togglePrayer = (key) => {
      const current = prayerValues[key];
      let next;
      if (current === true) {
        next = false;
      } else if (current === false) {
        next = null;
      } else {
        next = true;
      }

      const updated = { ...prayerValues, [key]: next };
      const allEmpty = prayerOptions.every((option) => updated[option.key] === null || updated[option.key] === undefined);
      handleChange(allEmpty ? '' : updated);
    };

    const renderStateIcon = (state) => {
      if (state === true) {
        return <span style={{ color: '#22c55e', fontSize: '12px', fontWeight: 'bold' }}>✓</span>;
      }
      if (state === false) {
        return <span style={{ color: '#ef4444', fontSize: '12px', fontWeight: 'bold' }}>✗</span>;
      }
      return <span style={{ color: theme.textDimmest, fontSize: '10px' }}>·</span>;
    };

    return (
      <div
        style={{
          width: '100%',
          height: '38px',
          background: isSelected ? theme.accentBgStrong : 'transparent',
          borderTop: `1px solid ${isSelected ? theme.accent : 'transparent'}`,
          borderBottom: `1px solid ${isSelected ? theme.accent : 'transparent'}`,
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '4px',
          alignItems: 'center',
          padding: '0 6px',
          transition: 'all 0.1s ease',
        }}
        onFocus={onFocus}
        onBlur={onBlur}
        tabIndex={0}
      >
        {prayerOptions.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => {
              onFocus();
              togglePrayer(option.key);
            }}
            title={option.label}
            style={{
              background: 'transparent',
              border: `1px solid ${theme.borderLight}`,
              borderRadius: '4px',
              padding: '2px 0',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              transition: 'all 0.1s ease',
            }}
          >
            <span style={{ fontSize: '8px', color: theme.textDimmer, letterSpacing: '0.5px' }}>
              {option.short}
            </span>
            {renderStateIcon(prayerValues[option.key])}
          </button>
        ))}
      </div>
    );
  }

  // Rating (1-5 stars)
  if (tracker.tracker_type === 'rating') {
    return (
      <div
        style={{
          width: '100%',
          height: '38px',
          background: isSelected ? theme.accentBgStrong : 'transparent',
          borderTop: `1px solid ${isSelected ? theme.accent : 'transparent'}`,
          borderBottom: `1px solid ${isSelected ? theme.accent : 'transparent'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '2px',
          transition: 'all 0.1s ease',
        }}
        onFocus={onFocus}
        onBlur={onBlur}
        tabIndex={0}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            onClick={() => handleChange(star.toString())}
            style={{
              cursor: 'pointer',
              fontSize: '14px',
              color: parseInt(localValue) >= star ? theme.accent : theme.textDimmest,
              transition: 'color 0.1s ease',
            }}
          >
            ★
          </span>
        ))}
      </div>
    );
  }

  // Number input
  if (tracker.tracker_type === 'number') {
    return (
      <input
        type="number"
        step="0.1"
        value={localValue || ''}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={(e) => {
          handleChange(e.target.value);
          onBlur();
        }}
        onFocus={onFocus}
        style={{
          width: '100%',
          height: '38px',
          background: isSelected ? theme.accentBgStrong : 'transparent',
          border: 'none',
          borderTop: `1px solid ${isSelected ? theme.accent : 'transparent'}`,
          borderBottom: `1px solid ${isSelected ? theme.accent : 'transparent'}`,
          color: localValue ? (isDark ? '#fff' : '#000') : theme.textDimmest,
          textAlign: 'center',
          fontSize: '12px',
          fontFamily: 'inherit',
          padding: '0 8px',
          transition: 'all 0.1s ease',
        }}
        placeholder="·"
      />
    );
  }

  // Duration (hours + minutes in popup)
  if (tracker.tracker_type === 'duration') {
    // Parse the stored minutes into hours and minutes
    const totalMinutes = parseInt(localValue) || 0;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const [showPopup, setShowPopup] = useState(false);
    const [hoursInput, setHoursInput] = useState(hours.toString());
    const [minutesInput, setMinutesInput] = useState(minutes.toString());

    const saveDuration = () => {
      const h = parseInt(hoursInput) || 0;
      const m = parseInt(minutesInput) || 0;
      const total = h * 60 + m;
      handleChange(total > 0 ? total.toString() : '');
      setShowPopup(false);
    };

    const handleClickOutside = (e) => {
      if (showPopup && !e.target.closest('.duration-popup')) {
        saveDuration();
      }
    };

    React.useEffect(() => {
      if (showPopup) {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }
    }, [showPopup, hoursInput, minutesInput]);

    return (
      <div style={{ position: 'relative' }}>
        <div
          onClick={() => {
            setHoursInput(hours.toString());
            setMinutesInput(minutes.toString());
            setShowPopup(true);
            onFocus();
          }}
          onBlur={onBlur}
          tabIndex={0}
          style={{
            width: '100%',
            height: '38px',
            background: isSelected ? theme.accentBgStrong : 'transparent',
            borderTop: `1px solid ${isSelected ? theme.accent : 'transparent'}`,
            borderBottom: `1px solid ${isSelected ? theme.accent : 'transparent'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '12px',
            color: totalMinutes > 0 ? (isDark ? '#fff' : '#000') : theme.textDimmest,
            transition: 'all 0.1s ease',
          }}
        >
          {totalMinutes > 0 ? (
            <>
              {hours > 0 && <span>{hours}h </span>}
              {minutes > 0 && <span>{minutes}m</span>}
              {totalMinutes === 0 && '·'}
            </>
          ) : '·'}
        </div>

        {showPopup && (
          <div
            className="duration-popup"
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              marginTop: '4px',
              background: theme.bgCard,
              border: `1px solid ${theme.accent}`,
              padding: '12px',
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              minWidth: '140px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                <label style={{ fontSize: '9px', color: theme.textMuted, textTransform: 'uppercase' }}>
                  Hours
                </label>
                <input
                  type="number"
                  min="0"
                  value={hoursInput}
                  onChange={(e) => setHoursInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveDuration();
                    if (e.key === 'Escape') setShowPopup(false);
                  }}
                  autoFocus
                  style={{
                    width: '100%',
                    background: theme.bg,
                    border: `1px solid ${theme.borderLight}`,
                    color: isDark ? '#fff' : '#000',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    textAlign: 'center',
                    padding: '6px',
                  }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                <label style={{ fontSize: '9px', color: theme.textMuted, textTransform: 'uppercase' }}>
                  Minutes
                </label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={minutesInput}
                  onChange={(e) => setMinutesInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveDuration();
                    if (e.key === 'Escape') setShowPopup(false);
                  }}
                  style={{
                    width: '100%',
                    background: theme.bg,
                    border: `1px solid ${theme.borderLight}`,
                    color: isDark ? '#fff' : '#000',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    textAlign: 'center',
                    padding: '6px',
                  }}
                />
              </div>
            </div>
            <button
              onClick={saveDuration}
              style={{
                background: theme.accent,
                border: 'none',
                color: '#000',
                padding: '6px',
                fontSize: '9px',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontWeight: '500',
              }}
            >
              Save
            </button>
          </div>
        )}
      </div>
    );
  }

  // Time picker (click anywhere to open, HH:MM only)
  if (tracker.tracker_type === 'time') {
    const inputRef = React.useRef(null);
    
    // Format time to show only HH:MM (remove seconds)
    const formatTime = (timeStr) => {
      if (!timeStr) return '';
      return timeStr.substring(0, 5); // "HH:MM:SS" -> "HH:MM"
    };

    return (
      <div
        onClick={() => inputRef.current?.showPicker?.()}
        style={{
          width: '100%',
          height: '38px',
          background: isSelected ? theme.accentBgStrong : 'transparent',
          borderTop: `1px solid ${isSelected ? theme.accent : 'transparent'}`,
          borderBottom: `1px solid ${isSelected ? theme.accent : 'transparent'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          position: 'relative',
        }}
      >
        <input
          ref={inputRef}
          type="time"
          value={localValue || ''}
          onChange={(e) => {
            const formatted = formatTime(e.target.value);
            setLocalValue(formatted);
          }}
          onBlur={(e) => {
            const formatted = formatTime(e.target.value);
            handleChange(formatted);
            onBlur();
          }}
          onFocus={onFocus}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            opacity: 0,
            cursor: 'pointer',
          }}
        />
        <span style={{
          fontSize: '12px',
          color: localValue ? (isDark ? '#fff' : '#000') : theme.textDimmest,
          pointerEvents: 'none',
        }}>
          {formatTime(localValue) || '·'}
        </span>
      </div>
    );
  }

  // Text (default)
  return (
    <input
      type="text"
      value={localValue || ''}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={(e) => {
        handleChange(e.target.value);
        onBlur();
      }}
      onFocus={onFocus}
      style={{
        width: '100%',
        height: '38px',
        background: isSelected ? theme.accentBgStrong : 'transparent',
        border: 'none',
        borderTop: `1px solid ${isSelected ? theme.accent : 'transparent'}`,
        borderBottom: `1px solid ${isSelected ? theme.accent : 'transparent'}`,
        color: localValue ? (isDark ? '#fff' : '#000') : theme.textDimmest,
        textAlign: 'center',
        fontSize: '12px',
        fontFamily: 'inherit',
        padding: '0 8px',
        transition: 'all  0.1s ease',
      }}
      placeholder="·"
    />
  );
};

export default TrackerCell;
