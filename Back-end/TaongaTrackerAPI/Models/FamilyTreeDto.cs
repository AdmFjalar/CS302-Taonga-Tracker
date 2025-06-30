using System.ComponentModel.DataAnnotations;

namespace TaongaTrackerAPI.Models;

/// <summary>
/// Data transfer object for family tree information with genealogy tracking capabilities
/// </summary>
public record FamilyTreeDto
{
    /// <summary>
    /// Unique identifier for the family tree
    /// </summary>
    [Required]
    public required string FamilyTreeId { get; set; }
    
    /// <summary>
    /// User ID of the family tree owner
    /// </summary>
    [Required]
    public required string OwnerUserId { get; set; }
    
    /// <summary>
    /// List of family members in the tree
    /// </summary>
    public List<FamilyMemberDto>? FamilyMembers { get; set; }
    
    /// <summary>
    /// List of user IDs with whom the tree is shared
    /// </summary>
    public List<string>? SharedWithIds { get; set; }
    
    /// <summary>
    /// Name or title of the family tree
    /// </summary>
    public string? TreeName { get; set; }
    
    /// <summary>
    /// Description or notes about the family tree
    /// </summary>
    public string? Description { get; set; }
}