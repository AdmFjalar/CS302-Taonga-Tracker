namespace TaongaTrackerAPI.Models;

public record VaultDto()
{
    public string VaultId;
    public string OwnerId;
    public List<VaultItemDto>? VaultItemDtos;
    public List<string>? SharedWithIds;
    
    public VaultDto(string vaultId, string ownerId, List<VaultItemDto>? vaultItemDtos = null, List<string>? sharedWithIds = null) : this()
    {
        VaultId = vaultId;
        OwnerId = ownerId;
        VaultItemDtos = vaultItemDtos;
        SharedWithIds = sharedWithIds;
    }
}