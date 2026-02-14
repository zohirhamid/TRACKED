import React, { useEffect, useRef, useState } from 'react';

const UserMenu = ({ theme, onLogout, onOpenPlaceholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target)) setIsOpen(false);
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const itemStyle = {
    width: '100%',
    textAlign: 'left',
    background: 'transparent',
    border: 'none',
    color: theme.text,
    padding: '10px 12px',
    cursor: 'pointer',
    fontSize: '11px',
    letterSpacing: '0.5px',
    fontFamily: 'inherit',
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(v => !v)}
        style={{
          background: isOpen ? theme.accentBgStrong : 'transparent',
          border: `1px solid ${isOpen ? theme.accent : theme.borderLight}`,
          color: isOpen ? theme.accent : theme.textDim,
          padding: '8px 12px',
          cursor: 'pointer',
          fontSize: '12px',
          transition: 'all 0.15s ease',
          borderRadius: '10px',
          lineHeight: 1,
        }}
        aria-label="User menu"
        title="Account"
      >
        👤
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '44px',
            right: 0,
            minWidth: '190px',
            background: theme.bgAlt,
            border: `1px solid ${theme.border}`,
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.35)',
            zIndex: 1200,
          }}
          role="menu"
          aria-label="Account menu"
        >
          <button
            onClick={() => {
              onOpenPlaceholder?.('Settings');
              setIsOpen(false);
            }}
            style={itemStyle}
            role="menuitem"
          >
            Settings
          </button>
          <button
            onClick={() => {
              onOpenPlaceholder?.('Profile');
              setIsOpen(false);
            }}
            style={itemStyle}
            role="menuitem"
          >
            Profile
          </button>
          <button
            onClick={() => {
              onOpenPlaceholder?.('Subscriptions');
              setIsOpen(false);
            }}
            style={itemStyle}
            role="menuitem"
          >
            Subscriptions
          </button>

          <div style={{ height: '1px', background: theme.border }} />

          <button
            onClick={() => {
              setIsOpen(false);
              onLogout?.();
            }}
            style={{
              ...itemStyle,
              color: theme.textMuted,
            }}
            role="menuitem"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;

