using Microsoft.AspNetCore.Identity;
using TaongaTrackerAPI.Models;

namespace TaongaTrackerAPI.Services
{
    /// <summary>
    /// Interface for Neo4j database operations supporting the Taonga Tracker application
    /// </summary>
    public interface INeo4jService
    {
        // User management
        Task<IdentityResult> CreateUserAsync(ApplicationUser user, CancellationToken cancellationToken);
        Task<ApplicationUser?> FindUserByEmailAsync(string normalizedEmail, CancellationToken cancellationToken);
        Task<IdentityResult> UpdateUserAsync(ApplicationUser user, CancellationToken cancellationToken);
        Task<IdentityResult> UpdateUserProfileAsync(string userId, ApplicationUser user, CancellationToken cancellationToken);
        Task<IdentityResult> DeleteUserAsync(ApplicationUser user, CancellationToken cancellationToken);
        Task<ApplicationUser?> FindUserByIdAsync(string userId, CancellationToken cancellationToken);
        Task<ApplicationUser?> FindUserByNameAsync(string normalizedUserName, CancellationToken cancellationToken);
        Task<IdentityResult> CreateRoleAsync(ApplicationRole role, CancellationToken cancellationToken);
        Task<List<ApplicationUser>> SearchUsersAsync(string query, int limit = 10);
        
        // User validation
        Task<bool> IsEmailAvailableAsync(string email, string? excludeUserId = null, CancellationToken cancellationToken = default);
        Task<bool> IsUsernameAvailableAsync(string username, string? excludeUserId = null, CancellationToken cancellationToken = default);
        
        // Vault operations
        Task CreateVaultAsync(VaultDto vault, string ownerId);
        Task<List<VaultDto>> GetUserVaultsAsync(string userId);
        Task<VaultDto> GetOrCreateUserVaultAsync(string userId);
        
        // Vault item operations
        Task CreateVaultItemAsync(VaultItemDto item, string vaultId, string ownerId);
        Task UpdateVaultItemAsync(VaultItemDto item, string userId);
        Task DeleteVaultItemAsync(string vaultItemId, string userId);
        Task<List<VaultItemDto>> GetUserVaultItemsAsync(string userId);
        
        // Resource access control
        Task<bool> HasUserAccessToResourceAsync(string userId, string resourceId, string resourceType);
        Task ShareResourceAsync(string resourceId, string resourceType, string ownerId, string targetUserId);
        
        // Family tree operations
        /// <summary>
        /// Gets or creates a family tree for the user
        /// </summary>
        Task<FamilyTreeDto> GetOrCreateUserFamilyTreeAsync(string userId);

        /// <summary>
        /// Updates an existing family member
        /// </summary>
        Task<FamilyMemberDto> UpdateFamilyMemberAsync(string userId, string familyMemberId, FamilyMemberDto member);
        
        /// <summary>
        /// Deletes a family member from the tree
        /// </summary>
        Task DeleteFamilyMemberAsync(string userId, string familyMemberId);
        
        /// <summary>
        /// Adds a family member to the user's family tree
        /// </summary>
        Task<FamilyMemberDto> AddFamilyMemberToUserTreeAsync(string userId, FamilyMemberDto member);

        /// <summary>
        /// Gets all family members for a user's family tree
        /// </summary>
        Task<List<FamilyMemberDto>> GetUserFamilyMembersAsync(string userId);

        /// <summary>
        /// Gets the user's family tree with all members and relationships
        /// </summary>
        Task<FamilyTreeDto> GetUserFamilyTreeAsync(string userId);
    }
}