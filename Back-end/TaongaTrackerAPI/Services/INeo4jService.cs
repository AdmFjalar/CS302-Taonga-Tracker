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
    }
}