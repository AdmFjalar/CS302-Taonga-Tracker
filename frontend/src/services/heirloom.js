/**
 * Heirloom (Vault Item) service - handles all API interactions for vault items
 */
import { vaultAPI } from './api';

/**
 * Heirloom data access service
 */
export const HeirloomService = {
  /**
   * Get all heirloom for the current user
   *
   * @returns {Promise<Array>} Array of heirloom
   */
  getAllItems: async () => {
    return vaultAPI.getAll();
  },

  /**
   * Get a single heirloom by ID
   *
   * @param {string|number} id - The heirloom ID
   * @returns {Promise<Object>} The heirloom
   */
  getItemById: async (id) => {
    return vaultAPI.getById(id);
  },

  /**
   * Create a new heirloom
   *
   * @param {Object} itemData - The heirloom data
   * @returns {Promise<Object>} The created heirloom
   */
  createItem: async (itemData) => {
    return vaultAPI.create(itemData);
  },

  /**
   * Update an existing heirloom
   *
   * @param {string|number} id - The heirloom ID
   * @param {Object} itemData - The updated heirloom data
   * @returns {Promise<Object>} The updated heirloom
   */
  updateItem: async (id, itemData) => {
    return vaultAPI.update(id, itemData);
  },

  /**
   * Delete a heirloom
   *
   * @param {string|number} id - The heirloom ID
   * @returns {Promise<void>}
   */
  deleteItem: async (id) => {
    return vaultAPI.delete(id);
  },

  /**
   * Upload an image for a heirloom
   *
   * @param {File} file - The image file
   * @returns {Promise<{url: string}>} The uploaded image URL
   */
  uploadImage: async (file) => {
    return vaultAPI.uploadImage(file);
  },

  /**
   * Get the oldest heirloom from a collection
   *
   * @param {Array} items - Array of heirloom
   * @returns {Object|null} The oldest heirloom or null if none found
   */
  getOldestItem: (items) => {
    if (!items || items.length === 0) return null;

    const itemsWithCreationDate = items.filter(item => item.creationDate);
    if (itemsWithCreationDate.length === 0) return null;

    return itemsWithCreationDate.reduce((oldest, current) => {
      if (!oldest.creationDate) return current;
      if (!current.creationDate) return oldest;

      const oldestDate = new Date(oldest.creationDate);
      const currentDate = new Date(current.creationDate);

      return currentDate < oldestDate ? current : oldest;
    }, itemsWithCreationDate[0]);
  },

  /**
   * Get the most valuable heirloom from a collection
   *
   * @param {Array} items - Array of heirloom
   * @returns {Object|null} The most valuable heirloom or null if none found
   */
  getMostValuableItem: (items) => {
    if (!items || items.length === 0) return null;

    const itemsWithValue = items.filter(item =>
      item.estimatedValue && !isNaN(Number(item.estimatedValue))
    );

    if (itemsWithValue.length === 0) return null;

    return itemsWithValue.reduce((mostValuable, current) => {
      const currentValue = Number(current.estimatedValue) || 0;
      const mostValuableValue = Number(mostValuable.estimatedValue) || 0;

      return currentValue > mostValuableValue ? current : mostValuable;
    }, itemsWithValue[0]);
  }
};

export default HeirloomService;
