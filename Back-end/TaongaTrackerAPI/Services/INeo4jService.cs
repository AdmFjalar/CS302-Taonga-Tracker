using TaongaTrackerAPI.Models;

namespace TaongaTrackerAPI.Services
{
    public interface INeo4jService
    {
        Task CreateFamilyMemberAsync(FamilyMemberDto familyMember);
        Task<List<FamilyMemberDto>> GetAllFamilyMembersAsync();
    }
}