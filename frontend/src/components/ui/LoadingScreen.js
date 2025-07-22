import React from 'react';
import '../../styles/ui/LoadingScreen.css';

/**
 * Reusable loading screen component with configurable display options.
 *
 * @param {Object} props - Component props
 * @param {string} [props.message='Loading...'] - Loading message to display
 * @param {boolean} [props.overlay=false] - Whether to show as full-screen overlay
 * @param {string} [props.size='medium'] - Spinner size: 'small', 'medium', 'large'
 * @returns {JSX.Element} Loading screen component
 */
const LoadingScreen = ({ 
  message = "Loading...", 
  overlay = false, 
  size = "medium" 
}) => {
  const containerClass = overlay ? "loading-screen-overlay" : "loading-screen-inline";
  const spinnerClass = `loading-spinner loading-spinner-${size}`;

  return (
    <div className={containerClass}>
      <div className="loading-container">
        <div className={spinnerClass}></div>
        <p className="loading-message">{message}</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
