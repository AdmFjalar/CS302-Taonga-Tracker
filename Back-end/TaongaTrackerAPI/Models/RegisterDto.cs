namespace TaongaTrackerAPI.Models;

public record RegisterDto()
{
    public string UserName { get; set; }
    public string Email { get; set; }
    public string Password { get; set; }
    public string? FirstName { get; set; }
    //public string? MiddleNames { get; set; }
    public string? LastName { get; set; }
    
    public RegisterDto(string username, string email, string password, string firstName, /*string middleNames, */string lastName) : this()
    {
        UserName = username;
        Email = email;
        Password = password;
        FirstName = firstName;
        //MiddleNames = middleNames;
        LastName = lastName;
    }
}