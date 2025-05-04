namespace TaongaTrackerAPI.Models
{
    public class VaultItem
    {
        private int VaultItemId;
        private int CurrentOwnerId;
        private int CreatorId;
        private List<int> PreviousOwnerIds;
        private decimal EstimatedValue;
        private DateTime CreationDate;
        private DateTime DateAqcuired;
        private string CreationPlace;
        private string ItemType;
        private string PhotoUrl;
        private string Description;
        private string Title;
        private List<string> Materials;
        private List<string> CraftType;
        private List<string> SharedWithIds;
    }
}