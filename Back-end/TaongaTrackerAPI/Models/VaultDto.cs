namespace TaongaTrackerAPI.Models;

public record VaultDto()
{
    public string VaultId { get; set; }
    public string OwnerId { get; set; }
    public List<VaultItemDto>? VaultItemDtos { get; set; }
    public List<string>? SharedWithIds{ get; set; }
    
    public VaultDto(string vaultId, string ownerId, List<VaultItemDto>? vaultItemDtos = null, List<string>? sharedWithIds = null) : this()
    {
        VaultId = vaultId;
        OwnerId = ownerId;
        VaultItemDtos = vaultItemDtos;
        SharedWithIds = sharedWithIds;
    }
}