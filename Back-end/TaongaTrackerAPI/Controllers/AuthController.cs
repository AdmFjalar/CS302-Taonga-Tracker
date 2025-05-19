using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using TaongaTrackerAPI.Models;
using System.Threading.Tasks;

[Route("api/[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> UserManager;
    private readonly SignInManager<ApplicationUser> SignInManager;

    public AuthController(UserManager<ApplicationUser> userManager, SignInManager<ApplicationUser> signInManager)
    {
        UserManager = userManager;
        SignInManager = signInManager;
    }
    
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto registerDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var newUser = new ApplicationUser
        {
            UserName = registerDto.UserName,
            Email = registerDto.Email,
            NormalizedUserName = registerDto.UserName.ToUpper(),
            NormalizedEmail = registerDto.Email.ToUpper(),
        };

        var result = await UserManager.CreateAsync(newUser, registerDto.Password);

        if (result.Succeeded)
        {
            return Ok(new { message = "User registered successfully." });
        }

        foreach (var error in result.Errors)
        {
            ModelState.AddModelError(error.Code, error.Description);
        }

        return BadRequest(ModelState);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        ApplicationUser user = await UserManager.FindByNameAsync(loginDto.EmailOrUserName)
                            ?? await UserManager.FindByEmailAsync(loginDto.EmailOrUserName);

        if (user == null)
        {
            return Unauthorized(new { message = "Invalid username or email." });
        }

        var result = await SignInManager.CheckPasswordSignInAsync(user, loginDto.Password, lockoutOnFailure: false);

        if (!result.Succeeded)
        {
            return Unauthorized(new { message = "Invalid password." });
        }

        return Ok(new { message = "Login successful." });
    }
}