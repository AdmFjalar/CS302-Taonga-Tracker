namespace TaongaTrackerAPI.Models;

public record VaultItemDto
{
    public int VaultItemId;
    public int CurrentOwnerId;
    public int? CreatorId;
    public List<int>? PreviousOwnerIds;
    public decimal? EstimatedValue;
    public DateTime? CreationDate;
    public DateTime? DateAcquired;
    public string? CreationPlace;
    public string? ItemType;
    public string? PhotoUrl;
    public string? Description;
    public string Title;
    public string CurrentOwnerUserId;
    public List<string>? Materials;
    public List<string>? CraftType;
    public List<string>? SharedWithIds;

    public VaultItemDto(int vaultItemId, int currentOwnerId, string title, string currentOwnerUserId, int? creatorId = null, List<int>? previousOwnerIds = null, decimal? estimatedValue = null, DateTime? creationDate = null, DateTime? dateAcquired = null, string? creationPlace = null, string? itemType = null, string? photoUrl = null, string? description = null, List<string>? materials = null, List<string>? craftType = null, List<string>? sharedWithIds = null)
    {
        VaultItemId = vaultItemId;
        CurrentOwnerId = currentOwnerId;
        CreatorId = creatorId;
        PreviousOwnerIds = previousOwnerIds;
        EstimatedValue = estimatedValue;
        CreationDate = creationDate;
        DateAcquired = dateAcquired;
        CreationPlace = creationPlace;
        ItemType = itemType;
        PhotoUrl = photoUrl;
        Description = description;
        Title = title;
        CurrentOwnerUserId = currentOwnerUserId;
        Materials = materials;
        CraftType = craftType;
        SharedWithIds = sharedWithIds;
    }
}