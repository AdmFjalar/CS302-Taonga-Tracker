/**
 * GDPR compliance service for data export, deletion, and privacy rights
 */

import { authAPI, familyAPI, vaultAPI } from './api';
import { GDPR_ENDPOINTS } from './constants';
import { securityLogger } from './securityMonitoring';
import { SECURITY_EVENT_TYPES, SECURITY_RISK_LEVELS } from './constants';

/**
 * GDPR compliance service
 */
export const gdprService = {
  /**
   * Export all user data in compliance with GDPR Article 20 (Data Portability)
   * @returns {Promise<void>} Downloads a complete data export
   */
  exportUserData: async () => {
    try {
      securityLogger.logSecurityEvent(
        SECURITY_EVENT_TYPES.DATA_EXPORT,
        { action: 'data_export_initiated' },
        SECURITY_RISK_LEVELS.MEDIUM
      );

      // Fetch all user data in parallel
      const [
        userProfile,
        familyMembers,
        heirlooms
      ] = await Promise.all([
        authAPI.getCurrentUser(),
        familyAPI.getAll().catch(() => []), // Handle if no family members exist
        vaultAPI.getAll().catch(() => [])   // Handle if no heirlooms exist
      ]);

      // Compile comprehensive data export
      const exportData = {
        exportInfo: {
          exportDate: new Date().toISOString(),
          exportVersion: '1.0',
          format: 'JSON',
          description: 'Complete user data export as per GDPR Article 20'
        },
        userProfile: {
          ...userProfile,
          // Remove sensitive fields that shouldn't be exported
          password: undefined,
          passwordHash: undefined
        },
        familyMembers: familyMembers.map(member => ({
          ...member,
          // Remove any sensitive fields if they exist
          password: undefined,
          passwordHash: undefined
        })),
        heirlooms: heirlooms.map(heirloom => ({
          ...heirloom,
          // Remove any sensitive fields if they exist
          password: undefined,
          passwordHash: undefined
        })),
        metadata: {
          totalFamilyMembers: familyMembers.length,
          totalHeirlooms: heirlooms.length,
          accountCreated: userProfile.createdAt,
          lastLogin: userProfile.lastLogin,
          dataProcessingConsent: userProfile.dataProcessingConsent,
          marketingConsent: userProfile.marketingConsent
        },
        legalNotice: {
          rightsInfo: 'This export contains all personal data processed by Taonga Tracker as per GDPR Article 20.',
          dataController: 'Taonga Tracker',
          contactInfo: 'privacy@taongatracker.com',
          retentionPolicy: 'Data is retained as long as your account is active or as needed to provide services.',
          yourRights: [
            'Right to access your data (Article 15)',
            'Right to rectification (Article 16)',
            'Right to erasure (Article 17)',
            'Right to restrict processing (Article 18)',
            'Right to data portability (Article 20)',
            'Right to object (Article 21)'
          ]
        }
      };

      // Create and download the export file
      const exportJson = JSON.stringify(exportData, null, 2);
      const blob = new Blob([exportJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `taonga-tracker-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      securityLogger.logSecurityEvent(
        SECURITY_EVENT_TYPES.DATA_EXPORT,
        {
          action: 'data_export_completed',
          familyMembers: familyMembers.length,
          heirlooms: heirlooms.length,
          fileSize: blob.size
        },
        SECURITY_RISK_LEVELS.MEDIUM
      );

    } catch (error) {
      console.error('Error exporting user data:', error);

      securityLogger.logSecurityEvent(
        SECURITY_EVENT_TYPES.DATA_EXPORT,
        {
          action: 'data_export_failed',
          error: error.message
        },
        SECURITY_RISK_LEVELS.HIGH
      );

      throw new Error('Failed to export user data. Please try again later.');
    }
  },

  /**
   * Request account deletion with confirmation (GDPR Article 17 - Right to Erasure)
   * @returns {Promise<boolean>} True if deletion was successful
   */
  requestAccountDeletion: async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone and will permanently remove:\n\n' +
      '• Your user profile and account information\n' +
      '• All family member records you\'ve created\n' +
      '• All heirloom records and associated media\n' +
      '• All uploaded images and documents\n' +
      '• Your activity and security logs\n\n' +
      'This action complies with GDPR Article 17 (Right to Erasure).'
    );

    if (!confirmed) return false;

    // Second confirmation for critical action
    const doubleConfirmed = window.confirm(
      'Final confirmation: This will permanently delete ALL your data. Are you absolutely sure?'
    );

    if (!doubleConfirmed) return false;

    try {
      securityLogger.logSecurityEvent(
        SECURITY_EVENT_TYPES.ACCOUNT_DELETION,
        { action: 'account_deletion_initiated' },
        SECURITY_RISK_LEVELS.HIGH
      );

      // Call the delete account API endpoint
      const response = await fetch(GDPR_ENDPOINTS.DELETE_DATA, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          confirmDeletion: true,
          reason: 'User requested account deletion (GDPR Article 17)'
        })
      });

      if (!response.ok) {
        throw new Error(`Account deletion failed: ${response.status}`);
      }

      // Clear all local data
      localStorage.clear();
      sessionStorage.clear();

      // Clear any cached data
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name));
        });
      }

      // Redirect to home page
      window.location.href = '/';
      return true;

    } catch (error) {
      console.error('Error deleting account:', error);

      securityLogger.logSecurityEvent(
        SECURITY_EVENT_TYPES.ACCOUNT_DELETION,
        {
          action: 'account_deletion_failed',
          error: error.message
        },
        SECURITY_RISK_LEVELS.HIGH
      );

      throw new Error('Failed to delete account. Please contact support if this problem persists.');
    }
  },

  /**
   * Get current consent status
   * @returns {Promise<Object>} Current consent settings
   */
  getConsentStatus: async () => {
    try {
      const response = await fetch(GDPR_ENDPOINTS.CONSENT_STATUS, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch consent status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching consent status:', error);
      throw error;
    }
  },

  /**
   * Update consent preferences
   * @param {Object} consentData - Consent preferences
   * @returns {Promise<Object>} Updated consent status
   */
  updateConsent: async (consentData) => {
    try {
      const response = await fetch(GDPR_ENDPOINTS.CONSENT_STATUS, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(consentData)
      });

      if (!response.ok) {
        throw new Error(`Failed to update consent: ${response.status}`);
      }

      securityLogger.logSecurityEvent(
        SECURITY_EVENT_TYPES.API_CALL,
        {
          action: 'consent_updated',
          consentTypes: Object.keys(consentData)
        },
        SECURITY_RISK_LEVELS.LOW
      );

      return await response.json();
    } catch (error) {
      console.error('Error updating consent:', error);
      throw error;
    }
  },

  /**
   * Request data portability (structured export for migration)
   * @param {string} format - Export format ('json', 'csv', 'xml')
   * @returns {Promise<void>} Downloads portable data export
   */
  requestDataPortability: async (format = 'json') => {
    try {
      const response = await fetch(GDPR_ENDPOINTS.DATA_PORTABILITY, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ format })
      });

      if (!response.ok) {
        throw new Error(`Data portability request failed: ${response.status}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `taonga-tracker-portable-data.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      securityLogger.logSecurityEvent(
        SECURITY_EVENT_TYPES.DATA_EXPORT,
        {
          action: 'data_portability_completed',
          format
        },
        SECURITY_RISK_LEVELS.MEDIUM
      );

    } catch (error) {
      console.error('Error with data portability request:', error);
      throw error;
    }
  }
};
