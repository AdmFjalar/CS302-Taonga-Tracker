using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using TaongaTrackerAPI.Models;
using TaongaTrackerAPI.Services;

namespace TaongaTrackerAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IConfiguration _configuration;
    private readonly INeo4jService _neo4jService;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        IConfiguration configuration,
        INeo4jService neo4jService)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _configuration = configuration;
        _neo4jService = neo4jService;
    }

    // Register method remains unchanged...

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
        {
            var token = GenerateJwtToken(user);
            return Ok(new { Token = token, UserId = user.Id });
        }

        return Unauthorized(new { Message = "Invalid login credentials" });
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
            //MiddleNames = model.MiddleNames ?? string.Empty,
            LastName = model.LastName ?? string.Empty
        };

        var result = await _userManager.CreateAsync(user, model.Password);

        if (result.Succeeded) return Ok(new { Message = "User created successfully", UserId = user.Id });
        
        Console.WriteLine(result.Errors);
        return BadRequest(result.Errors);
    }
    
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetCurrentUser(CancellationToken cancellationToken)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        var user = await _neo4jService.FindUserByIdAsync(userId, cancellationToken);
        Console.WriteLine(user);

        if (user == null) return NotFound();
        
        return Ok(new
        {
            user.UserName,
            user.FirstName,
            user.MiddleNames,
            user.LastName,
            user.Email,
            user.ProfilePictureUrl,
            user.Id
        });
    }
    
    [HttpGet("search-users")]
    public async Task<IActionResult> SearchUsers([FromQuery] string q)
    {
        if (string.IsNullOrWhiteSpace(q))
            return BadRequest("Query is required.");

        var users = await _neo4jService.SearchUsersAsync(q, 10);
        return Ok(users.Select(u => new { u.UserName, u.FirstName, u.Email, u.ProfilePictureUrl }));
    }
    
    private string GenerateJwtToken(ApplicationUser user)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Name, user.UserName),
            new Claim(ClaimTypes.Email, user.Email)
        };
        
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["JWT:Secret"]));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expires = DateTime.Now.AddDays(Convert.ToDouble(_configuration["JWT:ExpirationInDays"]));

        var token = new JwtSecurityToken(
            issuer: _configuration["JWT:Issuer"],
            audience: _configuration["JWT:Audience"],
            claims: claims,
            expires: expires,
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    [HttpPut("me")]
    [Authorize]
    public async Task<IActionResult> UpdateCurrentUser([FromBody] UpdateProfileDto model, CancellationToken cancellationToken)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        var user = await _neo4jService.FindUserByIdAsync(userId, cancellationToken);
        if (user == null) return NotFound();

        user.FirstName = model.FirstName ?? user.FirstName;
        user.MiddleNames = model.MiddleNames ?? user.MiddleNames;
        user.LastName = model.LastName ?? user.LastName;
        user.Email = model.Email ?? user.Email;
        user.ProfilePictureUrl = model.ProfilePictureUrl ?? user.ProfilePictureUrl;

        var result = await _neo4jService.UpdateUserAsync(user, cancellationToken);
        if (!result.Succeeded) return BadRequest(result.Errors);

        return Ok(new
        {
            user.UserName,
            user.FirstName,
            user.MiddleNames,
            user.LastName,
            user.Email,
            user.ProfilePictureUrl
        });
    }
}