using Microsoft.AspNetCore.Identity;
using TaongaTrackerAPI.Models;

namespace TaongaTrackerAPI.Services
{
    public interface INeo4jService
    {
        Task CreateFamilyMemberAsync(FamilyMemberDto familyMember);
        Task CreateFamilyMemberFromJsonAsync(string jsonRequest);
        Task<List<FamilyMemberDto>> GetAllFamilyMembersAsync(int skip = 0, int limit = 100);
        Task CreateFamilyTreeAsync(FamilyTreeDto familyTree);
        Task CreateFamilyTreeFromJsonAsync(string userId, string jsonRequest);
        Task<List<FamilyTreeDto>> GetAllFamilyTreesAsync();
        Task<IdentityResult> CreateUserAsync(ApplicationUser user, CancellationToken cancellationToken);
        Task<ApplicationUser> FindUserByEmailAsync(string normalizedEmail, CancellationToken cancellationToken);
        Task<IdentityResult> UpdateUserAsync(ApplicationUser user, CancellationToken cancellationToken);
        Task<IdentityResult> DeleteUserAsync(ApplicationUser user, CancellationToken cancellationToken);
        Task<ApplicationUser?> FindUserByIdAsync(string userId, CancellationToken cancellationToken);
        Task<ApplicationUser?> FindUserByNameAsync(string normalizedUserName, CancellationToken cancellationToken);
        Task<IdentityResult> CreateRoleAsync(ApplicationRole role, CancellationToken cancellationToken);

        // Vault methods
        Task CreateVaultAsync(VaultDto vault, string ownerId);
        Task<List<VaultDto>> GetUserVaultsAsync(string userId);
        Task<VaultDto> GetOrCreateUserVaultAsync(string userId);
        
        // Vault item methods
        Task CreateVaultItemAsync(VaultItemDto item, string vaultId, string ownerId);
        Task<List<VaultItemDto>> GetUserVaultItemsAsync(string userId);
        
        Task<bool> HasUserAccessToResourceAsync(string userId, string resourceId, string resourceType);
        Task<List<FamilyTreeDto>> GetUserFamilyTreesAsync(string userId);
        Task<List<FamilyMemberDto>> GetUserFamilyMembersAsync(string userId, int skip = 0, int limit = 100);
        Task CreateFamilyTreeAsync(FamilyTreeDto familyTree, string ownerId);
        Task CreateFamilyMemberAsync(FamilyMemberDto familyMember, string ownerId);
        Task ShareResourceAsync(string resourceId, string resourceType, string ownerId, string targetUserId);
    }
}