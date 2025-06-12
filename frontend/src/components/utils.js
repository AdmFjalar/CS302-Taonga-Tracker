/**
 * Returns the full image URL for a given relative path.
 * @param {string} relativePath - The relative path to the image.
 * @returns {string} The full image URL or a placeholder if not provided.
 */
export const getFullImageUrl = (relativePath) => {
    const backendUrl = "http://localhost:5240";
    if (!relativePath) return "https://placehold.co/275";
    return `${backendUrl}${relativePath}`;
};

/**
 * Converts a date string to YYYY-MM-DD format for input fields.
 * @param {string} dateString
 * @returns {string}
 */
// src/components/utils.js
export function toDateInputValue(date) {
    if (!date) return "";
    // If date is already in YYYY-MM-DD or starts with it, return the first 10 chars
    if (/^\d{4}-\d{2}-\d{2}/.test(date)) return date.slice(0, 10);
    // Otherwise, parse and format as UTC (fallback)
    const d = new Date(date);
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

/**
 * Ensures a string has a space after each comma.
 * @param {string} value
 * @returns {string}
 */
export const autoSpaceComma = (value) => value.replace(/,([^ ])/g, ", $1");