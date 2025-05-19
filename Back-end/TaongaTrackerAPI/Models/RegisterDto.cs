namespace TaongaTrackerAPI.Models;

public record RegisterDto()
{
    public string UserName { get; set; }
    public string Email { get; set; }
    public string Password { get; set; }
    
    public RegisterDto(string username, string email, string password) : this()
    {
        UserName = username;
        Email = email;
        Password = password;
    }
}