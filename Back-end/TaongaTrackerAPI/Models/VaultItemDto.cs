using System.ComponentModel.DataAnnotations;

namespace TaongaTrackerAPI.Models;

/// <summary>
/// Data transfer object for vault items representing cultural taonga with ownership and history tracking
/// </summary>
public record VaultItemDto
{
    /// <summary>
    /// Unique identifier for the vault item
    /// </summary>
    [Required]
    public required string VaultItemId { get; set; }
    
    /// <summary>
    /// Current owner's vault ID
    /// </summary>
    [Required]
    public required string CurrentOwnerId { get; set; }
    
    /// <summary>
    /// Title or name of the taonga
    /// </summary>
    [Required]
    public required string Title { get; set; }
    
    /// <summary>
    /// Current owner's user ID
    /// </summary>
    [Required]
    public required string CurrentOwnerUserId { get; set; }
    
    /// <summary>
    /// Original creator's user ID (if known)
    /// </summary>
    public string? CreatorId { get; set; }
    
    /// <summary>
    /// List of previous owners' user IDs for provenance tracking
    /// </summary>
    public List<string>? PreviousOwnerIds { get; set; }
    
    /// <summary>
    /// Estimated monetary value of the item
    /// </summary>
    public decimal? EstimatedValue { get; set; }
    
    /// <summary>
    /// Currency for the estimated value (e.g., "USD", "NZD", "EUR")
    /// </summary>
    public string? Currency { get; set; }
    
    /// <summary>
    /// Date when the item was originally created
    /// </summary>
    public DateTime? CreationDate { get; set; }
    
    /// <summary>
    /// Date when the current owner acquired the item
    /// </summary>
    public DateTime? DateAcquired { get; set; }
    
    /// <summary>
    /// Place where the item was created or originates from
    /// </summary>
    public string? CreationPlace { get; set; }
    
    /// <summary>
    /// Type or category of the item
    /// </summary>
    public string? ItemType { get; set; }
    
    /// <summary>
    /// URL to the item's photograph
    /// </summary>
    public string? PhotoUrl { get; set; }
    
    /// <summary>
    /// Detailed description of the item and its significance
    /// </summary>
    public string? Description { get; set; }
    
    /// <summary>
    /// Materials used in creating the item
    /// </summary>
    public List<string>? Materials { get; set; }
    
    /// <summary>
    /// Craft techniques or types used in creation
    /// </summary>
    public List<string>? CraftType { get; set; }
    
    /// <summary>
    /// List of user IDs with whom the item is shared
    /// </summary>
    public List<string>? SharedWithIds { get; set; }
}