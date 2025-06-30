using System.ComponentModel.DataAnnotations;

namespace TaongaTrackerAPI.Models;

/// <summary>
/// Data transfer object for user registration requests
/// </summary>
public record RegisterDto
{
    /// <summary>
    /// Desired username for the new account
    /// </summary>
    [Required]
    public required string UserName { get; init; }
    
    /// <summary>
    /// Email address for the new account
    /// </summary>
    [Required]
    [EmailAddress]
    public required string Email { get; init; }
    
    /// <summary>
    /// Password for the new account
    /// </summary>
    [Required]
    public required string Password { get; init; }
    
    /// <summary>
    /// User's first name (optional)
    /// </summary>
    public string? FirstName { get; init; }
    
    /// <summary>
    /// User's last name (optional)
    /// </summary>
    public string? LastName { get; init; }
}