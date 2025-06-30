/**
 * Heirloom service for vault item API interactions and data management.
 */
import { vaultAPI } from './api';

/**
 * Heirloom data access service.
 */
export const HeirloomService = {
  /**
   * Get all heirlooms for current user.
   * @returns {Promise<Array>} Array of heirlooms
   */
  getAllItems: async () => {
    return vaultAPI.getAll();
  },

  /**
   * Get heirloom by ID.
   * @param {string|number} id - Heirloom ID
   * @returns {Promise<Object>} Heirloom data
   */
  getItemById: async (id) => {
    return vaultAPI.getById(id);
  },

  /**
   * Create new heirloom.
   * @param {Object} itemData - Heirloom data
   * @returns {Promise<Object>} Created heirloom
   */
  createItem: async (itemData) => {
    return vaultAPI.create(itemData);
  },

  /**
   * Update existing heirloom.
   * @param {string|number} id - Heirloom ID
   * @param {Object} itemData - Updated heirloom data
   * @returns {Promise<Object>} Updated heirloom
   */
  updateItem: async (id, itemData) => {
    return vaultAPI.update(id, itemData);
  },

  /**
   * Delete heirloom.
   * @param {string|number} id - Heirloom ID
   * @returns {Promise<void>}
   */
  deleteItem: async (id) => {
    return vaultAPI.delete(id);
  },

  /**
   * Upload image for heirloom.
   * @param {File} file - Image file
   * @returns {Promise<Object>} Upload result with URL
   */
  uploadImage: async (file) => {
    return vaultAPI.uploadImage(file);
  }
};

export default HeirloomService;
