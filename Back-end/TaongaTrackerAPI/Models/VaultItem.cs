namespace TaongaTrackerAPI.Models
{
    public class VaultItem
    {
        private int VaultItemId;
        private int CurrentOwnerId;
        private int? CreatorId;
        private List<int>? PreviousOwnerIds;
        private decimal? EstimatedValue;
        private DateTime? CreationDate;
        private DateTime? DateAqcuired;
        private string? CreationPlace;
        private string? ItemType;
        private string? PhotoUrl;
        private string? Description;
        private string Title;
        private List<string>? Materials;
        private List<string>? CraftType;
        private List<string>? SharedWithIds;

        public VaultItem(int vaultItemId, int currentOwnerId, int? creatorId = null, List<int>? previousOwnerIds = null, decimal? estimatedValue = null, DateTime? creationDate = null, DateTime? dateAqcuired = null, string? creationPlace = null, string? itemType = null, string? photoUrl = null, string? description = null, string title = null, List<string>? materials = null, List<string>? craftType = null, List<string>? sharedWithIds = null)
        {
            VaultItemId = vaultItemId;
            CurrentOwnerId = currentOwnerId;
            CreatorId = creatorId;
            PreviousOwnerIds = previousOwnerIds;
            EstimatedValue = estimatedValue;
            CreationDate = creationDate;
            DateAqcuired = dateAqcuired;
            CreationPlace = creationPlace;
            ItemType = itemType;
            PhotoUrl = photoUrl;
            Description = description;
            Title = title;
            Materials = materials;
            CraftType = craftType;
            SharedWithIds = sharedWithIds;
        }
    }
}