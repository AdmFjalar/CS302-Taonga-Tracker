using TaongaTrackerAPI.Interfaces;

namespace TaongaTrackerAPI.Models;

public class Vault : IShare
{
    private int VaultId;
    private string OwnerId;
    private List<VaultItem>? VaultItems;
    private List<string>? SharedWithIds;
    
    public Vault(int vaultId, string ownerId, List<VaultItem>? vaultItems = null, List<string>? sharedWithIds = null)
    {
        VaultId = vaultId;
        OwnerId = ownerId;
        VaultItems = vaultItems;
        SharedWithIds = sharedWithIds;
    }

    public Vault(VaultDto vaultDto)
    {
        VaultId = vaultDto.VaultId;
        OwnerId = vaultDto.OwnerId;
        if (vaultDto.VaultItemDtos != null)
        {
            VaultItems = new List<VaultItem>();
            foreach (VaultItemDto vaultItemDto in vaultDto.VaultItemDtos)
            {
                VaultItems.Add(new VaultItem(vaultItemDto));    
            }
        }

        if (vaultDto.SharedWithIds != null)
        {
            SharedWithIds = new List<string>();
            SharedWithIds = vaultDto.SharedWithIds;
        }
    }

    public VaultItem? GetItemById(int vaultItemId)
    {
        return VaultItems?.Find(x => x.GetVaultItemId() == vaultItemId);   
    }
    
    public Exception? AddItem(VaultItem vaultItem)
    {
        try
        {
            VaultItems ??= new List<VaultItem>();
            VaultItems.Add(vaultItem);   
        }
        catch (Exception? e)
        {
            return e;
        }
        return null;   
    }

    public Exception? RemoveItem(int vaultItemId)
    {
        try
        {
            if (VaultItems == null)
            {
                return new InvalidOperationException("Vault has no items");
            }

            VaultItem? item = GetItemById(vaultItemId);

            if (item != null)
            {
                VaultItems.Remove(item);
            }
            else
            {
                return new InvalidOperationException("Vault item does not exist");
            }
        }
        catch (Exception? e)
        {
            return e;
        }

        return null;
    }

    public List<int>? GetItemIds()
    {
        return VaultItems?.Select(x => x.GetVaultItemId()).ToList();
    }
    
    public List<string>? GetSharedWithIds()
    {
        return SharedWithIds;
    }

    public string GetOwnerId()
    {
        return OwnerId;
    }
    
    public int GetVaultId()
    {
        return VaultId;
    }

    public Exception? ShareWith(string userId)
    {
        return ((IShare)this).ShareWith(userId, ref SharedWithIds);
    }

    public Exception? StopSharingWith(string userId)
    {
        return ((IShare)this).StopSharingWith(userId, ref SharedWithIds);
    }
}