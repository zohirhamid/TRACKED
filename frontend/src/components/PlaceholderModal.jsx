import React, { useEffect } from 'react';

const PlaceholderModal = ({ isOpen, onClose, title, description, theme, kicker = 'Coming soon' }) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '16px',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          background: theme?.bgAlt || '#222',
          width: '100%',
          maxWidth: '520px',
          borderRadius: '10px',
          border: `1px solid ${theme?.border || '#333'}`,
          fontFamily: 'inherit',
          overflow: 'hidden',
        }}
      >
        <div style={{
          padding: '18px 18px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '12px',
          borderBottom: `1px solid ${theme?.border || '#333'}`,
        }}>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: '10px',
              letterSpacing: '3px',
              textTransform: 'uppercase',
              color: theme?.textDim || '#777',
              marginBottom: '6px',
            }}>
              {kicker}
            </div>
            <h2 style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: 500,
              color: theme?.text || '#eee',
            }}>
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: `1px solid ${theme?.borderLight || theme?.border || '#333'}`,
              color: theme?.textDim || '#777',
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
            aria-label="Close"
            title="Close"
          >
            ✕
          </button>
        </div>

        <div style={{ padding: '18px' }}>
          <div style={{
            color: theme?.textMuted || '#999',
            fontSize: '12px',
            lineHeight: 1.6,
          }}>
            {description || 'This section is a frontend placeholder for now.'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaceholderModal;
