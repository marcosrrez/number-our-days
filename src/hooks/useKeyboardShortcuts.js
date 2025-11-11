import { useEffect } from 'react';

/**
 * Custom hook for keyboard shortcuts
 * @param {Object} shortcuts - Map of key combinations to handlers
 * @param {Array} dependencies - Dependencies for the effect
 *
 * Example:
 * useKeyboardShortcuts({
 *   'cmd+k': () => openSearch(),
 *   ' ': () => randomQuote(),
 *   'Escape': () => clear()
 * }, [deps]);
 */
const useKeyboardShortcuts = (shortcuts, dependencies = []) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts when user is typing in input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        // Exception: Allow Escape to blur input
        if (e.key === 'Escape') {
          e.target.blur();
        }
        return;
      }

      // Check for cmd/ctrl combinations
      const key = e.key.toLowerCase();
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      // Build shortcut string
      let shortcutKey = '';
      if (isCmdOrCtrl) shortcutKey += 'cmd+';
      if (e.shiftKey) shortcutKey += 'shift+';
      if (e.altKey) shortcutKey += 'alt+';
      shortcutKey += e.key === ' ' ? 'space' : key;

      // Also check direct key match
      const handler = shortcuts[shortcutKey] || shortcuts[e.key];

      if (handler) {
        e.preventDefault();
        handler(e);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, dependencies); // eslint-disable-line react-hooks/exhaustive-deps
};

export default useKeyboardShortcuts;
