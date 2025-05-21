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
        Task CreateFamilyTreeFromJsonAsync(string jsonRequest);
        Task<List<FamilyTreeDto>> GetAllFamilyTreesAsync();
        Task<IdentityResult> CreateUserAsync(ApplicationUser user, CancellationToken cancellationToken);
        Task<ApplicationUser> FindUserByEmailAsync(string normalizedEmail, CancellationToken cancellationToken);
        Task<IdentityResult> UpdateUserAsync(ApplicationUser user, CancellationToken cancellationToken);
        Task<IdentityResult> DeleteUserAsync(ApplicationUser user, CancellationToken cancellationToken);
        Task<ApplicationUser?> FindUserByIdAsync(string userId, CancellationToken cancellationToken);
        Task<ApplicationUser?> FindUserByNameAsync(string normalizedUserName, CancellationToken cancellationToken);
        Task<IdentityResult> CreateRoleAsync(ApplicationRole role, CancellationToken cancellationToken);
    }
}