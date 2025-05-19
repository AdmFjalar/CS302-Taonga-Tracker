namespace TaongaTrackerAPI.Models;

public record LoginDto()
{
    public string EmailOrUserName { get; set; }
    public string Password { get; set; }
    
    public LoginDto(string emailOrUserName, string password) : this()
    {
        EmailOrUserName = emailOrUserName;
        Password = password;
    }
}