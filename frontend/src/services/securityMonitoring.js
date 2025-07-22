/**
 * Security monitoring and scanning service
 * Handles security event logging, vulnerability scanning, and threat detection
 */

import {
  SECURITY_ENDPOINTS,
  SECURITY_EVENT_TYPES,
  SECURITY_RISK_LEVELS,
  STORAGE_KEYS
} from './constants';

/**
 * Security logger for tracking security events
 */
export const securityLogger = {
  /**
   * Log a security event
   * @param {string} eventType - Type of security event
   * @param {Object} details - Event details
   * @param {string} riskLevel - Risk level (low, medium, high, critical)
   */
  logSecurityEvent(eventType, details = {}, riskLevel = SECURITY_RISK_LEVELS.LOW) {
    const event = {
      timestamp: new Date().toISOString(),
      type: eventType,
      details,
      riskLevel,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Store locally for immediate access
    this.storeEventLocally(event);

    // Send to server if high risk or critical
    if (riskLevel === SECURITY_RISK_LEVELS.HIGH || riskLevel === SECURITY_RISK_LEVELS.CRITICAL) {
      this.sendEventToServer(event);
    }
  },

  /**
   * Store security event in local storage
   * @param {Object} event - Security event
   */
  storeEventLocally(event) {
    try {
      const events = JSON.parse(localStorage.getItem(STORAGE_KEYS.SECURITY_EVENTS) || '[]');
      events.push(event);

      // Keep only last 100 events to prevent storage overflow
      if (events.length > 100) {
        events.splice(0, events.length - 100);
      }

      localStorage.setItem(STORAGE_KEYS.SECURITY_EVENTS, JSON.stringify(events));
    } catch (error) {
      console.warn('Failed to store security event locally:', error);
    }
  },

  /**
   * Send security event to server
   * @param {Object} event - Security event
   */
  async sendEventToServer(event) {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (!token) return;

      await fetch(SECURITY_ENDPOINTS.ACTIVITY_LOG, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(event)
      });
    } catch (error) {
      console.warn('Failed to send security event to server:', error);
    }
  },

  /**
   * Get recent security events
   * @returns {Array} Recent security events
   */
  getRecentEvents() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.SECURITY_EVENTS) || '[]');
    } catch (error) {
      console.warn('Failed to retrieve security events:', error);
      return [];
    }
  }
};

/**
 * Security scanner for vulnerability detection
 */
export const securityScanner = {
  /**
   * Perform a comprehensive security scan
   * @returns {Promise<Object>} Security scan results
   */
  async performSecurityScan() {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (!token) {
        throw new Error('Authentication required for security scan');
      }

      securityLogger.logSecurityEvent(
        SECURITY_EVENT_TYPES.API_CALL,
        { action: 'security_scan_initiated' },
        SECURITY_RISK_LEVELS.MEDIUM
      );

      const response = await fetch(SECURITY_ENDPOINTS.SCAN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          scanType: 'comprehensive',
          includeVulnerabilities: true,
          includePermissions: true,
          includeDataAccess: true
        })
      });

      if (!response.ok) {
        throw new Error(`Security scan failed: ${response.status}`);
      }

      const scanResults = await response.json();

      // Log scan completion
      securityLogger.logSecurityEvent(
        SECURITY_EVENT_TYPES.API_CALL,
        {
          action: 'security_scan_completed',
          vulnerabilities_found: scanResults.vulnerabilities?.length || 0,
          risk_score: scanResults.riskScore
        },
        scanResults.riskScore > 7 ? SECURITY_RISK_LEVELS.HIGH : SECURITY_RISK_LEVELS.MEDIUM
      );

      return scanResults;
    } catch (error) {
      securityLogger.logSecurityEvent(
        SECURITY_EVENT_TYPES.API_CALL,
        {
          action: 'security_scan_failed',
          error: error.message
        },
        SECURITY_RISK_LEVELS.HIGH
      );
      throw error;
    }
  },

  /**
   * Get current vulnerabilities
   * @returns {Promise<Array>} List of vulnerabilities
   */
  async getVulnerabilities() {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(SECURITY_ENDPOINTS.VULNERABILITIES, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch vulnerabilities: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching vulnerabilities:', error);
      throw error;
    }
  },

  /**
   * Report a security breach
   * @param {Object} breachData - Breach information
   * @returns {Promise<Object>} Breach report response
   */
  async reportBreach(breachData) {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

      const response = await fetch(SECURITY_ENDPOINTS.BREACH_REPORT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...breachData,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to report breach: ${response.status}`);
      }

      securityLogger.logSecurityEvent(
        SECURITY_EVENT_TYPES.BREACH_DETECTED,
        breachData,
        SECURITY_RISK_LEVELS.CRITICAL
      );

      return await response.json();
    } catch (error) {
      console.error('Error reporting breach:', error);
      throw error;
    }
  }
};

/**
 * Activity monitor for tracking user behavior
 */
export const activityMonitor = {
  /**
   * Track user activity
   */
  trackActivity() {
    localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, new Date().toISOString());
  },

  /**
   * Get last activity timestamp
   * @returns {Date|null} Last activity date
   */
  getLastActivity() {
    const timestamp = localStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY);
    return timestamp ? new Date(timestamp) : null;
  },

  /**
   * Check if user has been inactive for too long
   * @param {number} timeoutMinutes - Timeout in minutes
   * @returns {boolean} True if session should timeout
   */
  shouldTimeout(timeoutMinutes = 30) {
    const lastActivity = this.getLastActivity();
    if (!lastActivity) return true;

    const now = new Date();
    const diffMinutes = (now - lastActivity) / (1000 * 60);
    return diffMinutes > timeoutMinutes;
  }
};

// Initialize activity monitoring
document.addEventListener('click', () => activityMonitor.trackActivity());
document.addEventListener('keypress', () => activityMonitor.trackActivity());
document.addEventListener('scroll', () => activityMonitor.trackActivity());
