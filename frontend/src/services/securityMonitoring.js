/**
 * Security Monitoring and Incident Response
 * Handles security events, logging, and automated responses
 */

/**
 * Security Event Logger
 */
export const securityLogger = {
  /**
   * Log security events for monitoring
   * @param {string} eventType - Type of security event
   * @param {Object} details - Event details
   * @param {string} severity - Event severity (low, medium, high, critical)
   */
  logSecurityEvent: (eventType, details, severity = 'medium') => {
    const event = {
      timestamp: new Date().toISOString(),
      type: eventType,
      severity,
      details,
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: localStorage.getItem('userId') || 'anonymous'
    };

    // In production, send to security monitoring service
    console.warn('SECURITY EVENT:', event);

    // Store locally for immediate analysis
    const events = JSON.parse(localStorage.getItem('security_events') || '[]');
    events.push(event);

    // Keep only last 100 events to prevent storage bloat
    if (events.length > 100) {
      events.splice(0, events.length - 100);
    }

    localStorage.setItem('security_events', JSON.stringify(events));
  },

  /**
   * Get recent security events
   * @param {number} limit - Number of events to retrieve
   * @returns {Array} Recent security events
   */
  getRecentEvents: (limit = 10) => {
    const events = JSON.parse(localStorage.getItem('security_events') || '[]');
    return events.slice(-limit);
  }
};

/**
 * Content Security Policy helpers
 */
export const cspManager = {
  /**
   * Validate and sanitize dynamic content
   * @param {string} content - Content to validate
   * @param {string} type - Content type (html, url, etc.)
   * @returns {string} Sanitized content
   */
  sanitizeContent: (content, type = 'html') => {
    if (typeof content !== 'string') return '';

    switch (type) {
      case 'html':
        return content
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '');

      case 'url':
        try {
          const url = new URL(content);
          return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
        } catch {
          return '';
        }

      default:
        return content.replace(/[<>]/g, '');
    }
  },

  /**
   * Validate file uploads
   * @param {File} file - File to validate
   * @returns {Object} Validation result
   */
  validateFileUpload: (file) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    const maxDimensions = { width: 4000, height: 4000 };

    const errors = [];

    if (!allowedTypes.includes(file.type)) {
      errors.push('File type not allowed. Please upload JPEG, PNG, GIF, or WebP images only.');
    }

    if (file.size > maxSize) {
      errors.push('File size too large. Maximum size is 5MB.');
    }

    // Additional filename validation
    if (!/^[a-zA-Z0-9._-]+$/.test(file.name)) {
      errors.push('Invalid filename. Use only letters, numbers, dots, hyphens, and underscores.');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

/**
 * Session Security Manager
 */
export const sessionManager = {
  /**
   * Initialize secure session tracking
   */
  initializeSession: () => {
    const sessionId = crypto.randomUUID();
    const sessionStart = new Date().toISOString();

    sessionStorage.setItem('session_id', sessionId);
    sessionStorage.setItem('session_start', sessionStart);

    // Set up session timeout warning
    sessionManager.setupSessionTimeout();
  },

  /**
   * Setup automatic session timeout
   */
  setupSessionTimeout: () => {
    const timeoutDuration = 30 * 60 * 1000; // 30 minutes
    const warningDuration = 5 * 60 * 1000; // 5 minutes before timeout

    let timeoutWarning;
    let sessionTimeout;

    const resetTimers = () => {
      clearTimeout(timeoutWarning);
      clearTimeout(sessionTimeout);

      timeoutWarning = setTimeout(() => {
        if (window.confirm('Your session will expire in 5 minutes. Would you like to extend it?')) {
          resetTimers();
        }
      }, timeoutDuration - warningDuration);

      sessionTimeout = setTimeout(() => {
        sessionManager.forceLogout('Session expired');
      }, timeoutDuration);
    };

    // Reset timers on user activity
    ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, resetTimers, true);
    });

    resetTimers();
  },

  /**
   * Force logout and clear all session data
   * @param {string} reason - Reason for logout
   */
  forceLogout: (reason = 'Security logout') => {
    securityLogger.logSecurityEvent('forced_logout', { reason }, 'medium');

    // Clear all authentication data
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('token_expiration');
    sessionStorage.clear();

    // Redirect to login
    window.location.href = '/login';
  },

  /**
   * Validate session integrity
   * @returns {boolean} True if session is valid
   */
  validateSession: () => {
    const sessionId = sessionStorage.getItem('session_id');
    const sessionStart = sessionStorage.getItem('session_start');

    if (!sessionId || !sessionStart) {
      return false;
    }

    // Check if session is too old (24 hours)
    const maxAge = 24 * 60 * 60 * 1000;
    const age = Date.now() - new Date(sessionStart).getTime();

    if (age > maxAge) {
      sessionManager.forceLogout('Session too old');
      return false;
    }

    return true;
  }
};
