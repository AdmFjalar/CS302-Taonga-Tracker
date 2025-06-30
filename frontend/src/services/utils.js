/**
 * Common utility functions used across the application.
 */

import { API_BASE_URL, PLACEHOLDER_IMAGES } from './constants';

/**
 * Returns full image URL from relative path.
 * @param {string} relativePath - Relative path to image
 * @param {string} [placeholder=PLACEHOLDER_IMAGES.PROFILE] - Fallback placeholder
 * @returns {string} Full image URL or placeholder
 */
export const getFullImageUrl = (relativePath, placeholder = PLACEHOLDER_IMAGES.PROFILE) => {
    if (!relativePath) return placeholder;
    return `${API_BASE_URL}${relativePath}`;
};

/**
 * Converts date string to YYYY-MM-DD format.
 * @param {string} date - Date string in any format
 * @returns {string} Date in YYYY-MM-DD format or empty string
 */
export function toDateInputValue(date) {
    if (!date) return "";
    if (/^\d{4}-\d{2}-\d{2}/.test(date)) return date.slice(0, 10);

    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return "";

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
 * Formats date string for display.
 * @param {string} date - Date string to format
 * @param {Object} [options] - Intl.DateTimeFormat options
 * @returns {string} Formatted date or "N/A"
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
 * Adds spaces after commas in a string.
 * @param {string} value - String to format
 * @returns {string} String with spaces after commas
 */
export const autoSpaceComma = (value) => {
    if (!value) return "";
    return value.replace(/,([^ ])/g, ", $1");
};

/**
 * Converts comma-separated string to array.
 * @param {string} value - Comma-separated string
 * @returns {Array} Array of trimmed values
 */
export const stringToArray = (value) => {
    if (!value) return [];
    return value.split(',').map(v => v.trim()).filter(Boolean);
};

/**
 * Formats currency value for display.
 * @param {number|string} value - Value to format
 * @param {string} [currency='USD'] - Currency code
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value, currency = 'USD') => {
    if (!value || isNaN(value)) return '$0.00';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
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

/**
 * Get the flag emoji for a given currency code
 * @param {string} currency - The currency code (e.g., 'USD', 'EUR')
 * @returns {string} Flag emoji for the currency
 */
export const getCurrencyFlag = (currency) => {
    const currencyFlags = {
        'USD': '🇺🇸',
        'EUR': '🇪🇺',
        'GBP': '🇬🇧',
        'JPY': '🇯🇵',
        'CAD': '🇨🇦',
        'AUD': '🇦🇺',
        'CHF': '🇨🇭',
        'CNY': '🇨🇳',
        'SEK': '🇸🇪',
        'NOK': '🇳🇴',
        'MXN': '🇲🇽',
        'INR': '🇮🇳',
        'BRL': '🇧🇷',
        'KRW': '🇰🇷',
        'SGD': '🇸🇬',
        'NZD': '🇳🇿'
    };
    return currencyFlags[currency] || '$';
};

/**
 * Format currency with flag emoji
 * @param {number|string} value - The value to format
 * @param {string} [currency='USD'] - The currency code
 * @returns {string} Formatted currency string with flag
 */
export const formatCurrencyWithFlag = (value, currency = 'USD') => {
    if (value === null || value === undefined || isNaN(Number(value))) return "";
    const flag = getCurrencyFlag(currency);
    const formatted = formatCurrency(value, currency);
    return `${flag} ${formatted}`;
};
