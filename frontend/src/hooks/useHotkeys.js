import { useEffect } from 'react';

const isEditableTarget = (target) => {
  if (!target) return false;
  const tag = target.tagName;
  if (target.isContentEditable) return true;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
};

const normalizeKey = (event) => {
  const parts = [];
  if (event.ctrlKey) parts.push('ctrl');
  if (event.metaKey) parts.push('meta');
  if (event.altKey) parts.push('alt');
  if (event.shiftKey) parts.push('shift');
  parts.push((event.key || '').toLowerCase());
  return parts.join('+');
};

export const useHotkeys = (handlers, { enabled = true, allowInInputs = false } = {}) => {
  useEffect(() => {
    if (!enabled) return;
    if (!handlers) return;

    const onKeyDown = (e) => {
      if (!allowInInputs && isEditableTarget(e.target)) return;
      const combo = normalizeKey(e);
      const handler = handlers[combo];
      if (!handler) return;
      e.preventDefault();
      handler(e);
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [allowInInputs, enabled, handlers]);
};

