/**
 * Security monitoring and incident response utilities.
 * Handles security event logging and automated threat detection.
 */

/**
 * Security event logging service.
 */
export const securityLogger = {
  /**
   * Log security events for monitoring and analysis.
   * @param {string} eventType - Type of security event
   * @param {Object} details - Event details and metadata
   * @param {string} [severity='medium'] - Event severity level
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

    // Log to console in development, send to monitoring service in production
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
   * Get recent security events from local storage.
   * @param {number} [limit=10] - Number of events to retrieve
   * @returns {Array} Recent security events
   */
  getRecentEvents: (limit = 10) => {
    const events = JSON.parse(localStorage.getItem('security_events') || '[]');
    return events.slice(-limit);
  },

  /**
   * Clear all stored security events.
   */
  clearEvents: () => {
    localStorage.removeItem('security_events');
  }
};

/**
 * Automated threat detection and response.
 */
export const threatDetector = {
  /**
   * Analyze user behavior patterns for anomalies.
   * @param {Object} userActivity - Current user activity data
   * @returns {boolean} True if suspicious activity detected
   */
  detectSuspiciousActivity: (userActivity) => {
    // Simple heuristics for demonstration
    const recentEvents = securityLogger.getRecentEvents(20);

    // Check for rapid successive failed login attempts
    const failedLogins = recentEvents.filter(event =>
      event.type === 'login_failed' &&
      Date.now() - new Date(event.timestamp).getTime() < 300000 // 5 minutes
    );

    if (failedLogins.length >= 3) {
      securityLogger.logSecurityEvent('suspicious_login_pattern', {
        failedAttempts: failedLogins.length,
        timeWindow: '5 minutes'
      }, 'high');
      return true;
    }

    return false;
  },

  /**
   * Check for unusual access patterns.
   * @param {string} ipAddress - Current IP address
   * @param {string} userAgent - Current user agent
   * @returns {boolean} True if unusual pattern detected
   */
  checkAccessPattern: (ipAddress, userAgent) => {
    // This would integrate with more sophisticated detection in production
    const recentEvents = securityLogger.getRecentEvents(50);

    // Check for multiple different user agents
    const uniqueUserAgents = new Set(recentEvents.map(event => event.userAgent));

    if (uniqueUserAgents.size > 3) {
      securityLogger.logSecurityEvent('multiple_user_agents', {
        uniqueAgents: uniqueUserAgents.size
      }, 'medium');
      return true;
    }

    return false;
  }
};
