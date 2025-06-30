using System.ComponentModel.DataAnnotations;

namespace TaongaTrackerAPI.Models;

/// <summary>
/// Data transfer object for family member information in genealogy tracking
/// </summary>
public record FamilyMemberDto
{
    /// <summary>
    /// Unique identifier for the family member
    /// </summary>
    [Required]
    public required string FamilyMemberId { get; set; }
    
    /// <summary>
    /// Associated user ID if the family member is a registered user
    /// </summary>
    public string? UserId { get; set; }
    
    /// <summary>
    /// First name of the family member
    /// </summary>
    public string? FirstName { get; set; }
    
    /// <summary>
    /// Middle names of the family member
    /// </summary>
    public List<string>? MiddleNames { get; set; }
    
    /// <summary>
    /// Last name of the family member
    /// </summary>
    public string? LastName { get; set; }
    
    /// <summary>
    /// Date of birth
    /// </summary>
    public DateTime? DateOfBirth { get; set; }
    
    /// <summary>
    /// Date of death (if applicable)
    /// </summary>
    public DateTime? DateOfDeath { get; set; }
    
    /// <summary>
    /// Gender identity
    /// </summary>
    public string? Gender { get; set; }
    
    /// <summary>
    /// List of parent member IDs
    /// </summary>
    public List<string>? ParentsIds { get; set; }
    
    /// <summary>
    /// List of children member IDs
    /// </summary>
    public List<string>? ChildrenIds { get; set; }
    
    /// <summary>
    /// List of spouse member IDs
    /// </summary>
    public List<string>? SpouseIds { get; set; }
    
    /// <summary>
    /// List of sibling member IDs
    /// </summary>
    public List<string>? SiblingIds { get; set; }
    
    /// <summary>
    /// Occupation or profession
    /// </summary>
    public string? Occupation { get; set; }
    
    /// <summary>
    /// Place of birth
    /// </summary>
    public string? PlaceOfBirth { get; set; }
    
    /// <summary>
    /// Place of death (if applicable)
    /// </summary>
    public string? PlaceOfDeath { get; set; }
    
    /// <summary>
    /// Nationality or ethnicity
    /// </summary>
    public string? Nationality { get; set; }
    
    /// <summary>
    /// Religious affiliation
    /// </summary>
    public string? Religion { get; set; }
    
    /// <summary>
    /// Current marital status
    /// </summary>
    public string? MaritalStatus { get; set; }
    
    /// <summary>
    /// Type of relationship within the family structure
    /// </summary>
    public string? RelationshipType { get; set; }
    
    /// <summary>
    /// URL to the family member's profile picture
    /// </summary>
    public string? ProfilePictureUrl { get; set; }
}