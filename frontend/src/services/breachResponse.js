/**
 * Data breach response and security incident management.
 * Handles breach detection, incident response, and automated security measures.
 */

import { securityLogger } from './securityMonitoring';
import { tokenManager } from './security';
import { gdprManager } from './gdpr';

/**
 * Breach detection and response system.
 */
export const breachDetector = {
  /**
   * Monitor for suspicious activities and potential breaches.
   */
  monitorSuspiciousActivity: () => {
    // Monitor for multiple failed login attempts
    const failedAttempts = JSON.parse(localStorage.getItem('failed_login_attempts') || '[]');
    const recentAttempts = failedAttempts.filter(
      attempt => Date.now() - new Date(attempt.timestamp).getTime() < 300000 // 5 minutes
    );

    if (recentAttempts.length >= 5) {
      breachDetector.handleSecurityIncident('multiple_failed_logins', {
        attempts: recentAttempts.length,
        timeframe: '5 minutes'
      });
    }

    // Monitor for token tampering
    const token = tokenManager.getToken();
    if (token && !breachDetector.validateTokenIntegrity(token)) {
      breachDetector.handleSecurityIncident('token_tampering', {
        suspectedToken: token.substring(0, 20) + '...'
      });
    }
  },

  /**
   * Validate JWT token integrity.
   * @param {string} token - JWT token to validate
   * @returns {boolean} True if token appears valid
   */
  validateTokenIntegrity: (token) => {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return false;
      
      const payload = JSON.parse(atob(parts[1]));
      return payload.exp && payload.iat && payload.exp > payload.iat;
    } catch (error) {
      return false;
    }
  },

  /**
   * Check API response for signs of compromise.
   * @param {Response} response - Fetch response object
   */
  checkResponse: (response) => {
    // Check for suspicious headers
    const suspiciousHeaders = ['x-powered-by', 'server'];
    suspiciousHeaders.forEach(header => {
      const value = response.headers.get(header);
      if (value && value.includes('hack')) {
        breachDetector.handleSecurityIncident('suspicious_response_header', {
          header,
          value
        });
      }
    });

    // Monitor for unusual status codes
    if (response.status === 418) { // I'm a teapot - often used by attackers
      breachDetector.handleSecurityIncident('unusual_status_code', {
        status: response.status,
        url: response.url
      });
    }
  },

  /**
   * Handle security incidents with appropriate response.
   * @param {string} incidentType - Type of security incident
   * @param {Object} details - Incident details
   */
  handleSecurityIncident: (incidentType, details) => {
    securityLogger.logSecurityEvent(incidentType, details, 'high');

    // Implement response based on incident severity
    switch (incidentType) {
      case 'multiple_failed_logins':
        breachDetector.lockAccount();
        break;
      case 'token_tampering':
        breachDetector.invalidateSession();
        break;
      case 'data_exfiltration':
        breachDetector.emergencyLockdown();
        break;
      default:
        // Log and continue monitoring
        break;
    }
  },

  /**
   * Temporarily lock user account.
   */
  lockAccount: () => {
    localStorage.setItem('account_locked', Date.now().toString());
    alert('Account temporarily locked due to suspicious activity. Please contact support.');
  },

  /**
   * Invalidate current session and force re-authentication.
   */
  invalidateSession: () => {
    tokenManager.clearToken();
    window.dispatchEvent(new CustomEvent('securityBreach'));
    window.location.href = '/login';
  },

  /**
   * Emergency lockdown procedure.
   */
  emergencyLockdown: () => {
    gdprManager.clearLocalData();
    tokenManager.clearToken();
    alert('Security breach detected. All data has been cleared for your protection.');
    window.location.href = '/';
  }
};

/**
 * Incident response coordinator.
 */
export const incidentResponse = {
  /**
   * Report security incident to authorities.
   * @param {Object} incident - Incident details
   */
  reportIncident: (incident) => {
    // In production, this would integrate with incident management systems
    console.error('SECURITY INCIDENT REPORTED:', incident);

    securityLogger.logSecurityEvent('incident_reported', {
      incidentId: Date.now(),
      reportedAt: new Date().toISOString(),
      ...incident
    }, 'critical');
  },

  /**
   * Notify users of security incidents.
   * @param {string} message - Notification message
   * @param {string} [severity='medium'] - Incident severity
   */
  notifyUsers: (message, severity = 'medium') => {
    // Display user notification
    const notification = document.createElement('div');
    notification.className = `security-notification severity-${severity}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      document.body.removeChild(notification);
    }, 10000);
  }
};
