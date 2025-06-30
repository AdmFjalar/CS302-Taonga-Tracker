using Microsoft.AspNetCore.Identity;
using TaongaTrackerAPI.Models;

namespace TaongaTrackerAPI.Services
{
    public interface INeo4jService
    {
    // User management
    public Task<IdentityResult> CreateUserAsync(ApplicationUser user, CancellationToken cancellationToken) => throw new NotImplementedException();
    public Task<ApplicationUser> FindUserByEmailAsync(string normalizedEmail, CancellationToken cancellationToken) => throw new NotImplementedException();
    public Task<IdentityResult> UpdateUserAsync(ApplicationUser user, CancellationToken cancellationToken) => throw new NotImplementedException();
    public Task<IdentityResult> UpdateUserProfileAsync(string userId, ApplicationUser user, CancellationToken cancellationToken) => throw new NotImplementedException();
    public Task<IdentityResult> DeleteUserAsync(ApplicationUser user, CancellationToken cancellationToken) => throw new NotImplementedException();
    public Task<ApplicationUser?> FindUserByIdAsync(string userId, CancellationToken cancellationToken) => throw new NotImplementedException();
    public Task<ApplicationUser?> FindUserByNameAsync(string normalizedUserName, CancellationToken cancellationToken) => throw new NotImplementedException();
    public Task<IdentityResult> CreateRoleAsync(ApplicationRole role, CancellationToken cancellationToken) => throw new NotImplementedException();
    public Task<List<ApplicationUser>> SearchUsersAsync(string query, int limit = 10) => throw new NotImplementedException();
    
    // User validation
    public Task<bool> IsEmailAvailableAsync(string email, string? excludeUserId = null, CancellationToken cancellationToken = default) => throw new NotImplementedException();
    public Task<bool> IsUsernameAvailableAsync(string username, string? excludeUserId = null, CancellationToken cancellationToken = default) => throw new NotImplementedException();
    
    // Vault
    public Task CreateVaultAsync(VaultDto vault, string ownerId) => throw new NotImplementedException();
    public Task<List<VaultDto>> GetUserVaultsAsync(string userId) => throw new NotImplementedException();
    public Task<VaultDto> GetOrCreateUserVaultAsync(string userId) => throw new NotImplementedException();
    
    // Vault items
    public Task CreateVaultItemAsync(VaultItemDto item, string vaultId, string ownerId) => throw new NotImplementedException();
    public Task UpdateVaultItemAsync(VaultItemDto item, string userId) => throw new NotImplementedException();
    public Task DeleteVaultItemAsync(string vaultItemId, string userId) => throw new NotImplementedException();
    public Task<List<VaultItemDto>> GetUserVaultItemsAsync(string userId) => throw new NotImplementedException();
    
    // Resource access
    public Task<bool> HasUserAccessToResourceAsync(string userId, string resourceId, string resourceType) => throw new NotImplementedException();
    public Task ShareResourceAsync(string resourceId, string resourceType, string ownerId, string targetUserId) => throw new NotImplementedException();
    
    // Family Tree
    /// <summary>
    /// Gets or creates a family tree for the user.
    /// </summary>
    Task<FamilyTreeDto> GetOrCreateUserFamilyTreeAsync(string userId);

    Task<FamilyMemberDto> UpdateFamilyMemberAsync(string userId, string familyMemberId, FamilyMemberDto member);
    Task DeleteFamilyMemberAsync(string userId, string familyMemberId);
    
    /// <summary>
    /// Adds a family member to the user's family tree.
    /// </summary>
    Task<FamilyMemberDto> AddFamilyMemberToUserTreeAsync(string userId, FamilyMemberDto member);

    /// <summary>
    /// Gets all family members for a user's family tree.
    /// </summary>
    Task<List<FamilyMemberDto>> GetUserFamilyMembersAsync(string userId);

    /// <summary>
    /// Gets the user's family tree with all members and relationships.
    /// </summary>
    Task<FamilyTreeDto> GetUserFamilyTreeAsync(string userId);
    }
}