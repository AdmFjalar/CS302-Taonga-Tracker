/**
 * GDPR compliance utilities for data export, deletion, and consent management.
 */

import { authAPI } from './api';
import { STORAGE_KEYS } from './constants';

/**
 * GDPR data management functions.
 */
export const gdprManager = {
  /**
   * Export all user data in structured format.
   * @returns {Promise<Object>} Complete user data export
   */
  exportUserData: async () => {
    try {
      const userData = await authAPI.getCurrentUser();
      const familyData = await authAPI.getFamilyMembers?.() || [];
      const heirloomData = await authAPI.getHeirlooms?.() || [];
      
      return {
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
    } catch (error) {
      console.error('Error exporting user data:', error);
      throw new Error('Failed to export user data');
    }
  },

  /**
   * Download user data as JSON file.
   */
  downloadUserData: async () => {
    try {
      const data = await gdprManager.exportUserData();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `taonga-trove-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading user data:', error);
      throw new Error('Failed to download user data');
    }
  },

  /**
   * Request account deletion with confirmation.
   * @returns {Promise<boolean>} True if deletion was successful
   */
  requestAccountDeletion: async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    );

    if (!confirmed) return false;

    try {
      await authAPI.deleteAccount?.();
      localStorage.clear();
      window.location.href = '/';
      return true;
    } catch (error) {
      console.error('Error deleting account:', error);
      throw new Error('Failed to delete account');
    }
  },

  /**
   * Check if user has given cookie consent.
   * @returns {boolean} True if consent given
   */
  hasConsent: () => {
    return localStorage.getItem('cookie_consent') === 'true';
  },

  /**
   * Record user's cookie consent.
   * @param {boolean} [consent=true] - Consent status
   */
  setConsent: (consent = true) => {
    localStorage.setItem('cookie_consent', consent.toString());
    localStorage.setItem('consent_date', new Date().toISOString());
  },

  /**
   * Show cookie consent banner.
   */
  showConsentBanner: () => {
    // Trigger cookie consent banner display
    window.dispatchEvent(new CustomEvent('showCookieConsent'));
  },

  /**
   * Clear all user data from local storage.
   */
  clearLocalData: () => {
    const keysToKeep = ['cookie_consent', 'consent_date'];
    const allKeys = Object.keys(localStorage);

    allKeys.forEach(key => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    });
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
