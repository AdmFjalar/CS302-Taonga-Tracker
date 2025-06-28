/**
 * Security utilities for enhanced application security
 */

import { STORAGE_KEYS } from './constants';

/**
 * Token management with enhanced security
 */
export const tokenManager = {
  /**
   * Set token with expiration time
   * @param {string} token - JWT token
   * @param {number} expiresIn - Expiration time in seconds
   */
  setToken: (token, expiresIn = 3600) => {
    const expirationTime = Date.now() + (expiresIn * 1000);
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    localStorage.setItem('token_expiration', expirationTime.toString());
  },

  /**
   * Get token if still valid
   * @returns {string|null} Valid token or null
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
   * Clear all auth-related data
   */
  clearToken: () => {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_ID);
    localStorage.removeItem('token_expiration');
  },

  /**
   * Check if token is about to expire (within 5 minutes)
   * @returns {boolean} True if token expires soon
   */
  isTokenExpiringSoon: () => {
    const expiration = localStorage.getItem('token_expiration');
    if (!expiration) return true;
    
    const fiveMinutes = 5 * 60 * 1000;
    return Date.now() > (parseInt(expiration) - fiveMinutes);
  }
};

/**
 * Input validation utilities
 */
export const validator = {
  /**
   * Validate email format
   * @param {string} email
   * @returns {boolean}
   */
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate password strength
   * @param {string} password
   * @returns {{isValid: boolean, errors: string[]}}
   */
  validatePassword: (password) => {
    const errors = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Sanitize user input to prevent XSS
   * @param {string} input
   * @returns {string}
   */
  sanitizeInput: (input) => {
    if (typeof input !== 'string') return input;
    
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
};

/**
 * Rate limiting for API calls
 */
export const rateLimiter = {
  requests: new Map(),
  
  /**
   * Check if request is allowed based on rate limit
   * @param {string} key - Unique identifier for the request type
   * @param {number} limit - Max requests allowed
   * @param {number} windowMs - Time window in milliseconds
   * @returns {boolean} True if request is allowed
   */
  isAllowed: (key, limit = 10, windowMs = 60000) => {
    const now = Date.now();
    const requests = rateLimiter.requests.get(key) || [];
    
    // Filter out old requests
    const recentRequests = requests.filter(time => now - time < windowMs);
    
    if (recentRequests.length >= limit) {
      return false;
    }
    
    recentRequests.push(now);
    rateLimiter.requests.set(key, recentRequests);
    return true;
  }
};
