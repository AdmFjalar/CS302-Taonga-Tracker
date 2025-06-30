using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using TaongaTrackerAPI.Models;
using TaongaTrackerAPI.Services;
using System.ComponentModel.DataAnnotations;

namespace TaongaTrackerAPI.Controllers;

/// <summary>
/// Handles user authentication operations including login, registration, and profile management
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IConfiguration _configuration;
    private readonly INeo4jService _neo4jService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        IConfiguration configuration,
        INeo4jService neo4jService,
        ILogger<AuthController> logger)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _configuration = configuration;
        _neo4jService = neo4jService;
        _logger = logger;
    }

    /// <summary>
    /// Authenticates a user and returns a JWT token
    /// </summary>
    /// <param name="model">Login credentials</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>JWT token and user information if successful</returns>
    [HttpPost("login")]
    [EnableRateLimiting("AuthPolicy")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(object), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> Login([FromBody] LoginDto model, CancellationToken cancellationToken = default)
    {
        if (!ModelState.IsValid)
        {
            _logger.LogWarning("Login attempt with invalid model state from IP: {IPAddress}", 
                HttpContext.Connection.RemoteIpAddress);
            return BadRequest(ModelState);
        }

        var emailOrUsername = model.EmailOrUserName?.Trim();
        if (string.IsNullOrEmpty(emailOrUsername))
        {
            return BadRequest(new { Message = "Email or username is required" });
        }

        try
        {
            var user = await _userManager.FindByEmailAsync(emailOrUsername);
            if (user == null)
            {
                user = await _userManager.FindByNameAsync(emailOrUsername);
            }

            if (user == null)
            {
                _logger.LogWarning("Login attempt for non-existent user: {EmailOrUsername} from IP: {IPAddress}", 
                    emailOrUsername, HttpContext.Connection.RemoteIpAddress);
                
                // Consistent timing to prevent user enumeration attacks
                await Task.Delay(100, cancellationToken);
                return Unauthorized(new { Message = "Invalid login credentials" });
            }

            var result = await _signInManager.CheckPasswordSignInAsync(user, model.Password, lockoutOnFailure: true);

            if (result.Succeeded)
            {
                _logger.LogInformation("Successful login for user: {UserId} from IP: {IPAddress}", 
                    user.Id, HttpContext.Connection.RemoteIpAddress);
                
                var token = GenerateJwtToken(user);
                return Ok(new { Token = token, UserId = user.Id });
            }

            if (result.IsLockedOut)
            {
                _logger.LogWarning("Login attempt for locked out user: {UserId} from IP: {IPAddress}", 
                    user.Id, HttpContext.Connection.RemoteIpAddress);
                return Unauthorized(new { Message = "Account is locked due to multiple failed attempts" });
            }

            _logger.LogWarning("Failed login attempt for user: {UserId} from IP: {IPAddress}", 
                user.Id, HttpContext.Connection.RemoteIpAddress);
            
            return Unauthorized(new { Message = "Invalid login credentials" });
        }
        catch (OperationCanceledException)
        {
            _logger.LogWarning("Login operation cancelled");
            return BadRequest(new { Message = "Operation was cancelled" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during login for user: {EmailOrUsername}", emailOrUsername);
            return StatusCode(500, new { Message = "An unexpected error occurred" });
        }
    }

    [HttpPost("register")]
    [EnableRateLimiting("AuthPolicy")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> Register([FromBody] RegisterDto model, CancellationToken cancellationToken = default)
    {
        if (!ModelState.IsValid) 
        {
            _logger.LogWarning("Registration attempt with invalid model state from IP: {IPAddress}", 
                HttpContext.Connection.RemoteIpAddress);
            return BadRequest(ModelState);
        }

        try
        {
            // Enhanced input validation and sanitization
            if (!IsValidEmail(model.Email))
            {
                return BadRequest(new { Errors = new[] { "Invalid email format" } });
            }

            if (!IsValidUsername(model.UserName))
            {
                return BadRequest(new { Errors = new[] { "Username must be 3-50 characters and contain only letters, numbers, and underscores" } });
            }

            // Check availability with timeout
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            cts.CancelAfter(TimeSpan.FromSeconds(10));

            var isEmailAvailable = await _neo4jService.IsEmailAvailableAsync(model.Email, cancellationToken: cts.Token);
            var isUsernameAvailable = await _neo4jService.IsUsernameAvailableAsync(model.UserName, cancellationToken: cts.Token);

            var errors = new List<string>();
            
            if (!isEmailAvailable)
            {
                errors.Add("Email is already in use.");
                _logger.LogWarning("Registration attempt with existing email: {Email} from IP: {IPAddress}", 
                    model.Email, HttpContext.Connection.RemoteIpAddress);
            }
            
            if (!isUsernameAvailable)
            {
                errors.Add("Username is already in use.");
                _logger.LogWarning("Registration attempt with existing username: {Username} from IP: {IPAddress}", 
                    model.UserName, HttpContext.Connection.RemoteIpAddress);
            }
            
            if (errors.Any())
            {
                return BadRequest(new { Errors = errors });
            }

            var user = new ApplicationUser
            {
                UserName = model.UserName.Trim(),
                NormalizedUserName = model.UserName.Trim().ToUpperInvariant(),
                Email = model.Email.Trim().ToLowerInvariant(),
                NormalizedEmail = model.Email.Trim().ToUpperInvariant(),
                FirstName = model.FirstName?.Trim() ?? string.Empty,
                LastName = model.LastName?.Trim() ?? string.Empty,
                EmailConfirmed = false // Require email confirmation for security
            };

            var result = await _userManager.CreateAsync(user, model.Password);
            
            if (result.Succeeded) 
            {
                _logger.LogInformation("Successfully created user: {UserId} with email: {Email} from IP: {IPAddress}", 
                    user.Id, user.Email, HttpContext.Connection.RemoteIpAddress);
                
                return Ok(new { Message = "User created successfully", UserId = user.Id });
            }

            // Handle Identity errors with enhanced error mapping
            foreach (var error in result.Errors)
            {
                var friendlyError = MapIdentityError(error);
                errors.Add(friendlyError);
                _logger.LogWarning("User creation failed with error: {ErrorCode} - {ErrorDescription}", 
                    error.Code, error.Description);
            }
            
            return BadRequest(new { Errors = errors });
        }
        catch (OperationCanceledException)
        {
            _logger.LogWarning("Registration operation cancelled");
            return BadRequest(new { Message = "Operation timed out" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during registration for email: {Email}", model.Email);
            return StatusCode(500, new { Message = "An unexpected error occurred during registration" });
        }
    }

    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCurrentUser(CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId)) 
            {
                _logger.LogWarning("GetCurrentUser called without valid user ID in token");
                return Unauthorized();
            }

            var user = await _neo4jService.FindUserByIdAsync(userId, cancellationToken);
            if (user == null) 
            {
                _logger.LogWarning("User not found in database: {UserId}", userId);
                return NotFound();
            }
            
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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving current user information");
            return StatusCode(500, new { Message = "An error occurred while retrieving user information" });
        }
    }
    
    [HttpGet("search-users")]
    public async Task<IActionResult> SearchUsers([FromQuery] string q)
    {
        if (string.IsNullOrWhiteSpace(q))
            return BadRequest("Query is required.");

        var users = await _neo4jService.SearchUsersAsync(q, 10);
        return Ok(users.Select(u => new { u.UserName, u.FirstName, u.Email, u.ProfilePictureUrl }));
    }
    
    [HttpPut("me")]
    [Authorize]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateCurrentUser([FromBody] UpdateProfileDto model, CancellationToken cancellationToken = default)
    {
        if (!ModelState.IsValid)
        {
            _logger.LogWarning("Profile update attempt with invalid model state from IP: {IPAddress}", 
                HttpContext.Connection.RemoteIpAddress);
            return BadRequest(ModelState);
        }

        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogWarning("UpdateCurrentUser called without valid user ID in token");
                return Unauthorized();
            }

            // Validate email format if provided
            if (!string.IsNullOrEmpty(model.Email) && !IsValidEmail(model.Email))
            {
                return BadRequest(new { Message = "Invalid email format" });
            }

            // Check if email is already in use by another user
            if (!string.IsNullOrEmpty(model.Email))
            {
                var existingUser = await _userManager.FindByEmailAsync(model.Email);
                if (existingUser != null && existingUser.Id != userId)
                {
                    return BadRequest(new { Message = "Email is already in use by another user" });
                }
            }

            // Get current user
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                _logger.LogWarning("User not found in UserManager: {UserId}", userId);
                return NotFound(new { Message = "User not found" });
            }

            // Update user properties
            user.FirstName = model.FirstName?.Trim() ?? user.FirstName;
            user.MiddleNames = model.MiddleNames?.Trim() ?? user.MiddleNames;
            user.LastName = model.LastName?.Trim() ?? user.LastName;
            user.ProfilePictureUrl = model.ProfilePictureUrl?.Trim() ?? user.ProfilePictureUrl;

            // Update email if provided and different
            if (!string.IsNullOrEmpty(model.Email) && model.Email != user.Email)
            {
                user.Email = model.Email.Trim().ToLowerInvariant();
                user.NormalizedEmail = model.Email.Trim().ToUpperInvariant();
                user.EmailConfirmed = false; // Require re-confirmation for email changes
            }

            // Update user in Identity system
            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
            {
                var errors = result.Errors.Select(e => MapIdentityError(e)).ToList();
                _logger.LogWarning("Failed to update user profile for {UserId}: {Errors}", 
                    userId, string.Join(", ", errors));
                return BadRequest(new { Errors = errors });
            }

            // Update user in Neo4j database
            await _neo4jService.UpdateUserProfileAsync(userId, new ApplicationUser
            {
                Id = user.Id,
                FirstName = user.FirstName,
                MiddleNames = user.MiddleNames,
                LastName = user.LastName,
                Email = user.Email,
                ProfilePictureUrl = user.ProfilePictureUrl
            }, cancellationToken);

            _logger.LogInformation("Successfully updated profile for user: {UserId} from IP: {IPAddress}", 
                userId, HttpContext.Connection.RemoteIpAddress);

            return Ok(new
            {
                Message = "Profile updated successfully",
                User = new
                {
                    user.Id,
                    user.UserName,
                    user.FirstName,
                    user.MiddleNames,
                    user.LastName,
                    user.Email,
                    user.ProfilePictureUrl,
                    user.EmailConfirmed
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user profile for user: {UserId}", User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            return StatusCode(500, new { Message = "An error occurred while updating your profile" });
        }
    }
    
    [HttpPut("change-password")]
    [Authorize]
    [EnableRateLimiting("AuthPolicy")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto model, CancellationToken cancellationToken = default)
    {
        if (!ModelState.IsValid)
        {
            _logger.LogWarning("Password change attempt with invalid model state from IP: {IPAddress}", 
                HttpContext.Connection.RemoteIpAddress);
            return BadRequest(ModelState);
        }

        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogWarning("ChangePassword called without valid user ID in token");
                return Unauthorized();
            }

            // Get current user
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                _logger.LogWarning("User not found for password change: {UserId}", userId);
                return NotFound(new { Message = "User not found" });
            }

            // Verify current password
            var passwordCheckResult = await _signInManager.CheckPasswordSignInAsync(user, model.CurrentPassword, lockoutOnFailure: false);
            if (!passwordCheckResult.Succeeded)
            {
                _logger.LogWarning("Failed password change attempt - invalid current password for user: {UserId} from IP: {IPAddress}", 
                    userId, HttpContext.Connection.RemoteIpAddress);
                return BadRequest(new { Message = "Current password is incorrect" });
            }

            // Validate new password meets requirements
            var passwordValidator = _userManager.PasswordValidators.FirstOrDefault();
            if (passwordValidator != null)
            {
                var passwordValidationResult = await passwordValidator.ValidateAsync(_userManager, user, model.NewPassword);
                if (!passwordValidationResult.Succeeded)
                {
                    var errors = passwordValidationResult.Errors.Select(e => MapIdentityError(e)).ToList();
                    _logger.LogWarning("Password change failed validation for user: {UserId}: {Errors}", 
                        userId, string.Join(", ", errors));
                    return BadRequest(new { Errors = errors });
                }
            }

            // Change password
            var changePasswordResult = await _userManager.ChangePasswordAsync(user, model.CurrentPassword, model.NewPassword);
            if (!changePasswordResult.Succeeded)
            {
                var errors = changePasswordResult.Errors.Select(e => MapIdentityError(e)).ToList();
                _logger.LogWarning("Failed to change password for user: {UserId}: {Errors}", 
                    userId, string.Join(", ", errors));
                return BadRequest(new { Errors = errors });
            }

            // Update security stamp to invalidate existing tokens
            await _userManager.UpdateSecurityStampAsync(user);

            // Update password hash in Neo4j database
            await _neo4jService.UpdateUserAsync(user, cancellationToken);

            _logger.LogInformation("Successfully changed password for user: {UserId} from IP: {IPAddress}", 
                userId, HttpContext.Connection.RemoteIpAddress);

            return Ok(new { Message = "Password changed successfully. Please log in again with your new password." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error changing password for user: {UserId}", User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            return StatusCode(500, new { Message = "An error occurred while changing your password" });
        }
    }
    
    private string GenerateJwtToken(ApplicationUser user)
    {
        try
        {
            var jwtSecret = _configuration["JWT:Secret"];
            if (string.IsNullOrEmpty(jwtSecret))
            {
                throw new InvalidOperationException("JWT secret is not configured");
            }

            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, user.Id),
                new(ClaimTypes.Name, user.UserName ?? string.Empty),
                new(ClaimTypes.Email, user.Email ?? string.Empty),
                new("jti", Guid.NewGuid().ToString()), // JWT ID for token revocation
                new("iat", DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64)
            };
            
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var expiration = DateTime.UtcNow.AddDays(Convert.ToDouble(_configuration["JWT:ExpirationInDays"] ?? "7"));

            var token = new JwtSecurityToken(
                issuer: _configuration["JWT:Issuer"],
                audience: _configuration["JWT:Audience"],
                claims: claims,
                expires: expiration,
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating JWT token for user: {UserId}", user.Id);
            throw;
        }
    }

    private static bool IsValidEmail(string email)
    {
        if (string.IsNullOrWhiteSpace(email)) return false;
        
        try
        {
            var emailAttribute = new EmailAddressAttribute();
            return emailAttribute.IsValid(email) && email.Length <= 254; // RFC 5321 limit
        }
        catch
        {
            return false;
        }
    }

    private static bool IsValidUsername(string username)
    {
        if (string.IsNullOrWhiteSpace(username)) return false;
        
        return username.Length >= 3 && 
               username.Length <= 50 && 
               username.All(c => char.IsLetterOrDigit(c) || c == '_');
    }

    private static string MapIdentityError(IdentityError error)
    {
        return error.Code switch
        {
            "DuplicateUserName" => "Username is already in use.",
            "DuplicateEmail" => "Email is already in use.",
            "PasswordTooShort" => "Password must be at least 12 characters long.",
            "PasswordRequiresNonAlphanumeric" => "Password must contain at least one special character.",
            "PasswordRequiresDigit" => "Password must contain at least one number.",
            "PasswordRequiresUpper" => "Password must contain at least one uppercase letter.",
            "PasswordRequiresLower" => "Password must contain at least one lowercase letter.",
            "InvalidUserName" => "Username contains invalid characters.",
            "InvalidEmail" => "Email address is not valid.",
            _ => error.Description
        };
    }
}
