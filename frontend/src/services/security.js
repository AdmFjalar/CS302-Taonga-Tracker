/**
 * Security utilities for authentication, validation, and rate limiting
 */

import { STORAGE_KEYS } from './constants';

/**
 * Token management utility
 */
export const tokenManager = {
  /**
   * Get the current authentication token
   * @returns {string|null} Authentication token
   */
  getToken() {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  },

  /**
   * Set the authentication token
   * @param {string} token - JWT token
   */
  setToken(token) {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  },

  /**
   * Clear the authentication token
   */
  clearToken() {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
  },

  /**
   * Check if token exists and is not expired
   * @returns {boolean} True if token is valid
   */
  isTokenValid() {
    const token = this.getToken();
    if (!token) return false;

    try {
      // Decode JWT token to check expiration
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Date.now() / 1000;
      return payload.exp > now;
    } catch (error) {
      return false;
    }
  }
};

/**
 * Input validation utility
 */
export const validator = {
  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} True if valid email
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @returns {Object} Validation result with strength score
   */
  validatePassword(password) {
    const result = {
      isValid: false,
      score: 0,
      requirements: {
        minLength: password.length >= 8,
        hasUppercase: /[A-Z]/.test(password),
        hasLowercase: /[a-z]/.test(password),
        hasNumbers: /\d/.test(password),
        hasSpecialChars: /[!@#$%^&*(),.?":{}|<>]/.test(password)
      }
    };

    // Calculate score based on requirements met
    const metRequirements = Object.values(result.requirements).filter(Boolean).length;
    result.score = metRequirements;
    result.isValid = metRequirements >= 4;

    return result;
  },

  /**
   * Sanitize input to prevent XSS
   * @param {string} input - Input to sanitize
   * @returns {string} Sanitized input
   */
  sanitizeInput(input) {
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
 * Rate limiting utility
 */
export const rateLimiter = {
  requests: new Map(),

  /**
   * Check if request is allowed based on rate limits
   * @param {string} key - Rate limit key (e.g., 'login', 'api_call')
   * @param {number} maxRequests - Maximum requests allowed
   * @param {number} windowMs - Time window in milliseconds
   * @returns {boolean} True if request is allowed
   */
  isAllowed(key, maxRequests, windowMs) {
    const now = Date.now();
    const requestHistory = this.requests.get(key) || [];

    // Remove old requests outside the time window
    const recentRequests = requestHistory.filter(timestamp => now - timestamp < windowMs);

    // Check if we're under the limit
    if (recentRequests.length >= maxRequests) {
      return false;
    }

    // Add current request
    recentRequests.push(now);
    this.requests.set(key, recentRequests);

    return true;
  },

  /**
   * Clear rate limit data for a specific key
   * @param {string} key - Rate limit key to clear
   */
  clearKey(key) {
    this.requests.delete(key);
  },

  /**
   * Clear all rate limit data
   */
  clearAll() {
    this.requests.clear();
  }
};

/**
 * Security headers utility
 */
export const securityHeaders = {
  /**
   * Get security headers for API requests
   * @returns {Object} Security headers
   */
  getHeaders() {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    };
  }
};
