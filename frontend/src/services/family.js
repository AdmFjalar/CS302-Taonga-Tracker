/**
 * Family member service for API interactions and data management.
 */
import { familyAPI } from './api';

/**
 * Family member data access service.
 */
export const FamilyService = {
  /**
   * Get all family members for current user.
   * @returns {Promise<Array>} Array of family members
   */
  getAllMembers: async () => {
    return familyAPI.getAll();
  },

  /**
   * Get family member by ID.
   * @param {string|number} id - Member ID
   * @returns {Promise<Object>} Family member data
   */
  getMemberById: async (id) => {
    return familyAPI.getById(id);
  },

  /**
   * Create new family member.
   * @param {Object} memberData - Member data
   * @returns {Promise<Object>} Created member
   */
  createMember: async (memberData) => {
    return familyAPI.create(memberData);
  },

  /**
   * Update existing family member.
   * @param {string|number} id - Member ID
   * @param {Object} memberData - Updated member data
   * @returns {Promise<Object>} Updated member
   */
  updateMember: async (id, memberData) => {
    return familyAPI.update(id, memberData);
  },

  /**
   * Delete family member.
   * @param {string|number} id - Member ID
   * @returns {Promise<void>}
   */
  deleteMember: async (id) => {
    return familyAPI.delete(id);
  },

  /**
   * Upload profile image for family member.
   * @param {File} file - Image file
   * @returns {Promise<Object>} Upload result with URL
   */
  uploadImage: async (file) => {
    return familyAPI.uploadImage(file);
  }
};

export default FamilyService;
