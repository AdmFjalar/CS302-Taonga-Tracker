import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Button from '../shared/Button';
import { gdprManager } from '../../services/gdpr';
import { securityScanner, breachDetector } from '../../services/breachResponse';
import { tokenManager } from '../../services/security';
import { authAPI } from '../../services/api';
import { getFullImageUrl } from '../../services/utils';
import StandardModal from '../shared/StandardModal';
import '../../styles/shared/StandardModal.css';

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
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deletionReason, setDeletionReason] = useState('');

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [passwordChangeStatus, setPasswordChangeStatus] = useState('');
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const [user, setUser] = useState({
    firstName: "",
    lastName: "",
    userName: "",
    profilePictureUrl: "",
  });
  const [userLoading, setUserLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await authAPI.getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      } finally {
        setUserLoading(false);
      }
    };

    const loadConsentPreferences = () => {
      const saved = localStorage.getItem('cookie_consent');
      if (saved) {
        setConsentPreferences(JSON.parse(saved));
      }
    };

    fetchUser();
    loadConsentPreferences();
  }, []);

  const handleConsentChange = (type) => {
    if (type === 'necessary') return;
    const updated = {
      ...consentPreferences,
      [type]: !consentPreferences[type]
    };
    setConsentPreferences(updated);
    localStorage.setItem('cookie_consent', JSON.stringify(updated));
  };

  const handleDataExport = async () => {
    try {
      setDataExportStatus('Preparing your data...');
      await gdprManager.downloadUserData();
      setDataExportStatus('Data exported successfully!');
      setTimeout(() => setDataExportStatus(''), 3000);
    } catch (error) {
      setDataExportStatus('Export failed. Please try again.');
      setTimeout(() => setDataExportStatus(''), 3000);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      setPasswordChangeStatus('Passwords do not match');
      return;
    }

    try {
      setPasswordChangeLoading(true);
      await authAPI.changePassword(passwordData);
      setPasswordChangeStatus('Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
      setShowPasswordForm(false);
    } catch (error) {
      setPasswordChangeStatus('Failed to change password');
    } finally {
      setPasswordChangeLoading(false);
    }
  };

  const handleAccountDeletion = async () => {
    try {
      setDeletionRequestStatus('Processing deletion request...');
      await gdprManager.requestAccountDeletion();
      setDeletionRequestStatus('Account deletion completed');
      setShowDeleteConfirmModal(false);
    } catch (error) {
      setDeletionRequestStatus('Deletion failed. Please contact support.');
    }
  };

  const runSecurityScan = async () => {
    setLoading(true);
    setSecurityScan(null);

    try {
      const scanResults = {
        lastScan: new Date().toISOString(),
        issues: [],
        warnings: [],
        status: 'secure',
        score: 100
      };

      // Check password strength (if we can access password metadata)
      try {
        const passwordInfo = await authAPI.getPasswordMetadata();
        if (passwordInfo.lastChanged) {
          const daysSinceChange = Math.floor((Date.now() - new Date(passwordInfo.lastChanged)) / (1000 * 60 * 60 * 24));
          if (daysSinceChange > 180) {
            scanResults.warnings.push({
              type: 'password_age',
              message: `Password is ${daysSinceChange} days old. Consider changing it.`,
              severity: 'medium'
            });
            scanResults.score -= 10;
          }
        }

        if (passwordInfo.strength && passwordInfo.strength < 3) {
          scanResults.issues.push({
            type: 'weak_password',
            message: 'Your password could be stronger. Consider using a longer password with mixed characters.',
            severity: 'high'
          });
          scanResults.score -= 25;
        }
      } catch (error) {
        console.log('Password metadata not available');
      }

      // Check for recent login anomalies
      try {
        const loginHistory = await authAPI.getRecentLogins();
        const suspiciousLogins = loginHistory.filter(login =>
          login.flagged ||
          (login.location && login.location !== user.lastKnownLocation)
        );

        if (suspiciousLogins.length > 0) {
          scanResults.warnings.push({
            type: 'suspicious_login',
            message: `${suspiciousLogins.length} potentially suspicious login(s) detected in the last 30 days.`,
            severity: 'medium'
          });
          scanResults.score -= 15;
        }
      } catch (error) {
        console.log('Login history not available');
      }

      // Check session security
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const tokenData = JSON.parse(atob(token.split('.')[1]));
          const expirationTime = tokenData.exp * 1000;
          const timeUntilExpiration = expirationTime - Date.now();

          if (timeUntilExpiration > 24 * 60 * 60 * 1000) {
            scanResults.warnings.push({
              type: 'long_session',
              message: 'Your session is set to last more than 24 hours. Consider shorter sessions for better security.',
              severity: 'low'
            });
            scanResults.score -= 5;
          }
        } catch (error) {
          scanResults.issues.push({
            type: 'invalid_token',
            message: 'Your authentication token appears to be corrupted.',
            severity: 'high'
          });
          scanResults.score -= 30;
        }
      }

      // Check browser security features
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        scanResults.issues.push({
          type: 'insecure_connection',
          message: 'You are not using a secure HTTPS connection.',
          severity: 'critical'
        });
        scanResults.score -= 40;
      }

      // Check for shared account indicators
      if (user.email && user.email.includes('shared') || user.email.includes('team')) {
        scanResults.warnings.push({
          type: 'shared_account',
          message: 'This appears to be a shared account. Consider using individual accounts for better security.',
          severity: 'medium'
        });
        scanResults.score -= 10;
      }

      // Check cookie security
      const cookies = document.cookie.split(';');
      const secureCookies = cookies.filter(cookie => cookie.includes('Secure'));
      if (cookies.length > 0 && secureCookies.length === 0) {
        scanResults.warnings.push({
          type: 'insecure_cookies',
          message: 'Some cookies are not marked as secure.',
          severity: 'low'
        });
        scanResults.score -= 5;
      }

      // Determine overall status
      if (scanResults.issues.length > 0) {
        const criticalIssues = scanResults.issues.filter(issue => issue.severity === 'critical');
        const highIssues = scanResults.issues.filter(issue => issue.severity === 'high');

        if (criticalIssues.length > 0) {
          scanResults.status = 'critical';
        } else if (highIssues.length > 0) {
          scanResults.status = 'vulnerable';
        } else {
          scanResults.status = 'needs_attention';
        }
      } else if (scanResults.warnings.length > 0) {
        scanResults.status = 'good';
      } else {
        scanResults.status = 'excellent';
      }

      setSecurityScan(scanResults);
    } catch (error) {
      console.error('Security scan failed:', error);
      setSecurityScan({
        lastScan: new Date().toISOString(),
        issues: [{
          type: 'scan_error',
          message: 'Security scan could not be completed. Please try again.',
          severity: 'medium'
        }],
        warnings: [],
        status: 'error',
        score: 0
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <StandardModal
      title="Security & Privacy Settings"
      subtitle="Manage your account security and privacy preferences"
      photo={getFullImageUrl(user.profilePictureUrl)}
      photoAlt={`${user.firstName} ${user.lastName}`}
      photoShape="rectangular"
      className="security-settings-modal"
      actions={
        <div className="settings-actions">
          <Link to="/settings">
            <Button variant="secondary">Back to Settings</Button>
          </Link>
        </div>
      }
    >
      <div className="standard-modal-details-grid">
        {/* Password Security Section */}
        <div className="standard-field-row">
          <div className="standard-field-label">Password Security</div>
          <div className="standard-field-value">
            <p>Keep your account secure with a strong password.</p>
            {!showPasswordForm ? (
              <Button onClick={() => setShowPasswordForm(true)} variant="secondary">
                Change Password
              </Button>
            ) : (
              <form onSubmit={handlePasswordChange}>
                <div className="standard-field-row">
                  <div className="standard-field-label">Current Password</div>
                  <input
                    className="standard-field-input"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({
                      ...prev,
                      currentPassword: e.target.value
                    }))}
                    required
                  />
                </div>
                <div className="standard-field-row">
                  <div className="standard-field-label">New Password</div>
                  <input
                    className="standard-field-input"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({
                      ...prev,
                      newPassword: e.target.value
                    }))}
                    required
                  />
                </div>
                <div className="standard-field-row">
                  <div className="standard-field-label">Confirm New Password</div>
                  <input
                    className="standard-field-input"
                    type="password"
                    value={passwordData.confirmNewPassword}
                    onChange={(e) => setPasswordData(prev => ({
                      ...prev,
                      confirmNewPassword: e.target.value
                    }))}
                    required
                  />
                </div>
                <div className="standard-modal-actions">
                  <Button type="submit" variant="primary" disabled={passwordChangeLoading}>
                    {passwordChangeLoading ? 'Changing...' : 'Change Password'}
                  </Button>
                  <Button onClick={() => setShowPasswordForm(false)} variant="secondary">
                    Cancel
                  </Button>
                </div>
              </form>
            )}
            {passwordChangeStatus && (
              <p className="standard-modal-field-hint">{passwordChangeStatus}</p>
            )}
          </div>
        </div>

        {/* Privacy & Data Section */}
        <div className="standard-field-row">
          <div className="standard-field-label">Cookie Preferences</div>
          <div className="standard-field-value">
            <div className="standard-field-row">
              <label className="standard-modal-related-tag">
                <input
                  type="checkbox"
                  checked={consentPreferences.necessary}
                  disabled
                />
                <span>Necessary Cookies (Required)</span>
              </label>
            </div>
            <div className="standard-field-row">
              <label className="standard-modal-related-tag">
                <input
                  type="checkbox"
                  checked={consentPreferences.functional}
                  onChange={() => handleConsentChange('functional')}
                />
                <span>Functional Cookies</span>
              </label>
            </div>
            <div className="standard-field-row">
              <label className="standard-modal-related-tag">
                <input
                  type="checkbox"
                  checked={consentPreferences.analytics}
                  onChange={() => handleConsentChange('analytics')}
                />
                <span>Analytics Cookies</span>
              </label>
            </div>
            <div className="standard-field-row">
              <label className="standard-modal-related-tag">
                <input
                  type="checkbox"
                  checked={consentPreferences.marketing}
                  onChange={() => handleConsentChange('marketing')}
                />
                <span>Marketing Cookies</span>
              </label>
            </div>
          </div>
        </div>

        {/* Data Export Section */}
        <div className="standard-field-row">
          <div className="standard-field-label">Data Export</div>
          <div className="standard-field-value">
            <p>Download all your personal data in a portable format.</p>
            <Button onClick={handleDataExport} variant="secondary">
              Download My Data
            </Button>
            {dataExportStatus && (
              <p className="standard-modal-field-hint">{dataExportStatus}</p>
            )}
          </div>
        </div>

        {/* Security Scan Section */}
        <div className="standard-field-row">
          <div className="standard-field-label">Security Scan</div>
          <div className="standard-field-value">
            <p>Run a security scan to check for potential vulnerabilities.</p>
            <Button onClick={runSecurityScan} variant="secondary" disabled={loading}>
              {loading ? 'Scanning...' : 'Run Security Scan'}
            </Button>
            {securityScan && (
              <div className="standard-modal-field-hint">
                <p><strong>Last scan:</strong> {new Date(securityScan.lastScan).toLocaleString()}</p>
                <p><strong>Security Score:</strong> {securityScan.score}/100</p>
                <p><strong>Status:</strong>
                  <span style={{
                    color: securityScan.status === 'excellent' ? 'green' :
                          securityScan.status === 'good' ? 'lightgreen' :
                          securityScan.status === 'needs_attention' ? 'orange' :
                          securityScan.status === 'vulnerable' ? 'red' :
                          securityScan.status === 'critical' ? 'darkred' : 'gray',
                    fontWeight: 'bold',
                    marginLeft: '0.5rem'
                  }}>
                    {securityScan.status.toUpperCase()}
                  </span>
                </p>

                {securityScan.issues.length > 0 && (
                  <div style={{ marginTop: '1rem' }}>
                    <strong style={{ color: 'red' }}>Security Issues:</strong>
                    <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                      {securityScan.issues.map((issue, index) => (
                        <li key={index} style={{ marginBottom: '0.5rem' }}>
                          <span style={{
                            color: issue.severity === 'critical' ? 'darkred' :
                                   issue.severity === 'high' ? 'red' :
                                   issue.severity === 'medium' ? 'orange' : 'gray',
                            fontWeight: 'bold'
                          }}>
                            [{issue.severity.toUpperCase()}]
                          </span> {issue.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {securityScan.warnings.length > 0 && (
                  <div style={{ marginTop: '1rem' }}>
                    <strong style={{ color: 'orange' }}>Security Warnings:</strong>
                    <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                      {securityScan.warnings.map((warning, index) => (
                        <li key={index} style={{ marginBottom: '0.5rem' }}>
                          <span style={{
                            color: warning.severity === 'medium' ? 'orange' : 'gray',
                            fontWeight: 'bold'
                          }}>
                            [{warning.severity.toUpperCase()}]
                          </span> {warning.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {securityScan.issues.length === 0 && securityScan.warnings.length === 0 && (
                  <p style={{ color: 'green', fontWeight: 'bold', marginTop: '1rem' }}>
                    ✅ No security issues detected. Your account security looks excellent!
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Account Deletion Section */}
        <div className="standard-field-row">
          <div className="standard-field-label">Delete Account</div>
          <div className="standard-field-value">
            <p>Permanently delete your account and all associated data.</p>
            <Button onClick={() => setShowDeleteConfirmModal(true)} variant="delete">
              Delete Account
            </Button>
            {deletionRequestStatus && (
              <p className="standard-modal-field-hint">{deletionRequestStatus}</p>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && (
        <div className="standard-modal-container" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1000, background: 'white', border: '2px solid #ccc' }}>
          <div className="standard-modal-content">
            <h3>Confirm Account Deletion</h3>
            <p>This action cannot be undone. All your data will be permanently deleted.</p>
            <div className="standard-field-row">
              <div className="standard-field-label">Reason for deletion (optional):</div>
              <textarea
                className="standard-field-input"
                value={deletionReason}
                onChange={(e) => setDeletionReason(e.target.value)}
                placeholder="Tell us why you're leaving..."
                rows={3}
              />
            </div>
          </div>
          <div className="standard-modal-actions">
            <Button onClick={handleAccountDeletion} variant="delete">
              Confirm Deletion
            </Button>
            <Button onClick={() => setShowDeleteConfirmModal(false)} variant="secondary">
              Cancel
            </Button>
          </div>
        </div>
      )}
    </StandardModal>
  );
};

export default SecuritySettings;
