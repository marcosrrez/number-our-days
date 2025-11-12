import React, { useState, useEffect } from 'react';
import './App.minimal.css';
import { getQuotesByTheme, getRandomQuote } from './quotesDatabase';
import { THEME_SUGGESTIONS, STORAGE_KEYS } from './config';
import useTheme from './hooks/useTheme';
import useTypewriter from './hooks/useTypewriter';
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts';
import useFirstTimeGuidance from './hooks/useFirstTimeGuidance';

const App = () => {
  // Custom hooks
  const { isDark, toggleTheme } = useTheme();
  const { isFirstVisit, shouldShowHint, dismissHint } = useFirstTimeGuidance();

  // Consolidated state
  const [quote, setQuote] = useState({ text: '', author: '', source: [] });
  const [search, setSearch] = useState({ term: '', results: [] });
  const [ui, setUi] = useState({
    showSearchModal: false,
    showActions: false,
    showCopied: false,
    fade: false
  });

  // Favorites
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.FAVORITES);
    return saved ? JSON.parse(saved) : [];
  });

  // Typewriter animation for quote
  const { displayText: displayQuote, isTyping, skip } = useTypewriter(quote.text, {
    speed: 25,
    onStart: () => setUi(prev => ({ ...prev, fade: true })),
    onComplete: () => setUi(prev => ({ ...prev, fade: false }))
  });

  // Persist favorites
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
  }, [favorites]);

  // Auto-hide copied tooltip
  useEffect(() => {
    if (ui.showCopied) {
      const timer = setTimeout(() => {
        setUi(prev => ({ ...prev, showCopied: false }));
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [ui.showCopied]);

  // Handlers
  const handleSearch = (searchTerm) => {
    const term = searchTerm || search.term;
    if (!term.trim()) return;

    const results = getQuotesByTheme(term);
    if (results.length === 0) return;

    const randomQuote = results[Math.floor(Math.random() * results.length)];
    setQuote({
      text: randomQuote.quote,
      author: randomQuote.author,
      source: results
    });
    setSearch({ term, results });
    setUi(prev => ({ ...prev, showSearchModal: false }));
  };

  const handleRandomQuote = () => {
    const randomQuote = getRandomQuote();
    setQuote({
      text: randomQuote.quote,
      author: randomQuote.author,
      source: []
    });
    setSearch({ term: '', results: [] });
  };

  const handleRefresh = () => {
    if (quote.source.length <= 1) return;

    // Get different quote from same source
    const availableQuotes = quote.source.filter(q => q.quote !== quote.text);
    if (availableQuotes.length === 0) return;

    const nextQuote = availableQuotes[Math.floor(Math.random() * availableQuotes.length)];
    setQuote({
      text: nextQuote.quote,
      author: nextQuote.author,
      source: quote.source
    });
  };

  const toggleFavorite = () => {
    const isFav = favorites.some(f => f.text === quote.text);

    if (isFav) {
      setFavorites(favorites.filter(f => f.text !== quote.text));
    } else {
      setFavorites([...favorites, { text: quote.text, author: quote.author }]);
    }
  };

  const copyToClipboard = async () => {
    if (!quote.text) return;

    const textToCopy = quote.author
      ? `"${quote.text}" — ${quote.author}`
      : `"${quote.text}"`;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setUi(prev => ({ ...prev, showCopied: true }));
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const clearQuote = () => {
    setQuote({ text: '', author: '', source: [] });
    setSearch({ term: '', results: [] });
  };

  const showFavoritesView = () => {
    if (favorites.length === 0) return;

    const randomFav = favorites[Math.floor(Math.random() * favorites.length)];
    setQuote({
      text: randomFav.text,
      author: randomFav.author,
      source: favorites
    });
    setSearch({ term: '', results: [] });
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    'cmd+k': () => setUi(prev => ({ ...prev, showSearchModal: true })),
    ' ': () => !quote.text && handleRandomQuote(),
    'Escape': () => {
      if (ui.showSearchModal) {
        setUi(prev => ({ ...prev, showSearchModal: false }));
      } else {
        clearQuote();
      }
    },
    'r': () => quote.text && handleRefresh(),
    's': () => quote.text && toggleFavorite(),
    'c': () => quote.text && copyToClipboard(),
    'Enter': () => quote.text && handleRefresh()
  }, [quote.text, ui.showSearchModal, search.term]);

  // Derived state
  const isFavorite = favorites.some(f => f.text === quote.text);
  const hasMoreQuotes = quote.source.length > 1;
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className="app-minimal">
      {/* Theme toggle - always visible but subtle */}
      <button
        className="theme-toggle-minimal"
        onClick={toggleTheme}
        aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
        title={isDark ? 'Light mode' : 'Dark mode'}
      >
        {isDark ? '☀️' : '🌙'}
      </button>

      {/* Favorites access (top-left, subtle) */}
      {favorites.length > 0 && !quote.text && (
        <button
          className="favorites-access"
          onClick={showFavoritesView}
          aria-label={`View ${favorites.length} saved quotes`}
          title="View favorites"
        >
          ★ {favorites.length}
        </button>
      )}

      <main className="main-minimal">
        {/* STATE 1: Pristine - No quote */}
        {!quote.text && (
          <div className="pristine-state">
            <input
              type="text"
              placeholder="Reflect on..."
              className="hero-input"
              value={search.term}
              onChange={(e) => setSearch(prev => ({ ...prev, term: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearch();
                }
              }}
              onFocus={() => shouldShowHint('search-hint') && dismissHint('search-hint')}
              autoFocus={!isFirstVisit}
              aria-label="Enter a theme to search for quotes"
            />

            {/* Subtle hints */}
            <div className="hints-minimal">
              {shouldShowHint('initial-hint') ? (
                <>
                  <p className="hint-primary">Press <kbd>Enter</kbd> to search, or <kbd>Space</kbd> for random quote</p>
                  <button
                    className="hint-dismiss"
                    onClick={() => dismissHint('initial-hint')}
                    aria-label="Dismiss hint"
                  >
                    Got it
                  </button>
                </>
              ) : (
                <p className="hint-subtle">
                  <kbd>⌘K</kbd> Search • <kbd>Space</kbd> Random
                </p>
              )}
            </div>

            {/* Theme suggestions */}
            {!search.term && (
              <div className="theme-suggestions-minimal">
                <span className="suggestions-label">Try:</span>
                {THEME_SUGGESTIONS.slice(0, 5).map(theme => (
                  <button
                    key={theme}
                    className="theme-chip"
                    onClick={() => handleSearch(theme)}
                    aria-label={`Search for quotes about ${theme}`}
                  >
                    {theme}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STATE 2: Quote displayed */}
        {quote.text && (
          <div
            className="quote-display-minimal"
            onMouseEnter={() => !isMobile && setUi(prev => ({ ...prev, showActions: true }))}
            onMouseLeave={() => !isMobile && setUi(prev => ({ ...prev, showActions: false }))}
          >
            {/* Search shortcut hint (top-left when quote visible) */}
            {shouldShowHint('search-shortcut', 3) && (
              <button
                className="search-hint-button"
                onClick={() => {
                  setUi(prev => ({ ...prev, showSearchModal: true }));
                  dismissHint('search-shortcut');
                }}
                title="Open search (⌘K)"
              >
                <kbd>⌘K</kbd> Search
              </button>
            )}

            {/* Quote */}
            <blockquote className={`quote-minimal ${ui.fade ? 'fade' : ''}`}>
              "{displayQuote}"
              {isTyping && <span className="cursor-minimal" aria-hidden="true">|</span>}
            </blockquote>

            {/* Author */}
            {quote.author && (
              <cite className="author-minimal">— {quote.author}</cite>
            )}

            {/* Skip button during typing */}
            {isTyping && (
              <button
                className="skip-button-minimal"
                onClick={skip}
                aria-label="Skip animation"
              >
                Skip
              </button>
            )}

            {/* Progressive disclosure: Actions */}
            <div className={`actions-minimal ${ui.showActions || isMobile ? 'visible' : ''}`}>
              <button
                className="action-btn"
                onClick={handleRefresh}
                disabled={!hasMoreQuotes}
                aria-label="Another quote"
                title="Another (R)"
              >
                <span className="icon">↻</span>
                <span className="label">Another</span>
              </button>

              <button
                className={`action-btn ${isFavorite ? 'active' : ''}`}
                onClick={toggleFavorite}
                aria-label={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
                title="Save (S)"
              >
                <span className="icon">{isFavorite ? '★' : '☆'}</span>
                <span className="label">Save</span>
              </button>

              <button
                className="action-btn"
                onClick={copyToClipboard}
                aria-label="Copy to clipboard"
                title="Copy (C)"
              >
                <span className="icon">{ui.showCopied ? '✓' : '📋'}</span>
                <span className="label">{ui.showCopied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Keyboard shortcuts hint (bottom, subtle) */}
            {shouldShowHint('keyboard-shortcuts', 5) && (
              <div className="keyboard-hint-minimal">
                <p>
                  <kbd>R</kbd> Another • <kbd>S</kbd> Save • <kbd>C</kbd> Copy • <kbd>Esc</kbd> New search
                </p>
                <button
                  className="hint-dismiss-small"
                  onClick={() => dismissHint('keyboard-shortcuts')}
                  aria-label="Dismiss"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Full-screen search modal */}
      {ui.showSearchModal && (
        <div className="search-modal-overlay" onClick={() => setUi(prev => ({ ...prev, showSearchModal: false }))}>
          <div className="search-modal" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              placeholder="Search themes..."
              className="search-modal-input"
              value={search.term}
              onChange={(e) => setSearch(prev => ({ ...prev, term: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearch();
                }
              }}
              autoFocus
              aria-label="Search for themes"
            />

            <div className="search-suggestions">
              <p className="suggestions-title">Suggested themes:</p>
              <div className="suggestions-grid">
                {THEME_SUGGESTIONS.map(theme => (
                  <button
                    key={theme}
                    className="suggestion-pill"
                    onClick={() => handleSearch(theme)}
                  >
                    {theme}
                  </button>
                ))}
              </div>
            </div>

            {favorites.length > 0 && (
              <div className="favorites-section">
                <p className="suggestions-title">Saved quotes ({favorites.length}):</p>
                <div className="favorites-list">
                  {favorites.slice(0, 5).map((fav, idx) => (
                    <button
                      key={idx}
                      className="favorite-item"
                      onClick={() => {
                        setQuote({ text: fav.text, author: fav.author, source: favorites });
                        setUi(prev => ({ ...prev, showSearchModal: false }));
                      }}
                    >
                      <span className="fav-text">"{fav.text.substring(0, 60)}..."</span>
                      <span className="fav-author">— {fav.author}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <p className="modal-hint">
              <kbd>Esc</kbd> to close
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
