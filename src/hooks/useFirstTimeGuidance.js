import { useState, useEffect } from 'react';

/**
 * Custom hook for first-time user guidance
 * Tracks visits and provides contextual hints
 * @returns {Object} { isFirstVisit, visitCount, shouldShowHint, dismissHint }
 */
const useFirstTimeGuidance = () => {
  const [visitCount, setVisitCount] = useState(0);
  const [dismissedHints, setDismissedHints] = useState(new Set());

  useEffect(() => {
    // Get visit count from localStorage
    const visits = parseInt(localStorage.getItem('visitCount') || '0', 10);
    setVisitCount(visits);

    // Increment and save
    localStorage.setItem('visitCount', String(visits + 1));

    // Get dismissed hints
    const dismissed = JSON.parse(localStorage.getItem('dismissedHints') || '[]');
    setDismissedHints(new Set(dismissed));
  }, []);

  const shouldShowHint = (hintId, maxVisits = 5) => {
    // Show hint if:
    // 1. User hasn't seen too many visits (still learning)
    // 2. Hint hasn't been explicitly dismissed
    return visitCount < maxVisits && !dismissedHints.has(hintId);
  };

  const dismissHint = (hintId) => {
    const newDismissed = new Set(dismissedHints);
    newDismissed.add(hintId);
    setDismissedHints(newDismissed);
    localStorage.setItem('dismissedHints', JSON.stringify([...newDismissed]));
  };

  return {
    isFirstVisit: visitCount === 0,
    visitCount,
    shouldShowHint,
    dismissHint
  };
};

export default useFirstTimeGuidance;
