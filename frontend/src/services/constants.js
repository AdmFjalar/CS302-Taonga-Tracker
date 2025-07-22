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
    CHANGE_PASSWORD: `/api/auth/change-password`,
    DELETE_ACCOUNT: `/api/auth/delete-account`,
    EXPORT_DATA: `/api/auth/export-data`
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
    UPLOAD_DOCUMENT: `/api/vaultitem/upload-document`,
};

// Security monitoring endpoints
export const SECURITY_ENDPOINTS = {
    SCAN: `/api/security/scan`,
    VULNERABILITIES: `/api/security/vulnerabilities`,
    ACTIVITY_LOG: `/api/security/activity`,
    BREACH_REPORT: `/api/security/breach-report`,
    SECURITY_SETTINGS: `/api/security/settings`,
    TWO_FACTOR: `/api/security/2fa`
};

// GDPR/Privacy endpoints
export const GDPR_ENDPOINTS = {
    EXPORT_DATA: `/api/gdpr/export`,
    DELETE_DATA: `/api/gdpr/delete`,
    DATA_PORTABILITY: `/api/gdpr/portability`,
    CONSENT_STATUS: `/api/gdpr/consent`
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
    SECURITY_EVENTS: "security_events",
    LAST_ACTIVITY: "last_activity"
};

// Security event types
export const SECURITY_EVENT_TYPES = {
    LOGIN_SUCCESS: 'login_success',
    LOGIN_FAILURE: 'login_failure',
    LOGOUT: 'logout',
    PASSWORD_CHANGE: 'password_change',
    ACCOUNT_DELETION: 'account_deletion',
    DATA_EXPORT: 'data_export',
    SUSPICIOUS_ACTIVITY: 'suspicious_activity',
    API_CALL: 'api_call',
    BREACH_DETECTED: 'breach_detected',
    RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded'
};

// Security risk levels
export const SECURITY_RISK_LEVELS = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
};

/**
 * Returns authorization header with current token.
 * @returns {Object} Authorization header object
 */
export const getAuthHeader = () => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    return { Authorization: `Bearer ${token}` };
};
