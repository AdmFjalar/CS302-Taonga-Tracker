/**
 * Security utilities for token management, input validation, and rate limiting.
 */

import { STORAGE_KEYS } from './constants';

/**
 * Token management with expiration handling.
 */
export const tokenManager = {
  /**
   * Store token with expiration time.
   * @param {string} token - JWT token
   * @param {number} [expiresIn=3600] - Expiration time in seconds
   */
  setToken: (token, expiresIn = 3600) => {
    const expirationTime = Date.now() + (expiresIn * 1000);
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    localStorage.setItem('token_expiration', expirationTime.toString());
  },

  /**
   * Retrieve token if still valid.
   * @returns {string|null} Valid token or null if expired
   */
  getToken: () => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const expiration = localStorage.getItem('token_expiration');
    
    if (!token || !expiration) return null;

    if (Date.now() > parseInt(expiration)) {
      tokenManager.clearToken();
      return null;
    }
    
    return token;
  },

  /**
   * Clear all authentication data from storage.
   */
  clearToken: () => {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_ID);
    localStorage.removeItem('token_expiration');
  },

  /**
   * Check if token expires within 5 minutes.
   * @returns {boolean} True if token expires soon
   */
  isTokenExpiringSoon: () => {
    const expiration = localStorage.getItem('token_expiration');
    if (!expiration) return false;

    const fiveMinutesFromNow = Date.now() + (5 * 60 * 1000);
    return parseInt(expiration) < fiveMinutesFromNow;
  }
};

/**
 * Input validation and sanitization utilities.
 */
export const validator = {
  /**
   * Sanitize string input by removing potentially harmful characters.
   * @param {string} input - Input string to sanitize
   * @returns {string} Sanitized string
   */
  sanitizeInput: (input) => {
    if (typeof input !== 'string') return '';
    return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/[<>]/g, '')
                .trim();
  },

  /**
   * Validate email format.
   * @param {string} email - Email to validate
   * @returns {boolean} True if valid email format
   */
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate password strength.
   * @param {string} password - Password to validate
   * @returns {Object} Validation results object
   */
  validatePassword: (password) => {
    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      isValid: password.length >= 8 &&
               /[A-Z]/.test(password) &&
               /[a-z]/.test(password) &&
               /\d/.test(password) &&
               /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
  }
};

/**
 * Rate limiting utility to prevent abuse.
 */
export const rateLimiter = {
  attempts: new Map(),

  /**
   * Check if action is allowed based on rate limits.
   * @param {string} key - Identifier for the action
   * @param {number} maxAttempts - Maximum allowed attempts
   * @param {number} windowMs - Time window in milliseconds
   * @returns {boolean} True if action is allowed
   */
  isAllowed: (key, maxAttempts, windowMs) => {
    const now = Date.now();
    const attempts = rateLimiter.attempts.get(key) || [];

    // Remove expired attempts
    const validAttempts = attempts.filter(time => now - time < windowMs);

    if (validAttempts.length >= maxAttempts) {
      return false;
    }
    
    validAttempts.push(now);
    rateLimiter.attempts.set(key, validAttempts);
    return true;
  },

  /**
   * Clear rate limit data for a key.
   * @param {string} key - Identifier to clear
   */
  clear: (key) => {
    rateLimiter.attempts.delete(key);
  }
};
