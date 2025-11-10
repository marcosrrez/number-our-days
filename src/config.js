// Configuration constants for Number Our Days app

// Typing animation speeds (in milliseconds)
export const TYPING_SPEEDS = {
  QUOTE: 25,        // Speed for typing quote text
  AUTHOR: 35,       // Speed for typing author name
  PAUSE: 300,       // Pause between quote and author
};

// Theme suggestions for the home screen
export const THEME_SUGGESTIONS = [
  'time',
  'eternity',
  'death',
  'purpose',
  'wisdom',
  'mortality'
];

// Default messages
export const MESSAGES = {
  NO_QUOTES_FOUND: "No quotes found for that theme. Try 'time', 'eternity', 'death', or 'purpose'.",
  NO_QUOTES_AUTHOR: "",
};

// LocalStorage keys
export const STORAGE_KEYS = {
  DARK_MODE: 'numberOurDays_darkMode',
  FAVORITES: 'numberOurDays_favorites',
};

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
  NEW_QUOTE: 'Enter',
  CLEAR: 'Escape',
};
