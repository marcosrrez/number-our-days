import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for typewriter animation effect
 * @param {string} text - The text to animate
 * @param {Object} options - Animation options
 * @param {number} options.speed - Delay between characters in ms (default: 30)
 * @param {Function} options.onStart - Callback when animation starts
 * @param {Function} options.onComplete - Callback when animation completes
 * @param {boolean} options.enabled - Whether animation is enabled (default: true)
 * @returns {Object} { displayText, isTyping, skip }
 */
const useTypewriter = (text, options = {}) => {
  const {
    speed = 30,
    onStart,
    onComplete,
    enabled = true
  } = options;

  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const timeoutRef = useRef(null);

  // Skip function to show full text immediately
  const skip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setDisplayText(text);
    setCurrentIndex(text.length);
    setIsTyping(false);
    if (onComplete) onComplete();
  };

  useEffect(() => {
    // Reset when text changes
    setDisplayText('');
    setCurrentIndex(0);
    setIsTyping(false);

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // If no text or animation disabled, show immediately
    if (!text || !enabled) {
      setDisplayText(text);
      return;
    }

    // Start animation
    setIsTyping(true);
    if (onStart) onStart();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text, enabled, onStart]);

  useEffect(() => {
    // Animate character by character
    if (currentIndex < text.length && enabled) {
      timeoutRef.current = setTimeout(() => {
        setDisplayText(text.substring(0, currentIndex + 1));
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timeoutRef.current);
    } else if (currentIndex >= text.length && isTyping) {
      // Animation complete
      setIsTyping(false);
      if (onComplete) onComplete();
    }
  }, [currentIndex, text, speed, enabled, isTyping, onComplete]);

  return { displayText, isTyping, skip };
};

export default useTypewriter;
