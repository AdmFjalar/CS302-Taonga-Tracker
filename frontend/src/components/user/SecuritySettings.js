import React, { useState, useEffect } from 'react';
import { gdprManager } from '../../services/gdpr';
import { securityScanner, breachDetector } from '../../services/breachResponse';
import { tokenManager } from '../../services/security';
import '../../styles/user/SecuritySettings.css';

/**
 * Security and Privacy Settings Component
 * Provides users with GDPR rights management and security controls
 */
const SecuritySettings = () => {
  const [consentPreferences, setConsentPreferences] = useState({
    necessary: true,
    functional: false,
    analytics: false,
    marketing: false
  });
  const [securityScan, setSecurityScan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dataExportStatus, setDataExportStatus] = useState('');
  const [deletionRequestStatus, setDeletionRequestStatus] = useState('');

  useEffect(() => {
    // Load current consent preferences
    const currentConsent = gdprManager.getConsentStatus();
    if (currentConsent) {
      setConsentPreferences(currentConsent);
    }

    // Run security scan on component mount
    performSecurityScan();
  }, []);

  const performSecurityScan = () => {
    const scanResults = securityScanner.performSecurityScan();
    setSecurityScan(scanResults);
  };

  const handleConsentChange = (type) => {
    if (type === 'necessary') return; // Cannot disable necessary cookies

    const updatedPreferences = {
      ...consentPreferences,
      [type]: !consentPreferences[type]
    };

    setConsentPreferences(updatedPreferences);
    gdprManager.updateConsentPreferences(updatedPreferences);
  };

  const handleDataExport = async () => {
    setLoading(true);
    setDataExportStatus('Preparing your data export...');

    try {
      await gdprManager.downloadUserData();
      setDataExportStatus('Data export completed successfully!');
    } catch (error) {
      setDataExportStatus('Error exporting data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAccountDeletion = async () => {
    const reason = prompt('Please provide a reason for account deletion (optional):');

    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    setDeletionRequestStatus('Processing deletion request...');

    try {
      await gdprManager.requestAccountDeletion(reason);
      setDeletionRequestStatus('Account deletion request submitted successfully. You will receive confirmation within 30 days.');
    } catch (error) {
      setDeletionRequestStatus('Error submitting deletion request: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSecurityIncidentCheck = () => {
    breachDetector.monitorSuspiciousActivity();
    performSecurityScan();
  };

  const getSecurityScoreColor = (score) => {
    if (score >= 80) return 'security-score-good';
    if (score >= 60) return 'security-score-warning';
    return 'security-score-danger';
  };

  return (
    <div className="security-settings">
      <h1>Security & Privacy Settings</h1>

      {/* GDPR Rights Section */}
      <section className="settings-section">
        <h2>Your Privacy Rights (GDPR)</h2>
        <p>Under GDPR, you have the following rights regarding your personal data:</p>

        <div className="gdpr-rights">
          <div className="gdpr-right">
            <h3>Right to Access</h3>
            <p>Download a copy of all your personal data we have stored.</p>
            <button
              onClick={handleDataExport}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Exporting...' : 'Export My Data'}
            </button>
            {dataExportStatus && <p className="status-message">{dataExportStatus}</p>}
          </div>

          <div className="gdpr-right">
            <h3>Right to Erasure</h3>
            <p>Request complete deletion of your account and all associated data.</p>
            <button
              onClick={handleAccountDeletion}
              disabled={loading}
              className="btn-danger"
            >
              Delete My Account
            </button>
            {deletionRequestStatus && <p className="status-message">{deletionRequestStatus}</p>}
          </div>
        </div>
      </section>

      {/* Cookie Consent Management */}
      <section className="settings-section">
        <h2>Cookie Preferences</h2>
        <p>Manage your cookie and tracking preferences:</p>

        <div className="cookie-preferences">
          <div className="cookie-category">
            <div className="cookie-header">
              <input
                type="checkbox"
                id="necessary"
                checked={consentPreferences.necessary}
                disabled={true}
                onChange={() => {}}
              />
              <label htmlFor="necessary">
                <strong>Necessary Cookies</strong>
                <span className="required">Required</span>
              </label>
            </div>
            <p>Essential for website functionality. Cannot be disabled.</p>
          </div>

          <div className="cookie-category">
            <div className="cookie-header">
              <input
                type="checkbox"
                id="functional"
                checked={consentPreferences.functional}
                onChange={() => handleConsentChange('functional')}
              />
              <label htmlFor="functional">
                <strong>Functional Cookies</strong>
              </label>
            </div>
            <p>Remember your preferences and settings.</p>
          </div>

          <div className="cookie-category">
            <div className="cookie-header">
              <input
                type="checkbox"
                id="analytics"
                checked={consentPreferences.analytics}
                onChange={() => handleConsentChange('analytics')}
              />
              <label htmlFor="analytics">
                <strong>Analytics Cookies</strong>
              </label>
            </div>
            <p>Help us understand how you use our website.</p>
          </div>

          <div className="cookie-category">
            <div className="cookie-header">
              <input
                type="checkbox"
                id="marketing"
                checked={consentPreferences.marketing}
                onChange={() => handleConsentChange('marketing')}
              />
              <label htmlFor="marketing">
                <strong>Marketing Cookies</strong>
              </label>
            </div>
            <p>Used for targeted advertising and marketing communications.</p>
          </div>
        </div>
      </section>

      {/* Security Dashboard */}
      <section className="settings-section">
        <h2>Security Dashboard</h2>

        {securityScan && (
          <div className="security-dashboard">
            <div className={`security-score ${getSecurityScoreColor(securityScan.score)}`}>
              <h3>Security Score: {securityScan.score}/100</h3>
            </div>

            {securityScan.vulnerabilities.length > 0 && (
              <div className="security-vulnerabilities">
                <h4>Security Issues Found:</h4>
                {securityScan.vulnerabilities.map((vuln, index) => (
                  <div key={index} className={`vulnerability vulnerability-${vuln.severity}`}>
                    <strong>{vuln.description}</strong>
                    <p>Severity: {vuln.severity}</p>
                  </div>
                ))}
              </div>
            )}

            {securityScan.recommendations.length > 0 && (
              <div className="security-recommendations">
                <h4>Security Recommendations:</h4>
                <ul>
                  {securityScan.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={handleSecurityIncidentCheck}
              className="btn-secondary"
            >
              Run Security Check
            </button>
          </div>
        )}
      </section>

      {/* Session Management */}
      <section className="settings-section">
        <h2>Session Management</h2>
        <div className="session-info">
          <p>Current session expires: {tokenManager.getToken() ? 'Active' : 'Not logged in'}</p>
          <button
            onClick={() => {
              tokenManager.clearToken();
              window.location.reload();
            }}
            className="btn-outline"
          >
            End All Sessions
          </button>
        </div>
      </section>

      {/* Data Processing Information */}
      <section className="settings-section">
        <h2>Data Processing Information</h2>
        <div className="data-processing-info">
          <h4>What data do we collect?</h4>
          <ul>
            <li>Account information (name, email, username)</li>
            <li>Family tree data you provide</li>
            <li>Heirloom information and images</li>
            <li>Usage analytics (if consented)</li>
          </ul>

          <h4>Legal basis for processing:</h4>
          <ul>
            <li><strong>Contract:</strong> To provide our family heritage service</li>
            <li><strong>Consent:</strong> For analytics and marketing (optional)</li>
            <li><strong>Legitimate Interest:</strong> For security and service improvement</li>
          </ul>

          <p>
            For detailed information, please read our{' '}
            <a href="/privacy" target="_blank" rel="noopener noreferrer">
              Privacy Policy
            </a>
          </p>
        </div>
      </section>
    </div>
  );
};

export default SecuritySettings;
