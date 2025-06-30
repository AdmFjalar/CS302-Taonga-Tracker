using System.ComponentModel.DataAnnotations;

namespace TaongaTrackerAPI.Models;

/// <summary>
/// Data transfer object for vault information including ownership and shared access
/// </summary>
public record VaultDto
{
    /// <summary>
    /// Unique identifier for the vault
    /// </summary>
    [Required]
    public required string VaultId { get; set; }
    
    /// <summary>
    /// User ID of the vault owner
    /// </summary>
    [Required]
    public required string OwnerId { get; set; }
    
    /// <summary>
    /// List of items stored in the vault
    /// </summary>
    public List<VaultItemDto>? VaultItemDtos { get; set; }
    
    /// <summary>
    /// List of user IDs with whom the vault is shared
    /// </summary>
    public List<string>? SharedWithIds { get; set; }
}