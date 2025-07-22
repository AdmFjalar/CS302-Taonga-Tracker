using TaongaTrackerAPI.Interfaces;

namespace TaongaTrackerAPI.Models
{
    public class VaultItem : IShare
    {
        private string VaultItemId = string.Empty;
        private string CurrentOwnerId = string.Empty;
        private string? CreatorId;
        private List<string>? PreviousOwnerIds;
        private decimal? EstimatedValue;
        private string? Currency;
        private DateTime? CreationDate;
        private DateTime? DateAcquired;
        private string? CreationPlace;
        private string? ItemType;
        private string? PhotoUrl;
        private string? Description;
        private string Title = string.Empty;
        private string CurrentOwnerUserId = string.Empty;
        private List<string>? Materials;
        private List<string>? CraftType;
        private List<string>? SharedWithIds;

        public VaultItem(string vaultItemId, string title, string currentOwnerUserId, string currentOwnerId, string? creatorId = null, List<string>? previousOwnerIds = null, decimal? estimatedValue = null, string? currency = null, DateTime? creationDate = null, DateTime? dateAcquired = null, string? creationPlace = null, string? itemType = null, string? photoUrl = null, string? description = null, List<string>? materials = null, List<string>? craftType = null, List<string>? sharedWithIds = null)
        {
            VaultItemId = vaultItemId;
            CurrentOwnerId = currentOwnerId;
            CurrentOwnerUserId = currentOwnerUserId;
            CreatorId = creatorId;
            PreviousOwnerIds = previousOwnerIds;
            EstimatedValue = estimatedValue;
            Currency = currency;
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
            // Initialize required fields with defaults
            VaultItemId = vaultItemDto.VaultItemId;
            CurrentOwnerId = vaultItemDto.CurrentOwnerId;
            Title = vaultItemDto.Title;
            CurrentOwnerUserId = vaultItemDto.CurrentOwnerUserId;
            
            if (UpdateDetails(vaultItemDto) != null)
            {
                throw new Exception("Failed to update vault item details");
            }
        }

        // Add parameterless constructor with required field initialization
        public VaultItem()
        {
            VaultItemId = Guid.NewGuid().ToString();
            CurrentOwnerId = string.Empty;
            Title = string.Empty;
            CurrentOwnerUserId = string.Empty;
        }

        public Exception? TransferOwnership(string newOwnerUserId, string newOwnerId)
        {
            try
            {
                PreviousOwnerIds ??= new List<string>();

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
                Currency = updatedItem.Currency;
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
        
        public string GetVaultItemId()
        {
            return VaultItemId;
        }
        
        public List<string>? GetPreviousOwnerIds()
        {
            return PreviousOwnerIds;
        }
        
        public DateTime? GetCreationDate()
        {
            return CreationDate;
        }
        
        public string? GetCurrentOwnerId()
        {
            return CurrentOwnerId;
        }
        
        public string? GetCreationPlace() 
        {
            return CreationPlace;
        }
        
        public string? GetCreatorId()
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

        public string? GetCurrency()
        {
            return Currency;
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

        public Exception? AddPreviousOwnersId(string previousOwnerId)
        {
            try
            {
                PreviousOwnerIds ??= new List<string>();
                PreviousOwnerIds.Add(previousOwnerId);
            }
            catch (Exception? e)
            {
                return e;
            }

            return null;
        }

        public Exception? RemovePreviousOwnersId(string previousOwnerId)
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

        public Exception? SetCurrentOwnerId(string currentOwnerId)
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

        public Exception? SetCreatorId(string creatorId)
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

        public Exception? SetCurrency(string currency)
        {
            try
            {
                Currency = currency;
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

        public Exception? SetVaultItemId(string vaultItemId)
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

        public Exception? SetPreviousOwnerIds(List<string> previousOwnerIds)
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