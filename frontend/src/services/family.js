/**
 * Family Member service - handles all API interactions for family members
 */
import { familyAPI } from './api';

/**
 * Family member data access service
 */
export const FamilyService = {
  /**
   * Get all family members for the current user
   *
   * @returns {Promise<Array>} Array of family members
   */
  getAllMembers: async () => {
    return familyAPI.getAll();
  },

  /**
   * Get a single family member by ID
   *
   * @param {string|number} id - The member ID
   * @returns {Promise<Object>} The family member
   */
  getMemberById: async (id) => {
    return familyAPI.getById(id);
  },

  /**
   * Create a new family member
   *
   * @param {Object} memberData - The member data
   * @returns {Promise<Object>} The created member
   */
  createMember: async (memberData) => {
    return familyAPI.create(memberData);
  },

  /**
   * Update an existing family member
   *
   * @param {string|number} id - The member ID
   * @param {Object} memberData - The updated member data
   * @returns {Promise<Object>} The updated member
   */
  updateMember: async (id, memberData) => {
    return familyAPI.update(id, memberData);
  },

  /**
   * Delete a family member
   *
   * @param {string|number} id - The member ID
   * @returns {Promise<void>}
   */
  deleteMember: async (id) => {
    return familyAPI.delete(id);
  },

  /**
   * Upload a profile image for a family member
   *
   * @param {File} file - The image file
   * @returns {Promise<{url: string}>} The uploaded image URL
   */
  uploadImage: async (file) => {
    return familyAPI.uploadImage(file);
  },

  /**
   * Get the oldest family member
   *
   * @param {Array} members - Array of family members
   * @returns {Object|null} The oldest member or null if none found
   */
  getOldestMember: (members) => {
    if (!members || members.length === 0) return null;
    const membersWithBirthDate = members.filter(m => m.dateOfBirth);
    if (membersWithBirthDate.length === 0) return null;

    return membersWithBirthDate.reduce((oldest, current) => {
      const oldestDate = new Date(oldest.dateOfBirth);
      const currentDate = new Date(current.dateOfBirth);
      return currentDate < oldestDate ? current : oldest;
    }, membersWithBirthDate[0]);
  },

  /**
   * Get the oldest living family member
   *
   * @param {Array} members - Array of family members
   * @returns {Object|null} The oldest living member or null if none found
   */
  getOldestLivingMember: (members) => {
    if (!members || members.length === 0) return null;
    const livingMembersWithBirthDate = members.filter(m =>
      m.dateOfBirth && !m.dateOfDeath
    );

    if (livingMembersWithBirthDate.length === 0) return null;

    return livingMembersWithBirthDate.reduce((oldest, current) => {
      const oldestDate = new Date(oldest.dateOfBirth);
      const currentDate = new Date(current.dateOfBirth);
      return currentDate < oldestDate ? current : oldest;
    }, livingMembersWithBirthDate[0]);
  }
};

export default FamilyService;
