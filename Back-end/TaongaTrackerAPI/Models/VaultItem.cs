using TaongaTrackerAPI.Interfaces;

namespace TaongaTrackerAPI.Models
{
    public class VaultItem : IShare
    {
        private int VaultItemId;
        private int CurrentOwnerId;
        private int? CreatorId;
        private List<int>? PreviousOwnerIds;
        private decimal? EstimatedValue;
        private DateTime? CreationDate;
        private DateTime? DateAcquired;
        private string? CreationPlace;
        private string? ItemType;
        private string? PhotoUrl;
        private string? Description;
        private string Title;
        private string CurrentOwnerUserId;
        private List<string>? Materials;
        private List<string>? CraftType;
        private List<string>? SharedWithIds;

        public VaultItem(int vaultItemId, string title, string currentOwnerUserId, int currentOwnerId, int? creatorId = null, List<int>? previousOwnerIds = null, decimal? estimatedValue = null, DateTime? creationDate = null, DateTime? dateAcquired = null, string? creationPlace = null, string? itemType = null, string? photoUrl = null, string? description = null, List<string>? materials = null, List<string>? craftType = null, List<string>? sharedWithIds = null)
        {
            VaultItemId = vaultItemId;
            CurrentOwnerId = currentOwnerId;
            CurrentOwnerUserId = currentOwnerUserId;
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
            Materials = materials;
            CraftType = craftType;
            SharedWithIds = sharedWithIds;
        }

        public VaultItem(VaultItemDto vaultItemDto)
        {
            if (UpdateDetails(vaultItemDto) != null)
            {
                throw new Exception("Failed to update vault item details");
            }
        }

        public Exception? TransferOwnership(string newOwnerUserId, int newOwnerId)
        {
            try
            {
                PreviousOwnerIds ??= new List<int>();

                PreviousOwnerIds.Add(CurrentOwnerId);
                CurrentOwnerUserId = newOwnerUserId;
                CurrentOwnerId = newOwnerId;
            }
            catch (Exception? e)
            {
                return e;
            }
            return null;
        }

        private Exception? UpdateDetails(VaultItemDto updatedItem)
        {
            try
            {
                VaultItemId = updatedItem.VaultItemId;
                CurrentOwnerId = updatedItem.CurrentOwnerId;
                CurrentOwnerUserId = updatedItem.CurrentOwnerUserId;
                CreatorId = updatedItem.CreatorId;
                PreviousOwnerIds = updatedItem.PreviousOwnerIds;
                EstimatedValue = updatedItem.EstimatedValue;
                CreationDate = updatedItem.CreationDate;
                DateAcquired = updatedItem.DateAcquired;
                CreationPlace = updatedItem.CreationPlace;
                ItemType = updatedItem.ItemType;
                PhotoUrl = updatedItem.PhotoUrl;
                Description = updatedItem.Description;
                Title = updatedItem.Title;
                Materials = updatedItem.Materials;
                CraftType = updatedItem.CraftType;
                SharedWithIds = updatedItem.SharedWithIds;
            }
            catch (Exception? e)
            {
                return e;
            }
            return null;
        }

        public Exception? ShareWith(string userId)
        {
            return ((IShare)this).ShareWith(userId, ref SharedWithIds);
        }

        public Exception? StopSharingWith(string userId)
        {
            return ((IShare)this).StopSharingWith(userId, ref SharedWithIds);
        }
        
        public int GetVaultItemId()
        {
            return VaultItemId;
        }
        
        public List<int>? GetPreviousOwnerIds()
        {
            return PreviousOwnerIds;
        }
        
        public DateTime? GetCreationDate()
        {
            return CreationDate;
        }
        
        public int? GetCurrentOwnerId()
        {
            return CurrentOwnerId;
        }
        
        public string? GetCreationPlace() 
        {
            return CreationPlace;
        }
        
        public int? GetCreatorId()
        {
            return CreatorId;
        }
        
        public List<string>? GetMaterials()
        {
            return Materials;
        }
        
        public List<string>? GetCraftType()
        {
            return CraftType;
        }
        
        public string? GetItemType()
        {
            return ItemType;
        }

        public decimal? GetEstimatedValue()
        {
            return EstimatedValue;
        }

        public DateTime? GetDateAcquired()
        {
            return DateAcquired;
        }
        
        public string? GetPhotoUrl()
        {
            return PhotoUrl;
        }

        public string? GetDescription()
        {
            return Description;
        }
        
        public string GetTitle()
        {
            return Title;
        }
        
        public string GetCurrentOwnerUserId()
        {
            return CurrentOwnerUserId;
        }
        
        public List<string>? GetSharedWithIds()
        {
            return SharedWithIds;
        }

        public Exception? AddPreviousOwnersId(int previousOwnerId)
        {
            try
            {
                PreviousOwnerIds ??= new List<int>();
                PreviousOwnerIds.Add(previousOwnerId);
            }
            catch (Exception? e)
            {
                return e;
            }

            return null;
        }

        public Exception? RemovePreviousOwnersId(int previousOwnerId)
        {
            if (PreviousOwnerIds == null)
            {
                return new InvalidOperationException("Vault item has no previous owners");
            }
            try
            {
                PreviousOwnerIds.Remove(previousOwnerId);
            }
            catch (Exception? e)
            {
                return e;
            }

            return null;
        }

        public Exception? SetCreationDate(DateTime creationDate)
        {
            try
            {
                CreationDate = creationDate;
            }
            catch (Exception? e)
            {
                return e;
            }

            return null;
        }

        public Exception? SetCurrentOwnerId(int currentOwnerId)
        {
            try
            {
                CurrentOwnerId = currentOwnerId;
            }
            catch (Exception? e)
            {
                return e;
            }

            return null;
        }

        public Exception? SetCreationPlace(string creationPlace)
        {
            try
            {
                CreationPlace = creationPlace;
            }
            catch (Exception? e)
            {
                return e;
            }
            
            return null;
        }

        public Exception? SetCreatorId(int creatorId)
        {
            try
            {
                CreatorId = creatorId;
            }
            catch (Exception? e)
            {
                return e;
            }
            
            return null;
        }

        public Exception? SetMaterials(List<string> materials)
        {
            try
            {
                Materials = materials;
            }
            catch (Exception? e)
            {
                return e;
            }

            return null;
        }

        public Exception? SetCraftType(List<string> craftType)
        {
            try
            {
                CraftType = craftType;
            }
            catch (Exception? e)
            {
                return e;
            }

            return null;
        }

        public Exception? SetItemType(string itemType)
        {
            try
            {
                ItemType = itemType;
            }
            catch (Exception? e)
            {
                return e;
            }

            return null;
        }

        public Exception? SetEstimatedValue(decimal estimatedValue)
        {
            try
            {
                EstimatedValue = estimatedValue;
            }
            catch (Exception? e)
            {
                return e;
            }

            return null;
        }

        public Exception? SetDescription(string description)
        {
            try
            {
                Description = description;
            }
            catch (Exception? e)
            {
                return e;
            }
            
            return null;
        }

        public Exception? SetDateAcquired(DateTime dateAcquired)
        {
            try
            {
                DateAcquired = dateAcquired;
            }
            catch (Exception? e)
            {
                return e;
            }

            return null;
        }

        public Exception? SetVaultItemId(int vaultItemId)
        {
            try
            {
                VaultItemId = vaultItemId;
            }
            catch (Exception? e)
            {
                return e;
            }
            return null;
        }

        public Exception? SetPhotoUrl(string photoUrl)
        {
            try
            {
                PhotoUrl = photoUrl;
            }
            catch (Exception? e)
            {
                return e;
            }
            return null;
        }

        public Exception? SetTitle(string title)
        {
            try
            {
                Title = title;
            }
            catch (Exception? e)
            {
                return e;
            }
            return null;
        }

        public Exception? SetCurrentOwnerUserId(string currentOwnerUserId)
        {
            try
            {
                CurrentOwnerUserId = currentOwnerUserId;
            }
            catch (Exception? e)
            {
                return e;
            }
            return null;
        }

        public Exception? SetSharedWithIds(List<string> sharedWithIds)
        {
            try
            {
                SharedWithIds = sharedWithIds;
            }
            catch (Exception? e)
            {
                return e;
            }
            return null;
        }

        public Exception? SetPreviousOwnerIds(List<int> previousOwnerIds)
        {
            try
            {
                PreviousOwnerIds = previousOwnerIds;
            }
            catch (Exception? e)
            {
                return e;
            }
            return null;
        }
    }
}