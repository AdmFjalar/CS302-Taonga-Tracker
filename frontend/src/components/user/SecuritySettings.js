import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StandardModal from '../shared/StandardModal';
import Button from '../shared/Button';
import { gdprManager } from '../../services/gdpr';
import { securityScanner, breachDetector } from '../../services/breachResponse';
import { tokenManager } from '../../services/security';
import { authAPI } from '../../services/api';
import { getFullImageUrl } from '../../services/utils';
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
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deletionReason, setDeletionReason] = useState('');
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [passwordChangeStatus, setPasswordChangeStatus] = useState('');
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // User data state
  const [user, setUser] = useState({
    firstName: "",
    lastName: "",
    userName: "",
    profilePictureUrl: "",
  });
  const [userLoading, setUserLoading] = useState(true);

  useEffect(() => {
    // Fetch user data
    const fetchUser = async () => {
      try {
        setUserLoading(true);
        const data = await authAPI.getCurrentUser();
        setUser({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          userName: data.userName || "",
          profilePictureUrl: data.profilePictureUrl || "",
        });
      } catch (err) {
        console.error("Failed to load user data:", err);
      } finally {
        setUserLoading(false);
      }
    };

    fetchUser();

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
    setShowDeleteConfirmModal(false);
    setLoading(true);
    setDeletionRequestStatus('Processing deletion request...');

    try {
      await gdprManager.requestAccountDeletion(deletionReason);
      setDeletionRequestStatus('Account deletion request submitted successfully. You will receive confirmation within 30 days.');
    } catch (error) {
      setDeletionRequestStatus('Error submitting deletion request: ' + error.message);
    } finally {
      setLoading(false);
      setDeletionReason('');
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirmModal(true);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirmModal(false);
    setDeletionReason('');
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

  const handlePasswordChange = async () => {
    setPasswordChangeLoading(true);
    setPasswordChangeStatus('');

    // Validate passwords match
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      setPasswordChangeStatus('New password and confirmation do not match.');
      setPasswordChangeLoading(false);
      return;
    }

    // Validate password requirements
    if (passwordData.newPassword.length < 12) {
      setPasswordChangeStatus('New password must be at least 12 characters long.');
      setPasswordChangeLoading(false);
      return;
    }

    try {
      await authAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmNewPassword: passwordData.confirmNewPassword
      });

      setPasswordChangeStatus('Password changed successfully! You will be logged out for security.');
      setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
      setShowPasswordForm(false);

      // Log out user after successful password change for security
      setTimeout(() => {
        tokenManager.clearToken();
        window.location.href = '/login';
      }, 2000);

    } catch (error) {
      setPasswordChangeStatus('Error changing password: ' + error.message);
    } finally {
      setPasswordChangeLoading(false);
    }
  };

  const actions = [
    <Link key="back" to="/settings">
      <Button variant="outline">
        ← Back to Settings
      </Button>
    </Link>
  ];

  return (
    <StandardModal
      isEdit={true}
      title="Security & Privacy Settings"
      photo={getFullImageUrl(user.profilePictureUrl)}
      photoAlt="Profile Picture"
      photoShape="rectangular"
      actions={actions}
      className="security-settings-modal"
    >
      {/* Cookie Preferences Section */}
      <div className="standard-modal-section">
        <h3 className="standard-section-title">Cookie Preferences</h3>
        <p className="standard-field-description">Manage your cookie and tracking preferences:</p>

        <div className="standard-modal-details-grid">
          <div className="standard-field-row">
            <div className="standard-field-label">
              <strong>Necessary Cookies</strong>
              <span className="required-badge">Required</span>
            </div>
            <div className="standard-field-value">
              <input
                type="checkbox"
                id="necessary"
                checked={consentPreferences.necessary}
                disabled={true}
                onChange={() => {}}
              />
              <label htmlFor="necessary" className="checkbox-label">
                Essential for website functionality
              </label>
            </div>
          </div>

          <div className="standard-field-row">
            <div className="standard-field-label">
              <strong>Functional Cookies</strong>
            </div>
            <div className="standard-field-value">
              <input
                type="checkbox"
                id="functional"
                checked={consentPreferences.functional}
                onChange={() => handleConsentChange('functional')}
              />
              <label htmlFor="functional" className="checkbox-label">
                Remember your preferences and settings
              </label>
            </div>
          </div>

          <div className="standard-field-row">
            <div className="standard-field-label">
              <strong>Analytics Cookies</strong>
            </div>
            <div className="standard-field-value">
              <input
                type="checkbox"
                id="analytics"
                checked={consentPreferences.analytics}
                onChange={() => handleConsentChange('analytics')}
              />
              <label htmlFor="analytics" className="checkbox-label">
                Help us understand how you use our website
              </label>
            </div>
          </div>

          <div className="standard-field-row">
            <div className="standard-field-label">
              <strong>Marketing Cookies</strong>
            </div>
            <div className="standard-field-value">
              <input
                type="checkbox"
                id="marketing"
                checked={consentPreferences.marketing}
                onChange={() => handleConsentChange('marketing')}
              />
              <label htmlFor="marketing" className="checkbox-label">
                Used for targeted advertising and communications
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Section */}
      <div className="standard-modal-section">
        <h3 className="standard-section-title">Change Password</h3>
        <div className="standard-modal-details-grid">
          <div className="standard-field-row">
            <Button
              variant={showPasswordForm ? "outline" : "primary"}
              onClick={() => setShowPasswordForm(!showPasswordForm)}
            >
              {showPasswordForm ? 'Cancel' : 'Change Password'}
            </Button>
          </div>

          {showPasswordForm && (
            <>
              <div className="standard-field-row">
                <div className="standard-field-label">Current Password</div>
                <input
                  type="password"
                  className="standard-field-input"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  placeholder="Enter current password"
                  required
                />
              </div>

              <div className="standard-field-row">
                <div className="standard-field-label">New Password</div>
                <input
                  type="password"
                  className="standard-field-input"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="Enter new password (12+ characters)"
                  required
                />
              </div>

              <div className="standard-field-row">
                <div className="standard-field-label">Confirm New Password</div>
                <input
                  type="password"
                  className="standard-field-input"
                  value={passwordData.confirmNewPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmNewPassword: e.target.value })}
                  placeholder="Confirm new password"
                  required
                />
              </div>

              <div className="standard-field-row">
                <div className="standard-field-label"></div>
                <Button
                  variant="primary"
                  onClick={handlePasswordChange}
                  disabled={passwordChangeLoading}
                >
                  {passwordChangeLoading ? 'Changing...' : 'Update Password'}
                </Button>
              </div>

              {passwordChangeStatus && (
                <div className="standard-field-row">
                  <div className="standard-field-label"></div>
                  <div className={`status-message ${passwordChangeStatus.includes('successfully') ? 'success' : 'error'}`}>
                    {passwordChangeStatus}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Session Management Section */}
      {/*<div className="standard-modal-section">*/}
      {/*  <h3 className="standard-section-title">Session Management</h3>*/}
      {/*  <div className="standard-modal-details-grid">*/}
      {/*    <div className="standard-field-row">*/}
      {/*      <div className="standard-field-label">Current Session</div>*/}
      {/*      <div className="standard-field-value">*/}
      {/*        {tokenManager.getToken() ? 'Active' : 'Not logged in'}*/}
      {/*      </div>*/}
      {/*    </div>*/}

      {/*    <div className="standard-field-row">*/}
      {/*      <div className="standard-field-label">End All Sessions</div>*/}
      {/*      <Button*/}
      {/*        variant="outline"*/}
      {/*        onClick={() => {*/}
      {/*          tokenManager.clearToken();*/}
      {/*          window.location.reload();*/}
      {/*        }}*/}
      {/*      >*/}
      {/*        Sign Out Everywhere*/}
      {/*      </Button>*/}
      {/*    </div>*/}
      {/*  </div>*/}
      {/*</div>*/}

      {/* Data Processing Information Section */}
      <div className="standard-modal-section">
        <h3 className="standard-section-title">Data Processing Information</h3>
        <div className="standard-modal-details-grid">
          <div className="standard-field-row vertical">
            <div className="standard-field-label">What data do we collect?</div>
            <div className="standard-field-value">
              <ul>
                <li>Account information (name, email, username)</li>
                <li>Family tree information and images</li>
                <li>Heirloom information and images</li>
                <li>Usage analytics (if consented)</li>
              </ul>
            </div>
          </div>

          <div className="standard-field-row vertical">
            <div className="standard-field-label">Legal basis for processing</div>
            <div className="standard-field-value">
              <ul>
                <li><strong>Contract:</strong> To provide our family heritage service</li>
                <li><strong>Consent:</strong> For analytics and marketing (optional)</li>
                <li><strong>Legitimate Interest:</strong> For security and service improvement</li>
              </ul>
            </div>
          </div>

          <div className="standard-field-row">
            <div className="standard-field-label">Privacy Policy</div>
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="standard-field-link">
              Read our detailed Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </StandardModal>
  );
};

export default SecuritySettings;
