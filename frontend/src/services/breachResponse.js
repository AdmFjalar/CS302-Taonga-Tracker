/**
 * Security breach detection and response service
 */

import { securityLogger } from './securityMonitoring';
import { SECURITY_EVENT_TYPES, SECURITY_RISK_LEVELS } from './constants';

/**
 * Breach detection and response utility
 */
export const breachDetector = {
  /**
   * Check response for potential security breaches
   * @param {Response} response - HTTP response to analyze
   */
  checkResponse(response) {
    // Check for suspicious response patterns
    if (response.status === 429) {
      this.handleRateLimitBreach();
    }

    if (response.status >= 500) {
      this.handleServerErrorBreach(response);
    }

    // Check response headers for security issues
    this.checkSecurityHeaders(response);
  },

  /**
   * Handle rate limit breach detection
   */
  handleRateLimitBreach() {
    securityLogger.logSecurityEvent(
      SECURITY_EVENT_TYPES.RATE_LIMIT_EXCEEDED,
      {
        action: 'rate_limit_breach_detected',
        timestamp: new Date().toISOString()
      },
      SECURITY_RISK_LEVELS.MEDIUM
    );
  },

  /**
   * Handle server error breach detection
   * @param {Response} response - Server error response
   */
  handleServerErrorBreach(response) {
    securityLogger.logSecurityEvent(
      SECURITY_EVENT_TYPES.SUSPICIOUS_ACTIVITY,
      {
        action: 'server_error_detected',
        status: response.status,
        url: response.url
      },
      SECURITY_RISK_LEVELS.HIGH
    );
  },

  /**
   * Check security headers in response
   * @param {Response} response - HTTP response
   */
  checkSecurityHeaders(response) {
    const requiredHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection'
    ];

    const missingHeaders = requiredHeaders.filter(header =>
      !response.headers.has(header)
    );

    if (missingHeaders.length > 0) {
      securityLogger.logSecurityEvent(
        SECURITY_EVENT_TYPES.SUSPICIOUS_ACTIVITY,
        {
          action: 'missing_security_headers',
          missingHeaders,
          url: response.url
        },
        SECURITY_RISK_LEVELS.MEDIUM
      );
    }
  }
};
