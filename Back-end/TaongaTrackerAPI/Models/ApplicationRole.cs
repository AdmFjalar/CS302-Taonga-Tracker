namespace TaongaTrackerAPI.Models;

/// <summary>
/// Represents a role in the Taonga Tracker application for authorization purposes
/// </summary>
public class ApplicationRole
{
    /// <summary>
    /// Unique identifier for the role
    /// </summary>
    public string Id { get; set; } = Guid.NewGuid().ToString();
    
    /// <summary>
    /// Display name of the role
    /// </summary>
    public string Name { get; set; } = string.Empty;
    
    /// <summary>
    /// Normalized name for role lookups
    /// </summary>
    public string NormalizedName { get; set; } = string.Empty;
    
    /// <summary>
    /// Concurrency stamp for optimistic concurrency control
    /// </summary>
    public string ConcurrencyStamp { get; set; } = Guid.NewGuid().ToString();
}