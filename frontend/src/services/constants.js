/**
 * Application constants for API endpoints, configuration options,
 * and other values that should be centralized and easily updatable.
 */

// Base API URL
export const API_BASE_URL = "http://localhost:5240";

// Authentication endpoints
export const AUTH_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/api/Auth/login`,
  REGISTER: `${API_BASE_URL}/api/Auth/register`,
  CURRENT_USER: `${API_BASE_URL}/api/Auth/me`,
  SEARCH_USERS: `${API_BASE_URL}/api/auth/search-users`,
};

// Family member endpoints
export const FAMILY_ENDPOINTS = {
  ALL: `${API_BASE_URL}/api/familymember`,
  DETAIL: (id) => `${API_BASE_URL}/api/familymember/${id}`,
  UPLOAD_IMAGE: `${API_BASE_URL}/api/familymember/upload-image`,
};

// Vault item (heirloom) endpoints
export const VAULT_ENDPOINTS = {
  ALL: `${API_BASE_URL}/api/vaultitem`,
  DETAIL: (id) => `${API_BASE_URL}/api/vaultitem/${id}`,
  UPLOAD_IMAGE: `${API_BASE_URL}/api/vaultitem/upload-image`,
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
