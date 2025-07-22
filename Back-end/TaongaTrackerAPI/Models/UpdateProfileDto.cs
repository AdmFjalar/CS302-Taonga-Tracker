namespace TaongaTrackerAPI.Models;

public record UpdateProfileDto
{
  public string FirstName { get; set; } = string.Empty;
  public string MiddleNames { get; set; } = string.Empty;
  public string LastName { get; set; } = string.Empty;
  public string Email { get; set; } = string.Empty;
  public string ProfilePictureUrl { get; set; } = string.Empty;
}