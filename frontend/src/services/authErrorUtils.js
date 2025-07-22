/**
 * Utility functions for handling authentication errors across the application
 */

/**
 * Check if an error is an authentication error
 * @param {string|Error} error - The error to check
 * @returns {boolean} - True if the error is an authentication error
 */
export const isAuthError = (error) => {
  const errorMessage = typeof error === 'string' ? error : error?.message || '';
  
  return (
    errorMessage.includes('session has expired') ||
    errorMessage.includes('token') ||
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('401') ||
    errorMessage.includes('Invalid token') ||
    errorMessage.includes('Token expired') ||
    errorMessage.includes('Authentication failed') ||
    errorMessage.includes('Authentication required')
  );
};

/**
 * Get a user-friendly message for authentication errors
 * @param {string|Error} error - The error to get message for
 * @returns {string} - User-friendly error message
 */
export const getAuthErrorMessage = (error) => {
  const errorMessage = typeof error === 'string' ? error : error?.message || '';
  
  if (errorMessage.includes('session has expired') || errorMessage.includes('Token expired')) {
    return 'Your session has expired. Redirecting to the landing page...';
  }
  
  if (errorMessage.includes('unauthorized') || errorMessage.includes('401')) {
    return 'You are not authorized to access this page. Redirecting to the landing page...';
  }
  
  if (errorMessage.includes('Authentication required')) {
    return 'Authentication required. Please log in again. Redirecting to the landing page...';
  }

  return 'Authentication error occurred. Redirecting to the landing page...';
};
