import { useState, useEffect } from 'react';
import { STORAGE_KEYS } from '../config';

/**
 * Custom hook for theme management with system preference detection
 * Handles dark/light mode with localStorage persistence
 */
const useTheme = () => {
  const [isDark, setIsDark] = useState(() => {
    // Check localStorage first
    const saved = localStorage.getItem(STORAGE_KEYS.DARK_MODE);
    if (saved !== null) {
      return JSON.parse(saved);
    }

    // Fall back to system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return true;
    }

    // Default to dark (aesthetic choice for contemplative app)
    return true;
  });

  useEffect(() => {
    // Apply theme class to document root
    document.documentElement.classList.toggle('dark', isDark);

    // Persist preference
    localStorage.setItem(STORAGE_KEYS.DARK_MODE, JSON.stringify(isDark));
  }, [isDark]);

  const toggleTheme = () => setIsDark(prev => !prev);

  return { isDark, setIsDark, toggleTheme };
};

export default useTheme;
