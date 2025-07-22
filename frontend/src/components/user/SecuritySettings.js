import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../shared/Button';
import { gdprManager } from '../../services/gdpr';
import { securityScanner, breachDetector } from '../../services/breachResponse';
import { tokenManager } from '../../services/security';
import { authAPI } from '../../services/api';
import { getFullImageUrl } from '../../services/utils';
import { SECURITY_ENDPOINTS } from '../../services/constants';
import StandardModal from '../shared/StandardModal';
import LoadingScreen from '../ui/LoadingScreen';
import AuthErrorOverlay from '../ui/AuthErrorOverlay';
import { isAuthError } from '../../services/authErrorUtils';
import '../../styles/shared/StandardModal.css';
import '../../styles/user/SecuritySettings.css';

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
  const [deletingAccount, setDeletingAccount] = useState(false);

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
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await authAPI.getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        setError(error.message || error.toString());
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
      setDeletingAccount(true);
      setDeletionRequestStatus('Processing deletion request...');
      await gdprManager.requestAccountDeletion();
      setDeletionRequestStatus('Account deletion completed');
      setShowDeleteConfirmModal(false);
    } catch (error) {
      setDeletionRequestStatus('Deletion failed. Please contact support.');
    } finally {
      setDeletingAccount(false);
    }
  };

  const runSecurityScan = async () => {
    setLoading(true);
    setSecurityScan(null);

    try {
      // Call the actual security scan API endpoint
      const response = await fetch(SECURITY_ENDPOINTS.SCAN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenManager.getToken()}`
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

      const apiResult = await response.json();

      // Transform API response to match UI expectations
      const scanResults = {
        lastScan: apiResult.scanTimestamp,
        issues: [],
        warnings: [],
        status: 'secure',
        score: Math.max(0, 100 - Math.round(apiResult.riskScore)) // Convert risk score to security score
      };

      // Process vulnerabilities from API
      if (apiResult.vulnerabilities && apiResult.vulnerabilities.length > 0) {
        apiResult.vulnerabilities.forEach(vuln => {
          const vulnerability = {
            type: vuln.type.toLowerCase(),
            message: `${vuln.description}. ${vuln.recommendation}`,
            severity: vuln.severity
          };

          // Categorize by severity
          if (vuln.severity === 'critical' || vuln.severity === 'high') {
            scanResults.issues.push(vulnerability);
          } else {
            scanResults.warnings.push(vulnerability);
          }
        });
      }

      // Determine overall status based on vulnerabilities
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

  // Show loading screen while fetching user data
  if (userLoading) {
    return <LoadingScreen message="Loading security settings..." />;
  }

  // Show error state for authentication issues
  if (error) {
    if (isAuthError(error)) {
      return <AuthErrorOverlay error={error} />;
    }

    return (
      <div className="error-container">
        <h2>Error Loading Security Settings</h2>
        <p>{error}</p>
      </div>
    );
  }

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
        <div
          className="delete-modal-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
        >
          <div
            className="delete-modal-content"
            style={{
              background: 'white',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              maxWidth: '500px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                padding: '1.5rem',
                borderBottom: '1px solid #e5e7eb',
                flexShrink: 0
              }}
            >
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', fontWeight: 'bold' }}>
                Confirm Account Deletion
              </h3>
              <p style={{ margin: '0', color: '#6b7280' }}>
                This action cannot be undone. All your data will be permanently deleted including:
              </p>
              <ul style={{ margin: '0.75rem 0', paddingLeft: '1.25rem', color: '#6b7280' }}>
                <li>Your user profile and account information</li>
                <li>All family member records you've created</li>
                <li>All heirloom records and associated media</li>
                <li>All uploaded images and documents</li>
                <li>Your activity and security logs</li>
              </ul>
            </div>

            <div
              style={{
                padding: '1.5rem',
                flexGrow: 1,
                overflow: 'auto'
              }}
            >
              <div className="standard-field-row">
                <div className="standard-field-label" style={{ marginBottom: '0.5rem' }}>
                  Reason for deletion (optional):
                </div>
                <textarea
                  className="standard-field-input"
                  value={deletionReason}
                  onChange={(e) => setDeletionReason(e.target.value)}
                  placeholder="Tell us why you're leaving..."
                  rows={3}
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>

            <div
              style={{
                padding: '1rem 1.5rem 1.5rem',
                borderTop: '1px solid #e5e7eb',
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'flex-end',
                flexShrink: 0
              }}
            >
              <Button
                onClick={() => setShowDeleteConfirmModal(false)}
                variant="secondary"
                disabled={deletingAccount}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAccountDeletion}
                variant="delete"
                disabled={deletingAccount}
              >
                {deletingAccount ? 'Deleting...' : 'Confirm Deletion'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Screen for Account Deletion */}
      {(deletionRequestStatus.includes('Processing') || deletingAccount) && (
        <LoadingScreen message={deletionRequestStatus} />
      )}
    </StandardModal>
  );
};

export default SecuritySettings;
