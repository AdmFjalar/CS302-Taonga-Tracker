using System.ComponentModel.DataAnnotations;

namespace TaongaTrackerAPI.Models;

/// <summary>
/// Data transfer object for user login requests
/// </summary>
public record LoginDto
{
    /// <summary>
    /// User's email address or username
    /// </summary>
    [Required]
    public required string EmailOrUserName { get; init; }
    
    /// <summary>
    /// User's password
    /// </summary>
    [Required]
    public required string Password { get; init; }
}