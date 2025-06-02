using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using TaongaTrackerAPI.Models;

namespace TaongaTrackerAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly UserManager<ApplicationUser> _userManager;

    public AuthController(UserManager<ApplicationUser> userManager, SignInManager<ApplicationUser> signInManager)
    {
        _userManager = userManager;
        _signInManager = signInManager;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto model)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var user = new ApplicationUser
        {
            UserName = model.UserName,
            NormalizedUserName = model.UserName.ToUpper(),
            Email = model.Email,
            NormalizedEmail = model.Email.ToUpper(),
            FirstName = model.FirstName ?? string.Empty,
            MiddleNames = model.MiddleNames ?? string.Empty,
            LastName = model.LastName ?? string.Empty
        };
        Console.WriteLine(user.NormalizedUserName);

        var result = await _userManager.CreateAsync(user, model.Password);

        if (result.Succeeded) return Ok(new { Message = "User created successfully", UserId = user.Id });

        return BadRequest(result.Errors);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var user = await _userManager.FindByEmailAsync(model.EmailOrUserName);
        if (user == null)
        {
            user = await _userManager.FindByNameAsync(model.EmailOrUserName);
            if (user == null)
                return Unauthorized(new { Message = "Invalid login credentials" });
        }

        var result = await _signInManager.CheckPasswordSignInAsync(user, model.Password, false);

        if (result.Succeeded)
            // For now, just return success. Later you can add JWT token generation
            return Ok(new { Message = "Login successful", UserId = user.Id });

        return Unauthorized(new { Message = "Invalid login credentials" });
    }
}