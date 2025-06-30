/**
 * Application constants and configuration values.
 * Centralizes API endpoints, storage keys, and other shared constants.
 */

// API Configuration
export const API_BASE_URL = process.env.NODE_ENV === 'development'
  ? (process.env.REACT_APP_API_URL || "http://localhost:8080")
  : ""; // Use relative URLs in production for proxy routing

export const UPLOADS_BASE_URL = process.env.NODE_ENV === 'development'
  ? (process.env.REACT_APP_API_URL || "http://localhost:8080")
  : "";

// API Endpoints
export const AUTH_ENDPOINTS = {
  LOGIN: `/api/Auth/login`,
  REGISTER: `/api/Auth/register`,
  CURRENT_USER: `/api/Auth/me`,
  SEARCH_USERS: `/api/auth/search-users`,
};

export const FAMILY_ENDPOINTS = {
  ALL: `/api/familymember`,
  DETAIL: (id) => `/api/familymember/${id}`,
  UPLOAD_IMAGE: `/api/familymember/upload-image`,
};

export const VAULT_ENDPOINTS = {
  ALL: `/api/vaultitem`,
  DETAIL: (id) => `/api/vaultitem/${id}`,
  UPLOAD_IMAGE: `/api/vaultitem/upload-image`,
};

// Default Images
export const PLACEHOLDER_IMAGES = {
  PROFILE: "https://placehold.co/275",
  THUMBNAIL: "https://placehold.co/40x40",
};

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: "authToken",
  USER_ID: "userId",
};

/**
 * Returns authorization header with current token.
 * @returns {Object} Authorization header object
 */
export const getAuthHeader = () => {
  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  return { Authorization: `Bearer ${token}` };
};
