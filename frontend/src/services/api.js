/**
 * API service module providing centralized functions for making HTTP requests.
 * This separates data fetching logic from UI components for better maintainability.
 */

import {
  API_BASE_URL,
  AUTH_ENDPOINTS,
  FAMILY_ENDPOINTS,
  VAULT_ENDPOINTS,
  STORAGE_KEYS,
  getAuthHeader
} from './constants';
import { tokenManager, validator, rateLimiter } from './security';
import { securityLogger } from './securityMonitoring';
import { breachDetector } from './breachResponse';

// Global flag to track logout state
let isLoggingOut = false;

// Listen for logout events
window.addEventListener('userLogout', () => {
  isLoggingOut = true;

  // Reset the flag after a short delay to allow navigation to complete
  setTimeout(() => {
    isLoggingOut = false;
  }, 2000); // 2 seconds should be enough for navigation
});

// Also listen for successful login to reset the flag
window.addEventListener('userLogin', () => {
  isLoggingOut = false;
});

/**
 * Enhanced API call function with comprehensive security features
 * @param {string} url - API endpoint to call
 * @param {Object} options - Fetch options (method, headers, etc.)
 * @returns {Promise<any>} Response data
 * @throws {Error} If the request fails
 */
async function apiCall(url, options = {}) {
  try {
    // Skip API calls if user is logging out
    if (isLoggingOut) {
      throw new Error('User is logging out');
    }

    // Rate limiting check
    const endpoint = url.split('/').pop();
    if (!rateLimiter.isAllowed(`api_${endpoint}`, 30, 60000)) { // 30 calls per minute
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    // Get secure token
    const token = tokenManager.getToken();

    // Check if this is a public endpoint that doesn't require authentication
    const publicEndpoints = [
      AUTH_ENDPOINTS.LOGIN,
      AUTH_ENDPOINTS.REGISTER
    ];
    const isPublicEndpoint = publicEndpoints.some(endpoint => url.includes(endpoint));

    // If no token and not a public endpoint and user is not logging out, this is an auth error
    if (!token && !isPublicEndpoint && !isLoggingOut) {
      throw new Error('Authentication required. Please log in again.');
    }

    const headers = options.headers || {};

    if (!headers.Authorization && token) {
      headers.Authorization = `Bearer ${token}`;
    }

    // Add security headers
    headers['X-Requested-With'] = 'XMLHttpRequest';

    // Only set Content-Type if not FormData (let browser set it for FormData)
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    }

    // Log API call for security monitoring (but not during logout)
    if (!isLoggingOut) {
      securityLogger.logSecurityEvent('api_call', {
        url,
        method: options.method || 'GET',
        hasAuth: !!token
      }, 'low');
    }

    // Make request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // Handle authentication errors
    if (response.status === 401) {
      // Don't clear token if user is already logging out
      if (!isLoggingOut) {
        tokenManager.clearToken();
        securityLogger.logSecurityEvent('unauthorized_access', { url }, 'medium');
      }
      throw new Error('Authentication required. Please log in again.');
    }

    // Handle other error scenarios
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // Log security-relevant errors (but not during logout)
      if (response.status === 403 && !isLoggingOut) {
        securityLogger.logSecurityEvent('forbidden_access', { url, status: response.status }, 'medium');
      }

      // Handle registration errors specifically (array of error messages)
      if (errorData.errors && Array.isArray(errorData.errors)) {
        throw new Error(errorData.errors.join('. '));
      }

      throw new Error(errorData.message || `API call failed: ${response.status}`);
    }

    // Handle empty responses (like for DELETE)
    if (response.status === 204) {
      return null;
    }

    const data = await response.json();

    // Check for suspicious response patterns (but not during logout)
    if (typeof data === 'string' && data.includes('<script>') && !isLoggingOut) {
      securityLogger.logSecurityEvent('suspicious_response', { url }, 'high');
      throw new Error('Invalid response format');
    }

    return data;
  } catch (error) {
    // Enhanced error logging (but not during logout)
    if (error.name === 'AbortError' && !isLoggingOut) {
      securityLogger.logSecurityEvent('request_timeout', { url }, 'low');
      throw new Error('Request timed out. Please try again.');
    }

    // Check for potential security incidents (but not during logout)
    if ((error.message.includes('network') || error.message.includes('fetch')) && !isLoggingOut) {
      breachDetector.monitorSuspiciousActivity();
    }

    // Don't log errors during logout process
    if (!isLoggingOut) {
      console.error("API call error:", error);
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
    apiCall(`${AUTH_ENDPOINTS.SEARCH_USERS}?q=${encodeURIComponent(query)}`)
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
  }
};
