import React from 'react';
import '../../styles/ui/LoadingScreen.css';

/**
 * Reusable LoadingScreen component for consistent loading states
 * @component
 * @param {Object} props Component props
 * @param {string} props.message - Loading message to display
 * @param {boolean} props.overlay - Whether to show as full-screen overlay (default: false)
 * @param {string} props.size - Size of spinner: 'small', 'medium', 'large' (default: 'medium')
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
