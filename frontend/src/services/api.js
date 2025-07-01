/**
 * Centralized API service for making HTTP requests with security features.
 * Handles authentication, rate limiting, and error management.
 */

import {
  API_BASE_URL,
  AUTH_ENDPOINTS,
  FAMILY_ENDPOINTS,
  VAULT_ENDPOINTS,
  SECURITY_ENDPOINTS,
  GDPR_ENDPOINTS,
  STORAGE_KEYS,
  getAuthHeader
} from './constants';
import { tokenManager, validator, rateLimiter } from './security';
import { securityLogger } from './securityMonitoring';
import { breachDetector } from './breachResponse';

let isLoggingOut = false;

// Track logout state to prevent API calls during logout
window.addEventListener('userLogout', () => {
  isLoggingOut = true;
  setTimeout(() => { isLoggingOut = false; }, 2000);
});

window.addEventListener('userLogin', () => {
  isLoggingOut = false;
});

/**
 * Makes secure API calls with authentication and error handling.
 * @param {string} url - API endpoint URL
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} Response data
 * @throws {Error} Network or authentication errors
 */
async function apiCall(url, options = {}) {
  try {
    if (isLoggingOut) {
      throw new Error('User is logging out');
    }

    // Rate limiting
    const endpoint = url.split('/').pop();
    if (!rateLimiter.isAllowed(`api_${endpoint}`, 30, 60000)) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    const token = tokenManager.getToken();
    const publicEndpoints = [AUTH_ENDPOINTS.LOGIN, AUTH_ENDPOINTS.REGISTER];
    const isPublicEndpoint = publicEndpoints.some(endpoint => url.includes(endpoint));

    if (!token && !isPublicEndpoint && !isLoggingOut) {
      throw new Error('Authentication required. Please log in again.');
    }

    const headers = { ...options.headers };

    if (!headers.Authorization && token) {
      headers.Authorization = `Bearer ${token}`;
    }

    headers['X-Requested-With'] = 'XMLHttpRequest';

    // Let browser set Content-Type for FormData
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    }

    // Security logging
    if (!isLoggingOut) {
      securityLogger.logSecurityEvent('api_call', {
        url,
        method: options.method || 'GET',
        hasAuth: !!token
      }, 'low');
    }

    // Request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // Security breach detection
    breachDetector.checkResponse(response);

    // Handle authentication errors
    if (response.status === 401) {
      if (!isLoggingOut) {
        tokenManager.clearToken();
        window.dispatchEvent(new CustomEvent('authenticationFailed'));
      }
      throw new Error('Authentication failed. Please log in again.');
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    // Handle successful DELETE responses which often return empty bodies
    if (response.status === 204) {
      return null;
    }

    // Check content type and length headers
    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');

    // If no content type is specified or it's not JSON, and content length is 0 or not specified
    if ((!contentType || !contentType.includes('application/json')) &&
        (contentLength === '0' || contentLength === null)) {
      return null;
    }

    // Clone the response to safely check if it's empty
    const responseClone = response.clone();
    const responseText = await responseClone.text();

    if (!responseText || responseText.trim() === '') {
      return null;
    }

    // Parse as JSON if we have content
    try {
      return JSON.parse(responseText);
    } catch (jsonError) {
      // If JSON parsing fails but we have text content, return the text as-is
      console.warn('Failed to parse response as JSON, returning as text:', jsonError);
      return responseText;
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timeout. Please try again.');
    }
    throw error;
  }
}

/**
 * Authentication API functions
 */
export const authAPI = {
  /**
   * Login with email/username and password
   * @param {string} emailOrUserName
   * @param {string} password
   * @returns {Promise<{token: string}>}
   */
  login: (emailOrUserName, password) =>
    apiCall(AUTH_ENDPOINTS.LOGIN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrUserName, password })
    }),

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} New user data
   */
  register: (userData) =>
    apiCall(AUTH_ENDPOINTS.REGISTER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    }),

  /**
   * Get current user profile
   * @returns {Promise<Object>} User profile data
   */
  getCurrentUser: () =>
    apiCall(AUTH_ENDPOINTS.CURRENT_USER),

  /**
   * Update current user profile
   * @param {Object} userData - Updated user data
   * @returns {Promise<Object>} Updated user data
   */
  updateCurrentUser: (userData) =>
    apiCall(AUTH_ENDPOINTS.CURRENT_USER, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    }),

  /**
   * Search users by query string
   * @param {string} query - Search query
   * @returns {Promise<Array>} Matching users
   */
  searchUsers: (query) =>
    apiCall(`${AUTH_ENDPOINTS.SEARCH_USERS}?q=${encodeURIComponent(query)}`),

  /**
   * Change user password
   * @param {Object} passwordData - Password change data
   * @param {string} passwordData.currentPassword - Current password
   * @param {string} passwordData.newPassword - New password
   * @param {string} passwordData.confirmNewPassword - Confirm new password
   * @returns {Promise<Object>} Success response
   */
  changePassword: (passwordData) =>
    apiCall(`${API_BASE_URL}/api/auth/change-password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(passwordData)
    })
};

/**
 * Family member API functions
 */
export const familyAPI = {
  /**
   * Get all family members
   * @returns {Promise<Array>} List of family members
   */
  getAll: () =>
    apiCall(FAMILY_ENDPOINTS.ALL),

  /**
   * Get a specific family member by ID
   * @param {string|number} id - Family member ID
   * @returns {Promise<Object>} Family member data
   */
  getById: (id) =>
    apiCall(FAMILY_ENDPOINTS.DETAIL(id)),

  /**
   * Create a new family member
   * @param {Object} memberData - Family member data
   * @returns {Promise<Object>} Created family member data
   */
  create: (memberData) =>
    apiCall(FAMILY_ENDPOINTS.ALL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(memberData)
    }),

  /**
   * Update an existing family member
   * @param {string|number} id - Family member ID
   * @param {Object} memberData - Updated family member data
   * @returns {Promise<Object>} Updated family member data
   */
  update: (id, memberData) =>
    apiCall(FAMILY_ENDPOINTS.DETAIL(id), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(memberData)
    }),

  /**
   * Delete a family member
   * @param {string|number} id - Family member ID
   * @returns {Promise<void>}
   */
  delete: (id) =>
    apiCall(FAMILY_ENDPOINTS.DETAIL(id), { method: 'DELETE' }),

  /**
   * Upload a family member profile image
   * @param {File} file - Image file to upload
   * @returns {Promise<{url: string}>} URL of the uploaded image
   */
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiCall(FAMILY_ENDPOINTS.UPLOAD_IMAGE, {
      method: 'POST',
      body: formData
    });
  }
};

/**
 * Vault item (heirloom) API functions
 */
export const vaultAPI = {
  /**
   * Get all vault items
   * @returns {Promise<Array>} List of vault items
   */
  getAll: () =>
    apiCall(VAULT_ENDPOINTS.ALL),

  /**
   * Get a specific vault item by ID
   * @param {string|number} id - Vault item ID
   * @returns {Promise<Object>} Vault item data
   */
  getById: (id) =>
    apiCall(VAULT_ENDPOINTS.DETAIL(id)),

  /**
   * Create a new vault item
   * @param {Object} itemData - Vault item data
   * @returns {Promise<Object>} Created vault item data
   */
  create: (itemData) =>
    apiCall(VAULT_ENDPOINTS.ALL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(itemData)
    }),

  /**
   * Update an existing vault item
   * @param {string|number} id - Vault item ID
   * @param {Object} itemData - Updated vault item data
   * @returns {Promise<Object>} Updated vault item data
   */
  update: (id, itemData) =>
    apiCall(VAULT_ENDPOINTS.DETAIL(id), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(itemData)
    }),

  /**
   * Delete a vault item
   * @param {string|number} id - Vault item ID
   * @returns {Promise<void>}
   */
  delete: (id) =>
    apiCall(VAULT_ENDPOINTS.DETAIL(id), { method: 'DELETE' }),

  /**
   * Upload a vault item image
   * @param {File} file - Image file to upload
   * @returns {Promise<{url: string}>} URL of the uploaded image
   */
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiCall(VAULT_ENDPOINTS.UPLOAD_IMAGE, {
      method: 'POST',
      body: formData
    });
  },

  /**
   * Upload a vault item document
   * @param {File} file - Document file to upload
   * @returns {Promise<{url: string}>} URL of the uploaded document
   */
  uploadDocument: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiCall(VAULT_ENDPOINTS.UPLOAD_DOCUMENT, {
      method: 'POST',
      body: formData
    });
  }
};

/**
 * Security API functions for vulnerability scanning and monitoring
 */
export const securityAPI = {
  /**
   * Perform comprehensive security scan
   * @returns {Promise<Object>} Security scan results
   */
  performScan: () =>
    apiCall(SECURITY_ENDPOINTS.SCAN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scanType: 'comprehensive',
        includeVulnerabilities: true,
        includePermissions: true,
        includeDataAccess: true
      })
    }),

  /**
   * Get current vulnerabilities
   * @returns {Promise<Array>} List of security vulnerabilities
   */
  getVulnerabilities: () =>
    apiCall(SECURITY_ENDPOINTS.VULNERABILITIES),

  /**
   * Get security activity log
   * @param {Object} filters - Optional filters for the log
   * @returns {Promise<Array>} Security activity log entries
   */
  getActivityLog: (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    const url = queryParams ? `${SECURITY_ENDPOINTS.ACTIVITY_LOG}?${queryParams}` : SECURITY_ENDPOINTS.ACTIVITY_LOG;
    return apiCall(url);
  },

  /**
   * Report a security breach
   * @param {Object} breachData - Breach information
   * @returns {Promise<Object>} Breach report response
   */
  reportBreach: (breachData) =>
    apiCall(SECURITY_ENDPOINTS.BREACH_REPORT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(breachData)
    }),

  /**
   * Get current security settings
   * @returns {Promise<Object>} Security settings
   */
  getSecuritySettings: () =>
    apiCall(SECURITY_ENDPOINTS.SECURITY_SETTINGS),

  /**
   * Update security settings
   * @param {Object} settings - Security settings to update
   * @returns {Promise<Object>} Updated security settings
   */
  updateSecuritySettings: (settings) =>
    apiCall(SECURITY_ENDPOINTS.SECURITY_SETTINGS, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    }),

  /**
   * Enable two-factor authentication
   * @param {Object} twoFactorData - 2FA setup data
   * @returns {Promise<Object>} 2FA setup response
   */
  enableTwoFactor: (twoFactorData) =>
    apiCall(SECURITY_ENDPOINTS.TWO_FACTOR, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(twoFactorData)
    }),

  /**
   * Disable two-factor authentication
   * @returns {Promise<Object>} 2FA disable response
   */
  disableTwoFactor: () =>
    apiCall(SECURITY_ENDPOINTS.TWO_FACTOR, {
      method: 'DELETE'
    })
};

/**
 * GDPR API functions for data privacy compliance
 */
export const gdprAPI = {
  /**
   * Export all user data
   * @returns {Promise<Blob>} Data export file
   */
  exportData: () =>
    apiCall(GDPR_ENDPOINTS.EXPORT_DATA, {
      method: 'POST'
    }),

  /**
   * Request account deletion
   * @param {Object} deletionData - Deletion request data
   * @returns {Promise<Object>} Deletion response
   */
  requestDeletion: (deletionData) =>
    apiCall(GDPR_ENDPOINTS.DELETE_DATA, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deletionData)
    }),

  /**
   * Request data portability
   * @param {string} format - Export format (json, csv, xml)
   * @returns {Promise<Blob>} Portable data export
   */
  requestPortability: (format = 'json') =>
    apiCall(GDPR_ENDPOINTS.DATA_PORTABILITY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ format })
    }),

  /**
   * Get consent status
   * @returns {Promise<Object>} Current consent settings
   */
  getConsentStatus: () =>
    apiCall(GDPR_ENDPOINTS.CONSENT_STATUS),

  /**
   * Update consent preferences
   * @param {Object} consentData - Consent preferences
   * @returns {Promise<Object>} Updated consent status
   */
  updateConsent: (consentData) =>
    apiCall(GDPR_ENDPOINTS.CONSENT_STATUS, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(consentData)
    })
};
