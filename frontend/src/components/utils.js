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
export const toDateInputValue = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
};

/**
 * Ensures a string has a space after each comma.
 * @param {string} value
 * @returns {string}
 */
export const autoSpaceComma = (value) => value.replace(/,([^ ])/g, ", $1");