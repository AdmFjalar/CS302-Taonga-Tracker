namespace TaongaTrackerAPI.Models;

public class Vault
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

    public Vault(VaultDTO vaultDto)
    {
        VaultId = vaultDto.VaultId;
        OwnerId = vaultDto.OwnerId;
        if (vaultDto.VaultItemDtos != null)
        {
            VaultItems = new List<VaultItem>();
        }
        foreach (var vaultItemDto in vaultDto.VaultItemDtos)
        {
            VaultItems.Add(new VaultItem(vaultItemDto));    
        }

        if (vaultDto.SharedWithIds != null)
        {
            SharedWithIds = new List<string>();
            SharedWithIds = vaultDto.SharedWithIds;
        }
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
            else if (VaultItems.Any(x => x.GetVaultItemId() != vaultItemId))
            {
                return new InvalidOperationException("Vault item does not exist");
            }
            VaultItems.Remove(VaultItems.Find(x => x.GetVaultItemId() == vaultItemId));
        }
        catch (Exception? e)
        {
            return e;
        }

        return null;
    }
    
    
}