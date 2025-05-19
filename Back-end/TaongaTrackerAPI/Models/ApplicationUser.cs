namespace TaongaTrackerAPI.Models;

public class ApplicationUser
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string FirstName { get; set; }
    public string MiddleNames { get; set; }
    public string LastName { get; set; }
    public string Email { get; set; }
    public string NormalizedEmail { get; set; }
    public string NormalizedUserName { get; set; }
    public string UserName { get; set; }
    public string PasswordHash { get; set; }
    public bool EmailConfirmed { get; set; }
    public string SecurityStamp { get; set; } = Guid.NewGuid().ToString();
    public string ConcurrencyStamp { get; set; } = Guid.NewGuid().ToString();
}