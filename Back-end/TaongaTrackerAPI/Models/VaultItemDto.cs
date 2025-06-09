namespace TaongaTrackerAPI.Models;

public record VaultItemDto
{
    public string VaultItemId { get; set; }
    public string CurrentOwnerId { get; set; }
    public string? CreatorId { get; set; }
    public List<string>? PreviousOwnerIds { get; set; }
    public decimal? EstimatedValue { get; set; }
    public DateTime? CreationDate { get; set; }
    public DateTime? DateAcquired { get; set; }
    public string? CreationPlace { get; set; }
    public string? ItemType { get; set; }
    public string? PhotoUrl { get; set; }
    public string? Description { get; set; }
    public string Title { get; set; }
    public string CurrentOwnerUserId { get; set; }
    public List<string>? Materials { get; set; }
    public List<string>? CraftType { get; set; }
    public List<string>? SharedWithIds { get; set; }

    public VaultItemDto(string vaultItemId, string currentOwnerId, string title, string currentOwnerUserId, string? creatorId = null, List<string>? previousOwnerIds = null, decimal? estimatedValue = null, DateTime? creationDate = null, DateTime? dateAcquired = null, string? creationPlace = null, string? itemType = null, string? photoUrl = null, string? description = null, List<string>? materials = null, List<string>? craftType = null, List<string>? sharedWithIds = null)
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

    public VaultItemDto()
    {
        
    }
}