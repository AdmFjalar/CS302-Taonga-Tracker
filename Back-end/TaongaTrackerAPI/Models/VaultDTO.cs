namespace TaongaTrackerAPI.Models;

public record VaultDTO()
{
    public int VaultId;
    public string OwnerId;
    public List<VaultItemDTO>? VaultItemDtos;
    public List<string>? SharedWithIds;
    
    public VaultDTO(int vaultId, string ownerId, List<VaultItemDTO>? vaultItemDtos = null, List<string>? sharedWithIds = null) : this()
    {
        VaultId = vaultId;
        OwnerId = ownerId;
        VaultItemDtos = vaultItemDtos;
        SharedWithIds = sharedWithIds;
    }
}