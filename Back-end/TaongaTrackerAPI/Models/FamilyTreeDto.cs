namespace TaongaTrackerAPI.Models;

public record FamilyTreeDto()
{
    public string FamilyTreeId { get; set; }
    public string OwnerUserId { get; set; }
    public List<FamilyMemberDto>? FamilyMembers { get; set; }
    public List<string>? SharedWithIds { get; set; }
    public string? TreeName { get; set; }
    public string? Description { get; set; }

    public FamilyTreeDto(
        string familyTreeId,
        string ownerUserId,
        List<FamilyMemberDto>? familyMembers = null,
        List<string>? sharedWithIds = null,
        string? treeName = null,
        string? description = null
    ) : this()
    {
        FamilyTreeId = familyTreeId;
        OwnerUserId = ownerUserId;
        FamilyMembers = familyMembers;
        SharedWithIds = sharedWithIds;
        TreeName = treeName;
        Description = description;
    }
}