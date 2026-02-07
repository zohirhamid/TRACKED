import React, { useState } from 'react';

const AddTrackerModal = ({ isOpen, onClose, onAdd, suggestedTrackers, theme }) => {
  const [mode, setMode] = useState('suggested'); // 'suggested' or 'custom'
  const [formData, setFormData] = useState({
    name: '',
    tracker_type: 'binary',
    unit: '',
    description: '',
  });

  const trackerTypes = [
    { value: 'binary', label: 'Yes/No', description: 'Simple checkbox (e.g., Did you meditate?)' },
    { value: 'number', label: 'Number', description: 'Numeric value (e.g., Steps: 10000)' },
    { value: 'rating', label: 'Rating', description: 'Scale of 1-5 (e.g., Mood: 4/5)' },
    { value: 'duration', label: 'Duration', description: 'Time in minutes (e.g., Exercise: 45 min)' },
    { value: 'time', label: 'Time', description: 'Specific time (e.g., Wake up: 7:00 AM)' },
    { value: 'text', label: 'Text', description: 'Short note (e.g., Journal entry)' },
  ];

  const handleQuickAdd = async (slug) => {
    await onAdd({ type: 'quick', slug });
    onClose();
  };

  const handleCustomAdd = async () => {
    if (!formData.name.trim()) return;
    
    await onAdd({ 
      type: 'custom', 
      data: {
        name: formData.name,
        tracker_type: formData.tracker_type,
        unit: formData.unit || null,
        description: formData.description || null,
      }
    });
    
    // Reset form
    setFormData({
      name: '',
      tracker_type: 'binary',
      unit: '',
      description: '',
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
    }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: theme.bg,
          border: `1px solid ${theme.border}`,
          width: '100%',
          maxWidth: '600px',
          maxHeight: '90vh',
          overflowY: 'auto',
          fontFamily: 'inherit',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: `1px solid ${theme.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <h2 style={{
              fontSize: '18px',
              fontWeight: '400',
              margin: 0,
              color: theme.text,
            }}>
              Add Tracker
            </h2>
            <div style={{
              fontSize: '10px',
              color: theme.textMuted,
              marginTop: '4px',
            }}>
              Choose a suggested tracker or create your own
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: theme.textMuted,
              fontSize: '24px',
              cursor: 'pointer',
              padding: '0',
              width: '32px',
              height: '32px',
            }}
          >
            ×
          </button>
        </div>

        {/* Mode Toggle */}
        <div style={{
          padding: '20px 24px',
          borderBottom: `1px solid ${theme.border}`,
          display: 'flex',
          gap: '8px',
        }}>
          <button
            onClick={() => setMode('suggested')}
            style={{
              flex: 1,
              background: mode === 'suggested' ? theme.accentBgStrong : 'transparent',
              border: `1px solid ${mode === 'suggested' ? theme.accent : theme.borderLight}`,
              color: mode === 'suggested' ? theme.accent : theme.textMuted,
              padding: '10px',
              fontSize: '10px',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Suggested
          </button>
          <button
            onClick={() => setMode('custom')}
            style={{
              flex: 1,
              background: mode === 'custom' ? theme.accentBgStrong : 'transparent',
              border: `1px solid ${mode === 'custom' ? theme.accent : theme.borderLight}`,
              color: mode === 'custom' ? theme.accent : theme.textMuted,
              padding: '10px',
              fontSize: '10px',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Custom
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {mode === 'suggested' ? (
            <div style={{ display: 'grid', gap: '12px' }}>
              {suggestedTrackers && suggestedTrackers.length > 0 ? (
                suggestedTrackers.map((tracker) => (
                  <button
                    key={tracker.slug}
                    onClick={() => handleQuickAdd(tracker.slug)}
                    style={{
                      background: theme.bgCard,
                      border: `1px solid ${theme.borderLight}`,
                      padding: '16px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = theme.accent;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = theme.borderLight;
                    }}
                  >
                    <div>
                      <div style={{
                        fontSize: '14px',
                        color: theme.text,
                        marginBottom: '4px',
                      }}>
                        {tracker.name}
                      </div>
                      {tracker.description && (
                        <div style={{
                          fontSize: '11px',
                          color: theme.textMuted,
                        }}>
                          {tracker.description}
                        </div>
                      )}
                    </div>
                    <div style={{
                      fontSize: '10px',
                      color: theme.textMuted,
                      background: theme.accentBg,
                      padding: '4px 8px',
                    }}>
                      {tracker.tracker_type}
                    </div>
                  </button>
                ))
              ) : (
                <div style={{
                  padding: '40px',
                  textAlign: 'center',
                  color: theme.textMuted,
                  fontSize: '12px',
                }}>
                  No suggested trackers available
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Tracker Name */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '10px',
                  letterSpacing: '1px',
                  color: theme.textMuted,
                  textTransform: 'uppercase',
                  marginBottom: '8px',
                }}>
                  Tracker Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Sleep, Exercise, Water"
                  style={{
                    width: '100%',
                    background: theme.bgCard,
                    border: `1px solid ${theme.borderLight}`,
                    color: theme.text,
                    padding: '12px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Tracker Type */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '10px',
                  letterSpacing: '1px',
                  color: theme.textMuted,
                  textTransform: 'uppercase',
                  marginBottom: '8px',
                }}>
                  Type *
                </label>
                <div style={{ display: 'grid', gap: '8px' }}>
                  {trackerTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, tracker_type: type.value })}
                      style={{
                        background: formData.tracker_type === type.value ? theme.accentBg : theme.bgCard,
                        border: `1px solid ${formData.tracker_type === type.value ? theme.accent : theme.borderLight}`,
                        padding: '12px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{
                        fontSize: '12px',
                        color: formData.tracker_type === type.value ? theme.accent : theme.text,
                        marginBottom: '2px',
                        fontWeight: '500',
                      }}>
                        {type.label}
                      </div>
                      <div style={{
                        fontSize: '10px',
                        color: theme.textMuted,
                      }}>
                        {type.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Unit (optional) */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '10px',
                  letterSpacing: '1px',
                  color: theme.textMuted,
                  textTransform: 'uppercase',
                  marginBottom: '8px',
                }}>
                  Unit (Optional)
                </label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="e.g., hrs, min, L, steps"
                  style={{
                    width: '100%',
                    background: theme.bgCard,
                    border: `1px solid ${theme.borderLight}`,
                    color: theme.text,
                    padding: '12px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Description (optional) */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '10px',
                  letterSpacing: '1px',
                  color: theme.textMuted,
                  textTransform: 'uppercase',
                  marginBottom: '8px',
                }}>
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Add a short description..."
                  rows={3}
                  style={{
                    width: '100%',
                    background: theme.bgCard,
                    border: `1px solid ${theme.borderLight}`,
                    color: theme.text,
                    padding: '12px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={handleCustomAdd}
                disabled={!formData.name.trim()}
                style={{
                  width: '100%',
                  background: formData.name.trim() ? theme.accent : theme.bgCard,
                  border: 'none',
                  color: formData.name.trim() ? '#000' : theme.textMuted,
                  padding: '14px',
                  fontSize: '10px',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  cursor: formData.name.trim() ? 'pointer' : 'not-allowed',
                  fontFamily: 'inherit',
                  fontWeight: '500',
                }}
              >
                Add Tracker
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddTrackerModal;