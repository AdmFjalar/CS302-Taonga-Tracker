namespace TaongaTrackerAPI.Models;

public record FamilyTreeDto()
{
    public int FamilyTreeId;
    public string OwnerUserId;
    public List<FamilyMemberDto>? FamilyMembers;
    public List<string>? SharedWithIds;
    
    public FamilyTreeDto(int familyTreeId, string ownerUserId, List<FamilyMemberDto>? familyMembers = null, List<string>? sharedWithIds = null) : this()
    {
        FamilyTreeId = familyTreeId;
        OwnerUserId = ownerUserId;
        FamilyMembers = familyMembers;
        SharedWithIds = sharedWithIds;
    }
}