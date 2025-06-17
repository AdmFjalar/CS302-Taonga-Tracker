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

/**
 * Generic API call function with error handling and authorization.
 * @param {string} url - API endpoint to call
 * @param {Object} options - Fetch options (method, headers, etc.)
 * @returns {Promise<any>} Response data
 * @throws {Error} If the request fails
 */
async function apiCall(url, options = {}) {
  try {
    // Add authorization header by default if token exists
    const headers = options.headers || {};

    if (!headers.Authorization) {
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    // Make request
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle common error scenarios
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API call failed: ${response.status}`);
    }

    // Handle empty responses (like for DELETE)
    if (response.status === 204) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("API call error:", error);
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
