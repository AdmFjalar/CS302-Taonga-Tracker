using Microsoft.AspNetCore.Identity;
using TaongaTrackerAPI.Models;

namespace TaongaTrackerAPI.Services
{
    public interface INeo4jService
    {
public Task CreateFamilyMemberAsync(FamilyMemberDto familyMember) => throw new NotImplementedException();
    public Task CreateFamilyMemberFromJsonAsync(string jsonRequest) => throw new NotImplementedException();
    public Task<List<FamilyMemberDto>> GetAllFamilyMembersAsync(int skip = 0, int limit = 100) => throw new NotImplementedException();
    public Task CreateFamilyTreeAsync(FamilyTreeDto familyTree) => throw new NotImplementedException();
    public Task CreateFamilyTreeFromJsonAsync(string userId, string jsonRequest) => throw new NotImplementedException();
    public Task<List<FamilyTreeDto>> GetAllFamilyTreesAsync() => throw new NotImplementedException();
    public Task<IdentityResult> CreateUserAsync(ApplicationUser user, CancellationToken cancellationToken) => throw new NotImplementedException();
    public Task<ApplicationUser> FindUserByEmailAsync(string normalizedEmail, CancellationToken cancellationToken) => throw new NotImplementedException();
    public Task<IdentityResult> UpdateUserAsync(ApplicationUser user, CancellationToken cancellationToken) => throw new NotImplementedException();
    public Task<IdentityResult> DeleteUserAsync(ApplicationUser user, CancellationToken cancellationToken) => throw new NotImplementedException();
    public Task<ApplicationUser?> FindUserByIdAsync(string userId, CancellationToken cancellationToken) => throw new NotImplementedException();
    public Task<ApplicationUser?> FindUserByNameAsync(string normalizedUserName, CancellationToken cancellationToken) => throw new NotImplementedException();
    public Task<IdentityResult> CreateRoleAsync(ApplicationRole role, CancellationToken cancellationToken) => throw new NotImplementedException();
    public Task CreateVaultAsync(VaultDto vault, string ownerId) => throw new NotImplementedException();
    public Task<List<VaultDto>> GetUserVaultsAsync(string userId) => throw new NotImplementedException();
    public Task<VaultDto> GetOrCreateUserVaultAsync(string userId) => throw new NotImplementedException();
    public Task CreateVaultItemAsync(VaultItemDto item, string vaultId, string ownerId) => throw new NotImplementedException();
    public Task UpdateVaultItemAsync(VaultItemDto item, string userId) => throw new NotImplementedException();
    public Task DeleteVaultItemAsync(string vaultItemId, string userId) => throw new NotImplementedException();
    public Task<List<VaultItemDto>> GetUserVaultItemsAsync(string userId) => throw new NotImplementedException();
    public Task<bool> HasUserAccessToResourceAsync(string userId, string resourceId, string resourceType) => throw new NotImplementedException();
    public Task<List<FamilyTreeDto>> GetUserFamilyTreesAsync(string userId) => throw new NotImplementedException();
    public Task<List<FamilyMemberDto>> GetUserFamilyMembersAsync(string userId, int skip = 0, int limit = 100) => throw new NotImplementedException();
    public Task CreateFamilyTreeAsync(FamilyTreeDto familyTree, string ownerId) => throw new NotImplementedException();
    public Task CreateFamilyMemberAsync(FamilyMemberDto familyMember, string ownerId) => throw new NotImplementedException();
    public Task<List<ApplicationUser>> SearchUsersAsync(string query, int limit = 10) => throw new NotImplementedException();
    public Task ShareResourceAsync(string resourceId, string resourceType, string ownerId, string targetUserId) => throw new NotImplementedException();
    }
}