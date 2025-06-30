using Microsoft.AspNetCore.Identity;

namespace TaongaTrackerAPI.Models;

/// <summary>
/// Represents a user in the Taonga Tracker application, extending ASP.NET Core Identity functionality
/// </summary>
public class ApplicationUser : IdentityUser
{
    public override string Id { get; set; } = Guid.NewGuid().ToString();
    
    /// <summary>
    /// User's first name
    /// </summary>
    public string FirstName { get; set; } = string.Empty;
    
    /// <summary>
    /// User's middle names (optional)
    /// </summary>
    public string MiddleNames { get; set; } = string.Empty;
    
    /// <summary>
    /// User's last name
    /// </summary>
    public string LastName { get; set; } = string.Empty;
    
    /// <summary>
    /// URL to the user's profile picture
    /// </summary>
    public string ProfilePictureUrl { get; set; } = string.Empty;
    
    // Override base class properties to match base nullability
    public override string? Email { get; set; }
    public override string? NormalizedEmail { get; set; }
    public override string? NormalizedUserName { get; set; }
    public override string? UserName { get; set; }
    public override string? PasswordHash { get; set; }
    public override bool EmailConfirmed { get; set; }
    public override string? SecurityStamp { get; set; } = Guid.NewGuid().ToString();
    public override string? ConcurrencyStamp { get; set; } = Guid.NewGuid().ToString();
}