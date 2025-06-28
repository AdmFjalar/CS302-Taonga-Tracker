/**
 * GDPR Data Management Utilities
 * Handles user data requests, deletion, and export functionality
 */

import { authAPI } from './api';
import { STORAGE_KEYS } from './constants';

/**
 * GDPR compliance utilities
 */
export const gdprManager = {
  /**
   * Export all user data in JSON format
   * @returns {Promise<Object>} User's complete data
   */
  exportUserData: async () => {
    try {
      const userData = await authAPI.getCurrentUser();
      const familyData = await authAPI.getFamilyMembers?.() || [];
      const heirloomData = await authAPI.getHeirlooms?.() || [];
      
      const exportData = {
        personal_information: {
          id: userData.id,
          username: userData.username,
          email: userData.email,
          created_at: userData.createdAt,
          profile_picture: userData.profilePictureUrl
        },
        family_members: familyData,
        heirlooms: heirloomData,
        export_date: new Date().toISOString(),
        export_version: '1.0'
      };

      return exportData;
    } catch (error) {
      console.error('Error exporting user data:', error);
      throw new Error('Failed to export user data');
    }
  },

  /**
   * Download user data as JSON file
   */
  downloadUserData: async () => {
    try {
      const data = await gdprManager.exportUserData();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `taonga-tracker-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading user data:', error);
      throw error;
    }
  },

  /**
   * Request account deletion (GDPR Right to Erasure)
   * @param {string} reason - Reason for deletion
   * @returns {Promise<void>}
   */
  requestAccountDeletion: async (reason = '') => {
    try {
      const response = await fetch('/api/gdpr/delete-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)}`
        },
        body: JSON.stringify({
          reason,
          requested_at: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to request account deletion');
      }

      return await response.json();
    } catch (error) {
      console.error('Error requesting account deletion:', error);
      throw error;
    }
  },

  /**
   * Update consent preferences
   * @param {Object} preferences - Consent preferences
   */
  updateConsentPreferences: (preferences) => {
    const consentData = {
      ...preferences,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };
    
    localStorage.setItem('gdpr_consent', JSON.stringify(consentData));
    localStorage.setItem('cookie_consent', JSON.stringify(consentData));
    
    // Trigger consent update events
    window.dispatchEvent(new CustomEvent('consentUpdated', { 
      detail: consentData 
    }));
  },

  /**
   * Get current consent status
   * @returns {Object|null} Current consent preferences
   */
  getConsentStatus: () => {
    const consent = localStorage.getItem('gdpr_consent') || 
                   localStorage.getItem('cookie_consent');
    return consent ? JSON.parse(consent) : null;
  },

  /**
   * Check if user has given specific consent
   * @param {string} type - Type of consent (analytics, marketing, etc.)
   * @returns {boolean}
   */
  hasConsent: (type) => {
    const consent = gdprManager.getConsentStatus();
    return consent ? Boolean(consent[type]) : false;
  },

  /**
   * Record data processing activity for compliance audit
   * @param {string} activity - Description of processing activity
   * @param {string} lawfulBasis - Legal basis for processing
   * @param {Object} data - Data being processed
   */
  recordProcessingActivity: (activity, lawfulBasis, data = {}) => {
    const record = {
      activity,
      lawfulBasis,
      timestamp: new Date().toISOString(),
      dataTypes: Object.keys(data),
      userId: localStorage.getItem(STORAGE_KEYS.USER_ID)
    };

    // In a real application, this would be sent to a compliance logging system
    console.log('GDPR Processing Record:', record);
  }
};

/**
 * Data minimization helper
 * Ensures only necessary data is collected and stored
 */
export const dataMinimizer = {
  /**
   * Clean user input to only include necessary fields
   * @param {Object} userData - Raw user data
   * @param {string[]} requiredFields - Fields required for the operation
   * @returns {Object} Minimized data object
   */
  minimizeUserData: (userData, requiredFields) => {
    const minimized = {};
    requiredFields.forEach(field => {
      if (userData[field] !== undefined) {
        minimized[field] = userData[field];
      }
    });
    return minimized;
  },

  /**
   * Check data retention period and flag old data
   * @param {Date} createdDate - When the data was created
   * @param {number} retentionDays - Retention period in days
   * @returns {boolean} True if data should be reviewed for deletion
   */
  shouldReviewForDeletion: (createdDate, retentionDays = 2555) => { // ~7 years
    const now = new Date();
    const created = new Date(createdDate);
    const daysDiff = (now - created) / (1000 * 60 * 60 * 24);
    return daysDiff > retentionDays;
  }
};
