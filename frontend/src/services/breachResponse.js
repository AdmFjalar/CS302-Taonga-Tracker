/**
 * Data Breach Response and Security Incident Management
 * Handles security incidents, breach detection, and automated responses
 */

import { securityLogger } from './securityMonitoring';
import { tokenManager } from './security';
import { gdprManager } from './gdpr';

/**
 * Breach Detection System
 */
export const breachDetector = {
  /**
   * Monitor for suspicious activities
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
   * Validate token integrity
   * @param {string} token - JWT token to validate
   * @returns {boolean} True if token appears valid
   */
  validateTokenIntegrity: (token) => {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return false;
      
      // Basic JWT structure validation
      const payload = JSON.parse(atob(parts[1]));
      return payload.exp && payload.iat && payload.sub;
    } catch {
      return false;
    }
  },

  /**
   * Handle security incidents
   * @param {string} incidentType - Type of security incident
   * @param {Object} details - Incident details
   */
  handleSecurityIncident: (incidentType, details) => {
    const incident = {
      id: crypto.randomUUID(),
      type: incidentType,
      timestamp: new Date().toISOString(),
      details,
      severity: breachDetector.calculateSeverity(incidentType),
      status: 'detected'
    };

    // Log the incident
    securityLogger.logSecurityEvent(incidentType, details, incident.severity);

    // Store incident for tracking
    const incidents = JSON.parse(localStorage.getItem('security_incidents') || '[]');
    incidents.push(incident);
    localStorage.setItem('security_incidents', JSON.stringify(incidents));

    // Automated response based on severity
    switch (incident.severity) {
      case 'critical':
        breachDetector.criticalIncidentResponse(incident);
        break;
      case 'high':
        breachDetector.highSeverityResponse(incident);
        break;
      case 'medium':
        breachDetector.mediumSeverityResponse(incident);
        break;
    }
  },

  /**
   * Calculate incident severity
   * @param {string} incidentType - Type of incident
   * @returns {string} Severity level
   */
  calculateSeverity: (incidentType) => {
    const severityMap = {
      'multiple_failed_logins': 'medium',
      'token_tampering': 'critical',
      'suspicious_file_upload': 'high',
      'xss_attempt': 'high',
      'csrf_attempt': 'high',
      'data_exfiltration_attempt': 'critical',
      'unauthorized_api_access': 'high'
    };

    return severityMap[incidentType] || 'medium';
  },

  /**
   * Critical incident response
   * @param {Object} incident - Incident details
   */
  criticalIncidentResponse: (incident) => {
    // Immediately force logout
    tokenManager.clearToken();
    
    // Clear all sensitive data
    ['user_data', 'family_data', 'heirloom_data'].forEach(key => {
      localStorage.removeItem(key);
    });

    // Redirect to security notice page
    window.location.href = '/security-notice';
  },

  /**
   * High severity incident response
   * @param {Object} incident - Incident details
   */
  highSeverityResponse: (incident) => {
    // Show security warning
    if (window.confirm('Security alert: Suspicious activity detected. Logout for safety?')) {
      tokenManager.clearToken();
      window.location.href = '/login';
    }
  },

  /**
   * Medium severity incident response
   * @param {Object} incident - Incident details
   */
  mediumSeverityResponse: (incident) => {
    // Log for monitoring, no immediate action
    console.warn('Security incident detected:', incident);
  }
};

/**
 * GDPR Breach Notification System
 */
export const gdprBreachNotification = {
  /**
   * Assess if a breach requires GDPR notification
   * @param {Object} incident - Security incident
   * @returns {Object} Assessment result
   */
  assessBreachNotification: (incident) => {
    const personalDataInvolved = gdprBreachNotification.checkPersonalDataInvolvement(incident);
    const riskLevel = gdprBreachNotification.assessRisk(incident);
    
    return {
      requiresNotification: personalDataInvolved && (riskLevel === 'high' || riskLevel === 'critical'),
      timelineForNotification: personalDataInvolved ? '72 hours to DPA' : 'Not required',
      userNotificationRequired: riskLevel === 'critical',
      mitigationSteps: gdprBreachNotification.getMitigationSteps(incident.type)
    };
  },

  /**
   * Check if personal data is involved in the incident
   * @param {Object} incident - Security incident
   * @returns {boolean} True if personal data is involved
   */
  checkPersonalDataInvolvement: (incident) => {
    const personalDataIncidentTypes = [
      'data_exfiltration_attempt',
      'unauthorized_api_access',
      'token_tampering',
      'database_breach'
    ];

    return personalDataIncidentTypes.includes(incident.type);
  },

  /**
   * Assess risk level of the incident
   * @param {Object} incident - Security incident
   * @returns {string} Risk level
   */
  assessRisk: (incident) => {
    const criticalTypes = ['data_exfiltration_attempt', 'database_breach'];
    const highTypes = ['unauthorized_api_access', 'token_tampering'];
    
    if (criticalTypes.includes(incident.type)) return 'critical';
    if (highTypes.includes(incident.type)) return 'high';
    return 'medium';
  },

  /**
   * Get mitigation steps for incident type
   * @param {string} incidentType - Type of incident
   * @returns {string[]} List of mitigation steps
   */
  getMitigationSteps: (incidentType) => {
    const mitigationMap = {
      'token_tampering': [
        'Force logout all sessions',
        'Regenerate authentication tokens',
        'Review access logs',
        'Update security policies'
      ],
      'data_exfiltration_attempt': [
        'Block suspicious IP addresses',
        'Audit data access logs',
        'Notify affected users',
        'Review data protection measures'
      ],
      'unauthorized_api_access': [
        'Review API access controls',
        'Update authentication mechanisms',
        'Monitor API usage patterns',
        'Implement additional rate limiting'
      ]
    };

    return mitigationMap[incidentType] || ['Review security measures', 'Monitor for similar incidents'];
  }
};

/**
 * Automated Security Scanning
 */
export const securityScanner = {
  /**
   * Perform comprehensive security scan
   * @returns {Object} Scan results
   */
  performSecurityScan: () => {
    const results = {
      timestamp: new Date().toISOString(),
      vulnerabilities: [],
      recommendations: [],
      score: 100
    };

    // Check for insecure storage
    const insecureItems = securityScanner.checkInsecureStorage();
    if (insecureItems.length > 0) {
      results.vulnerabilities.push({
        type: 'insecure_storage',
        severity: 'medium',
        description: 'Sensitive data stored insecurely',
        items: insecureItems
      });
      results.score -= 20;
    }

    // Check for expired tokens
    if (securityScanner.checkExpiredTokens()) {
      results.vulnerabilities.push({
        type: 'expired_tokens',
        severity: 'low',
        description: 'Expired authentication tokens found'
      });
      results.score -= 10;
    }

    // Check browser security
    const browserSecurityIssues = securityScanner.checkBrowserSecurity();
    if (browserSecurityIssues.length > 0) {
      results.vulnerabilities.push({
        type: 'browser_security',
        severity: 'medium',
        description: 'Browser security concerns detected',
        issues: browserSecurityIssues
      });
      results.score -= 15;
    }

    // Generate recommendations
    results.recommendations = securityScanner.generateRecommendations(results.vulnerabilities);

    return results;
  },

  /**
   * Check for insecurely stored data
   * @returns {string[]} List of insecure storage items
   */
  checkInsecureStorage: () => {
    const insecureItems = [];
    const sensitiveKeys = ['password', 'secret', 'key', 'token'];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        const value = localStorage.getItem(key);
        if (value && !value.startsWith('encrypted_')) {
          insecureItems.push(key);
        }
      }
    }

    return insecureItems;
  },

  /**
   * Check for expired tokens
   * @returns {boolean} True if expired tokens found
   */
  checkExpiredTokens: () => {
    const expiration = localStorage.getItem('token_expiration');
    return expiration && Date.now() > parseInt(expiration);
  },

  /**
   * Check browser security settings
   * @returns {string[]} List of security issues
   */
  checkBrowserSecurity: () => {
    const issues = [];

    // Check if HTTPS is being used
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      issues.push('Not using HTTPS');
    }

    // Check for mixed content
    if (window.location.protocol === 'https:' && document.querySelectorAll('img[src^="http:"]').length > 0) {
      issues.push('Mixed content detected');
    }

    // Check for inline scripts (basic check)
    if (document.querySelectorAll('script:not([src])').length > 2) {
      issues.push('Multiple inline scripts detected');
    }

    return issues;
  },

  /**
   * Generate security recommendations
   * @param {Array} vulnerabilities - List of vulnerabilities
   * @returns {string[]} List of recommendations
   */
  generateRecommendations: (vulnerabilities) => {
    const recommendations = [];

    vulnerabilities.forEach(vuln => {
      switch (vuln.type) {
        case 'insecure_storage':
          recommendations.push('Implement client-side encryption for sensitive data');
          break;
        case 'expired_tokens':
          recommendations.push('Implement automatic token refresh mechanism');
          break;
        case 'browser_security':
          recommendations.push('Review Content Security Policy and HTTPS implementation');
          break;
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('Security posture looks good! Continue monitoring.');
    }

    return [...new Set(recommendations)]; // Remove duplicates
  }
};
