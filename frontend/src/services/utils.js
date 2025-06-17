/**
 * Utility functions for common operations across components.
 */

import { API_BASE_URL, PLACEHOLDER_IMAGES } from './constants';

/**
 * Returns the full image URL for a given relative path.
 * @param {string} relativePath - The relative path to the image.
 * @param {string} [placeholder=PLACEHOLDER_IMAGES.PROFILE] - Placeholder to use if relativePath is missing.
 * @returns {string} The full image URL or a placeholder if not provided.
 */
export const getFullImageUrl = (relativePath, placeholder = PLACEHOLDER_IMAGES.PROFILE) => {
    if (!relativePath) return placeholder;
    return `${API_BASE_URL}${relativePath}`;
};

/**
 * Converts a date string to YYYY-MM-DD format for input fields.
 * @param {string} date - A date string in any format.
 * @returns {string} Date formatted as YYYY-MM-DD or empty string if invalid.
 */
export function toDateInputValue(date) {
    if (!date) return "";
    // If date is already in YYYY-MM-DD or starts with it, return the first 10 chars
    if (/^\d{4}-\d{2}-\d{2}/.test(date)) return date.slice(0, 10);
    // Otherwise, parse and format as UTC (fallback)
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return ""; // Invalid date

        const year = d.getUTCFullYear();
        const month = String(d.getUTCMonth() + 1).padStart(2, "0");
        const day = String(d.getUTCDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    } catch (e) {
        console.error("Date parsing error:", e);
        return "";
    }
}

/**
 * Formats a date string to a human-readable format.
 * @param {string} date - Date string to format.
 * @param {Object} options - Intl.DateTimeFormat options.
 * @returns {string} Formatted date string or "N/A" if invalid.
 */
export function formatDate(date, options = { year: 'numeric', month: 'long', day: 'numeric' }) {
    if (!date) return "N/A";
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return "N/A";
        return new Intl.DateTimeFormat('en-US', options).format(d);
    } catch (e) {
        return "N/A";
    }
}

/**
 * Ensures a string has a space after each comma.
 * @param {string} value - String to format.
 * @returns {string} Formatted string with spaces after commas.
 */
export const autoSpaceComma = (value) => {
    if (!value) return "";
    return value.replace(/,([^ ])/g, ", $1");
};

/**
 * Converts a comma-separated string to an array.
 * @param {string} value - Comma-separated string.
 * @returns {Array} Array of trimmed values.
 */
export const stringToArray = (value) => {
    if (!value) return [];
    return value.split(',').map(v => v.trim()).filter(Boolean);
};

/**
 * Formats a currency value.
 * @param {number|string} value - The value to format.
 * @param {string} [currency='USD'] - The currency code.
 * @returns {string} Formatted currency string or empty string if invalid.
 */
export const formatCurrency = (value, currency = 'USD') => {
    if (value === null || value === undefined || isNaN(Number(value))) return "";
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
    }).format(value);
};

/**
 * Truncates text to a specified length with ellipsis.
 * @param {string} text - Text to truncate.
 * @param {number} [maxLength=100] - Maximum length before truncation.
 * @returns {string} Truncated text with ellipsis or original if short enough.
 */
export const truncateText = (text, maxLength = 100) => {
    if (!text || text.length <= maxLength) return text || "";
    return `${text.substring(0, maxLength).trim()}...`;
};

/**
 * Creates a deep clone of an object to avoid mutation.
 * @param {Object} obj - The object to clone.
 * @returns {Object} A deep clone of the object.
 */
export const deepClone = (obj) => {
    if (!obj) return obj;
    return JSON.parse(JSON.stringify(obj));
};
