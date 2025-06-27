/**
 * Application constants for API endpoints, configuration options,
 * and other values that should be centralized and easily updatable.
 */

// Base API URL - Use environment variable if available, or use relative URL for production
// This ensures API calls will be routed through our Nginx proxy to avoid mixed content issues
export const API_BASE_URL = process.env.NODE_ENV === 'development'
  ? (process.env.REACT_APP_API_URL || "http://localhost:8080")
  : ""; // Empty string means use relative URLs in production (which go through our proxy)

// Uploads URL base - Make sure images are loaded through our proxy
export const UPLOADS_BASE_URL = process.env.NODE_ENV === 'development'
  ? (process.env.REACT_APP_API_URL || "http://localhost:8080")
  : "";

// Authentication endpoints
export const AUTH_ENDPOINTS = {
  LOGIN: `/api/Auth/login`,
  REGISTER: `/api/Auth/register`,
  CURRENT_USER: `/api/Auth/me`,
  SEARCH_USERS: `/api/auth/search-users`,
};

// Family member endpoints
export const FAMILY_ENDPOINTS = {
  ALL: `/api/familymember`,
  DETAIL: (id) => `/api/familymember/${id}`,
  UPLOAD_IMAGE: `/api/familymember/upload-image`,
};

// Vault item (heirloom) endpoints
export const VAULT_ENDPOINTS = {
  ALL: `/api/vaultitem`,
  DETAIL: (id) => `/api/vaultitem/${id}`,
  UPLOAD_IMAGE: `/api/vaultitem/upload-image`,
};

// Placeholder image URLs
export const PLACEHOLDER_IMAGES = {
  PROFILE: "https://placehold.co/275",
  THUMBNAIL: "https://placehold.co/40x40",
};

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: "authToken",
  USER_ID: "userId",
};

// Common request options
export const getAuthHeader = () => {
  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  return { Authorization: `Bearer ${token}` };
};
