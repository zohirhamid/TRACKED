import React, { useState } from 'react';
import { trackerAPI } from '../services/api';

const TrackerManager = ({ isOpen, onClose, trackers, onUpdate, theme }) => {
  const [localTrackers, setLocalTrackers] = useState([...trackers].sort((a, b) => a.display_order - b.display_order));
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newTrackers = [...localTrackers];
    const draggedItem = newTrackers[draggedIndex];
    
    // Remove from old position
    newTrackers.splice(draggedIndex, 1);
    // Insert at new position
    newTrackers.splice(index, 0, draggedItem);
    
    setLocalTrackers(newTrackers);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const saveOrder = async () => {
    setSaving(true);
    try {
      // Update display_order for each tracker
      for (let i = 0; i < localTrackers.length; i++) {
        const tracker = localTrackers[i];
        if (tracker.display_order !== i + 1) {
          await trackerAPI.updateTracker(tracker.id, {
            ...tracker,
            display_order: i + 1,
          });
        }
      }
      await onUpdate();
      onClose();
    } catch (error) {
      console.error('Failed to save tracker order:', error);
      alert('Failed to save order');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (trackerId) => {
    if (!confirm('Are you sure you want to delete this tracker?')) return;
    
    try {
      await trackerAPI.deleteTracker(trackerId);
      setLocalTrackers(localTrackers.filter(t => t.id !== trackerId));
      await onUpdate();
    } catch (error) {
      console.error('Failed to delete tracker:', error);
    }
  };

  const toggleActive = async (tracker) => {
    try {
      await trackerAPI.updateTracker(tracker.id, {
        ...tracker,
        is_active: !tracker.is_active,
      });
      setLocalTrackers(localTrackers.map(t => 
        t.id === tracker.id ? { ...t, is_active: !t.is_active } : t
      ));
      await onUpdate();
    } catch (error) {
      console.error('Failed to toggle tracker:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div
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
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={onClose}
    >
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
        <div
          style={{
            padding: '24px',
            borderBottom: `1px solid ${theme.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h2
              style={{
                fontSize: '18px',
                fontWeight: '400',
                margin: 0,
                color: theme.text,
              }}
            >
              Manage Trackers
            </h2>
            <div
              style={{
                fontSize: '10px',
                color: theme.textMuted,
                marginTop: '4px',
              }}
            >
              Drag to reorder, click to toggle active/inactive
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

        {/* Tracker List */}
        <div style={{ padding: '16px' }}>
          {localTrackers.length === 0 ? (
            <div
              style={{
                padding: '40px',
                textAlign: 'center',
                color: theme.textMuted,
                fontSize: '12px',
              }}
            >
              No trackers yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {localTrackers.map((tracker, index) => (
                <div
                  key={tracker.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  style={{
                    background: tracker.is_active ? theme.bgCard : theme.borderLight,
                    border: `1px solid ${draggedIndex === index ? theme.accent : theme.borderLight}`,
                    padding: '16px',
                    cursor: 'grab',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    opacity: tracker.is_active ? 1 : 0.5,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                    <span
                      style={{
                        color: theme.textDim,
                        fontSize: '16px',
                        cursor: 'grab',
                      }}
                    >
                      ⋮⋮
                    </span>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: '14px',
                          color: theme.text,
                          marginBottom: '4px',
                        }}
                      >
                        {tracker.name}
                        {tracker.unit && (
                          <span
                            style={{
                              fontSize: '11px',
                              color: theme.textMuted,
                              marginLeft: '8px',
                            }}
                          >
                            ({tracker.unit})
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: '10px',
                          color: theme.textMuted,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        {tracker.tracker_type}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      onClick={() => toggleActive(tracker)}
                      style={{
                        background: 'transparent',
                        border: `1px solid ${theme.borderLight}`,
                        color: tracker.is_active ? theme.accent : theme.textMuted,
                        padding: '6px 12px',
                        cursor: 'pointer',
                        fontSize: '9px',
                        letterSpacing: '1px',
                        fontFamily: 'inherit',
                      }}
                    >
                      {tracker.is_active ? 'ACTIVE' : 'HIDDEN'}
                    </button>
                    <button
                      onClick={() => handleDelete(tracker.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: theme.textDim,
                        cursor: 'pointer',
                        fontSize: '18px',
                        padding: '4px 8px',
                      }}
                      title="Delete tracker"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: `1px solid ${theme.border}`,
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
          }}
        >
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: `1px solid ${theme.borderLight}`,
              color: theme.textMuted,
              padding: '10px 20px',
              cursor: 'pointer',
              fontSize: '10px',
              letterSpacing: '1px',
              fontFamily: 'inherit',
            }}
          >
            CANCEL
          </button>
          <button
            onClick={saveOrder}
            disabled={saving}
            style={{
              background: theme.accent,
              border: 'none',
              color: '#000',
              padding: '10px 20px',
              cursor: saving ? 'default' : 'pointer',
              fontSize: '10px',
              letterSpacing: '1px',
              fontFamily: 'inherit',
              fontWeight: '500',
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? 'SAVING...' : 'SAVE ORDER'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrackerManager;