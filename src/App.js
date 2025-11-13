import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { getQuotesByTheme, getRandomQuote } from './quotesDatabase';
import {
  TYPING_SPEEDS,
  THEME_SUGGESTIONS,
  MESSAGES,
  STORAGE_KEYS,
  KEYBOARD_SHORTCUTS
} from './config';

const App = () => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DARK_MODE);
    return saved ? JSON.parse(saved) : false;
  });
  const [currentQuote, setCurrentQuote] = useState('');
  const [currentAuthor, setCurrentAuthor] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredQuotes, setFilteredQuotes] = useState([]);
  const [lastQuoteIndex, setLastQuoteIndex] = useState(-1);
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.FAVORITES);
    return saved ? JSON.parse(saved) : [];
  });
  const [showFavorites, setShowFavorites] = useState(false);
  const [matchCount, setMatchCount] = useState(0);
  const [copiedTooltip, setCopiedTooltip] = useState(false);

  const typingAbortRef = useRef(null);

  // Persist dark mode preference
  useEffect(() => {
    document.documentElement.className = isDark ? 'dark' : '';
    localStorage.setItem(STORAGE_KEYS.DARK_MODE, JSON.stringify(isDark));
  }, [isDark]);

  // Persist favorites
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
  }, [favorites]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Don't trigger if user is typing in input
      if (e.target.tagName === 'INPUT') return;

      if (e.key === KEYBOARD_SHORTCUTS.NEW_QUOTE && !isTyping) {
        e.preventDefault();
        if (currentQuote) {
          handleRefresh();
        } else {
          handleRandomQuote();
        }
      } else if (e.key === KEYBOARD_SHORTCUTS.CLEAR) {
        e.preventDefault();
        clearResults();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuote, isTyping]);

  // Hide copied tooltip after 2 seconds
  useEffect(() => {
    if (copiedTooltip) {
      const timer = setTimeout(() => setCopiedTooltip(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copiedTooltip]);

  const typeQuote = async (quote, author) => {
    // Clear any previous typing animation
    if (typingAbortRef.current) {
      typingAbortRef.current.abort = true;
    }

    setIsTyping(true);
    setCurrentQuote('');
    setCurrentAuthor('');

    // Create new abort controller for this animation
    const abortController = { abort: false };
    typingAbortRef.current = abortController;

    // Type quote
    for (let i = 0; i <= quote.length; i++) {
      if (abortController.abort) {
        setCurrentQuote(quote);
        setCurrentAuthor(author);
        setIsTyping(false);
        return;
      }
      setCurrentQuote(quote.substring(0, i));
      await new Promise(resolve => setTimeout(resolve, TYPING_SPEEDS.QUOTE));
    }

    // Pause before author
    await new Promise(resolve => setTimeout(resolve, TYPING_SPEEDS.PAUSE));
    if (abortController.abort) {
      setCurrentQuote(quote);
      setCurrentAuthor(author);
      setIsTyping(false);
      return;
    }

    // Type author
    for (let i = 0; i <= author.length; i++) {
      if (abortController.abort) {
        setCurrentQuote(quote);
        setCurrentAuthor(author);
        setIsTyping(false);
        return;
      }
      setCurrentAuthor(author.substring(0, i));
      await new Promise(resolve => setTimeout(resolve, TYPING_SPEEDS.AUTHOR));
    }

    setIsTyping(false);
    typingAbortRef.current = null;
  };

  const skipTyping = () => {
    if (typingAbortRef.current) {
      typingAbortRef.current.abort = true;
    }
  };

  const getNewQuote = (refresh = false) => {
    const quotes = searchTerm ? getQuotesByTheme(searchTerm) : getQuotesByTheme();

    setMatchCount(quotes.length);

    if (quotes.length === 0) {
      typeQuote(MESSAGES.NO_QUOTES_FOUND, MESSAGES.NO_QUOTES_AUTHOR);
      return;
    }

    let selectedQuote;

    if (refresh && filteredQuotes.length > 1) {
      // Get a different quote than the last one
      let newIndex;
      do {
        newIndex = Math.floor(Math.random() * quotes.length);
      } while (newIndex === lastQuoteIndex && quotes.length > 1);

      selectedQuote = quotes[newIndex];
      setLastQuoteIndex(newIndex);
    } else {
      selectedQuote = getRandomQuote(quotes);
      setLastQuoteIndex(quotes.findIndex(q => q === selectedQuote));
    }

    setFilteredQuotes(quotes);
    typeQuote(selectedQuote.text, selectedQuote.author);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentQuote('');
    setCurrentAuthor('');
    getNewQuote();
  };

  const handleRefresh = () => {
    setCurrentQuote('');
    setCurrentAuthor('');
    getNewQuote(true);
  };

  const clearResults = () => {
    if (typingAbortRef.current) {
      typingAbortRef.current.abort = true;
    }
    setCurrentQuote('');
    setCurrentAuthor('');
    setSearchTerm('');
    setFilteredQuotes([]);
    setLastQuoteIndex(-1);
    setShowFavorites(false);
    setMatchCount(0);
  };

  const handleRandomQuote = () => {
    setSearchTerm('');
    setCurrentQuote('');
    setCurrentAuthor('');
    setShowFavorites(false);
    getNewQuote();
  };

  const toggleFavorite = () => {
    if (!currentQuote || !currentAuthor) return;

    const quoteObj = { text: currentQuote, author: currentAuthor };
    const existingIndex = favorites.findIndex(
      fav => fav.text === currentQuote && fav.author === currentAuthor
    );

    if (existingIndex >= 0) {
      setFavorites(favorites.filter((_, i) => i !== existingIndex));
    } else {
      setFavorites([...favorites, quoteObj]);
    }
  };

  const isFavorite = () => {
    return favorites.some(
      fav => fav.text === currentQuote && fav.author === currentAuthor
    );
  };

  const handleShowFavorites = () => {
    if (favorites.length === 0) return;

    setShowFavorites(true);
    setSearchTerm('');
    const randomFav = favorites[Math.floor(Math.random() * favorites.length)];
    setCurrentQuote('');
    setCurrentAuthor('');
    setMatchCount(favorites.length);
    setFilteredQuotes(favorites);
    typeQuote(randomFav.text, randomFav.author);
  };

  const copyToClipboard = async () => {
    if (!currentQuote) return;

    const textToCopy = currentAuthor
      ? `"${currentQuote}" — ${currentAuthor}`
      : `"${currentQuote}"`;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedTooltip(true);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="app">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <header className="header" role="banner">
        <div className="header-main">
          <h1 className="title">Number Our Days</h1>
          {favorites.length === 0 && (
            <p className="favorites-hint" id="favorites-hint">
              Save a quote to revisit it here later.
            </p>
          )}
        </div>
        <div className="header-actions" role="group" aria-label="Header actions">
          <button
            className="favorites-toggle"
            onClick={handleShowFavorites}
            disabled={favorites.length === 0}
            aria-label={`View favorites (${favorites.length} saved)`}
            title={favorites.length === 0
              ? 'Save a quote to unlock your favorites'
              : `View favorites (${favorites.length})`}
            aria-describedby={favorites.length === 0 ? 'favorites-hint' : undefined}
          >
            <span aria-hidden="true">★</span> {favorites.length}
          </button>
          <button
            className="theme-toggle"
            onClick={() => setIsDark(!isDark)}
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            aria-pressed={isDark}
          >
            <span aria-hidden="true">{isDark ? '☀️' : '🌙'}</span>
          </button>
        </div>
      </header>

      <main id="main-content" className="main" role="main">
        <p className="subtitle">
          Wisdom on time from Scripture, Lewis, Chesterton, and others
        </p>

        <form
          onSubmit={handleSearch}
          className="search-form"
          role="search"
          aria-label="Search quotes by theme"
        >
          <div className="input-group">
            <label htmlFor="theme-search" className="input-prefix">Reflect on</label>
            <input
              id="theme-search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="eternity, death, purpose, wisdom..."
              className="search-input"
              aria-label="Enter a theme to search for quotes"
              aria-describedby="search-help"
            />
            <button
              type="submit"
              className="search-button"
              disabled={!searchTerm.trim()}
              aria-label="Search for quotes about this theme"
            >
              Seek
            </button>
          </div>
          <span id="search-help" className="visually-hidden">
            Enter a theme like time, eternity, death, purpose, or wisdom to find related quotes
          </span>
        </form>

        <div className="quick-actions">
          <button
            className="random-button"
            onClick={handleRandomQuote}
            aria-label="Get a random quote from any theme"
          >
            <span className="button-icon" aria-hidden="true">🎲</span>
            Random Quote
          </button>
        </div>

        {currentQuote && (
          <div className="results" role="region" aria-live="polite" aria-label="Quote results">
            {matchCount > 0 && (
              <div className="match-count" role="status" aria-live="polite">
                {matchCount} quote{matchCount !== 1 ? 's' : ''} found
                {showFavorites && ' in favorites'}
              </div>
            )}

            <div className="quote-container">
              <blockquote className={`quote ${currentQuote ? 'visible' : ''}`}>
                <span aria-live="polite" aria-atomic="true">
                  "{currentQuote}"
                  {isTyping && <span className="cursor" aria-hidden="true">|</span>}
                </span>
              </blockquote>
              {currentAuthor && (
                <cite className="author">
                  — {currentAuthor}
                </cite>
              )}

              {isTyping && (
                <button
                  className="skip-button"
                  onClick={skipTyping}
                  aria-label="Skip typing animation and show complete quote"
                >
                  Skip
                </button>
              )}
            </div>

            <div className="actions" role="group" aria-label="Quote actions">
              <button
                className="refresh-button"
                onClick={handleRefresh}
                disabled={filteredQuotes.length <= 1}
                aria-label={filteredQuotes.length <= 1
                  ? "No more quotes available in this theme"
                  : "Show another quote from this theme"}
              >
                <span className="button-icon" aria-hidden="true">↻</span>
                Another
              </button>
              <button
                className={`favorite-button ${isFavorite() ? 'is-favorite' : ''}`}
                onClick={toggleFavorite}
                disabled={!currentAuthor}
                aria-label={isFavorite() ? 'Remove from favorites' : 'Add to favorites'}
                aria-pressed={isFavorite()}
              >
                <span aria-hidden="true">{isFavorite() ? '★' : '☆'}</span>
              </button>
              <button
                className="copy-button"
                onClick={copyToClipboard}
                aria-label={copiedTooltip ? "Quote copied to clipboard" : "Copy quote to clipboard"}
              >
                <span className="button-icon" aria-hidden="true">📋</span>
                {copiedTooltip ? 'Copied' : 'Copy'}
              </button>
              <button
                className="clear-button"
                onClick={clearResults}
                aria-label="Clear current quote and search"
              >
                <span className="button-icon" aria-hidden="true">⌫</span>
                Clear
              </button>
            </div>
          </div>
        )}

        {!currentQuote && (
          <div className="empty-state" role="status" aria-live="polite">
            <p>Enter a theme to explore timeless wisdom about time itself, or get a random quote to start.</p>
            <div className="keyboard-hints">
              <span className="hint">Press <kbd>Enter</kbd> for new quote</span>
              <span className="hint">Press <kbd>Esc</kbd> to clear</span>
            </div>
            <nav className="theme-suggestions" aria-label="Suggested themes">
              <span aria-hidden="true">Try: </span>
              {THEME_SUGGESTIONS.map(theme => (
                <button
                  key={theme}
                  className="theme-suggestion"
                  onClick={() => {
                    setSearchTerm(theme);
                    setTimeout(() => getNewQuote(), 100);
                  }}
                  aria-label={`Search for quotes about ${theme}`}
                >
                  {theme}
                </button>
              ))}
            </nav>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
