using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using TaongaTrackerAPI.Models;
using TaongaTrackerAPI.Services;

namespace TaongaTrackerAPI.Controllers
{
    /// <summary>
    /// Handles GDPR compliance operations including data portability, consent management, and account deletion
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    [Produces("application/json")]
    public class GdprController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly INeo4jService _neo4jService;
        private readonly ILogger<GdprController> _logger;
        private readonly IConfiguration _configuration;

        public GdprController(
            UserManager<ApplicationUser> userManager,
            INeo4jService neo4jService,
            ILogger<GdprController> logger,
            IConfiguration configuration)
        {
            _userManager = userManager;
            _neo4jService = neo4jService;
            _logger = logger;
            _configuration = configuration;
        }

        /// <summary>
        /// Delete user account and all associated data (GDPR Article 17 - Right to be forgotten)
        /// </summary>
        [HttpDelete("delete")]
        [EnableRateLimiting("GdprSecurityPolicy")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeleteAccount([FromBody] DeleteAccountDto model, CancellationToken cancellationToken = default)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (!model.ConfirmDeletion)
            {
                return BadRequest(new { Message = "Account deletion must be confirmed" });
            }

            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized();
                }

                var user = await _userManager.FindByIdAsync(userId);
                if (user == null)
                {
                    return NotFound(new { Message = "User not found" });
                }

                // Log security event before deletion
                await _neo4jService.LogSecurityEventAsync(new SecurityEventDto
                {
                    Timestamp = DateTime.UtcNow,
                    Type = SecurityEventTypes.ACCOUNT_DELETION,
                    Details = new
                    {
                        UserId = userId,
                        Reason = model.Reason ?? "User requested account deletion",
                        Timestamp = DateTime.UtcNow
                    },
                    RiskLevel = "high",
                    UserAgent = Request.Headers.UserAgent.ToString(),
                    Url = Request.Path
                }, userId);

                // Delete user data from Neo4j
                await _neo4jService.DeleteUserDataAsync(userId, cancellationToken);

                // Delete user from Identity system
                var result = await _userManager.DeleteAsync(user);
                if (!result.Succeeded)
                {
                    _logger.LogError("Failed to delete user {UserId}: {Errors}", userId, 
                        string.Join(", ", result.Errors.Select(e => e.Description)));
                    return BadRequest(new { Message = "Failed to delete account" });
                }

                _logger.LogInformation("Successfully deleted account for user {UserId} with reason: {Reason}", 
                    userId, model.Reason);

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting account for user");
                return StatusCode(500, new { Message = "An error occurred while deleting your account" });
            }
        }

        /// <summary>
        /// Get current user's consent status
        /// </summary>
        [HttpGet("consent")]
        [ProducesResponseType(typeof(ConsentDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetConsent(CancellationToken cancellationToken = default)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized();
                }

                var consent = await _neo4jService.GetUserConsentAsync(userId, cancellationToken);
                if (consent == null)
                {
                    // Return default consent if none exists
                    consent = new ConsentDto
                    {
                        DataProcessingConsent = false,
                        MarketingConsent = false,
                        AnalyticsConsent = false,
                        CookieConsent = false,
                        ThirdPartyConsent = false,
                        LastUpdated = DateTime.UtcNow
                    };
                }

                return Ok(consent);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving consent for user");
                return StatusCode(500, new { Message = "An error occurred while retrieving consent information" });
            }
        }

        /// <summary>
        /// Update user's consent preferences
        /// </summary>
        [HttpPut("consent")]
        [ProducesResponseType(typeof(ConsentDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> UpdateConsent([FromBody] UpdateConsentDto model, CancellationToken cancellationToken = default)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized();
                }

                var consent = new ConsentDto
                {
                    DataProcessingConsent = model.DataProcessingConsent,
                    MarketingConsent = model.MarketingConsent,
                    AnalyticsConsent = model.AnalyticsConsent,
                    CookieConsent = model.CookieConsent,
                    ThirdPartyConsent = model.ThirdPartyConsent,
                    LastUpdated = DateTime.UtcNow
                };

                await _neo4jService.UpdateUserConsentAsync(userId, consent, cancellationToken);

                _logger.LogInformation("Updated consent preferences for user {UserId}", userId);

                return Ok(consent);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating consent for user");
                return StatusCode(500, new { Message = "An error occurred while updating consent preferences" });
            }
        }

        /// <summary>
        /// Export user data for portability (GDPR Article 20)
        /// </summary>
        [HttpPost("portability")]
        [EnableRateLimiting("GdprSecurityPolicy")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> ExportData([FromBody] DataPortabilityDto model, CancellationToken cancellationToken = default)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized();
                }

                // Log security event
                await LogSecurityEvent(SecurityEventTypes.DATA_EXPORT, new
                {
                    UserId = userId,
                    Format = model.Format,
                    Timestamp = DateTime.UtcNow
                }, "medium");

                // Get comprehensive user data
                var userData = await _neo4jService.GetUserDataExportAsync(userId, cancellationToken);
                if (userData == null)
                {
                    return NotFound(new { Message = "User data not found" });
                }

                var fileName = $"user_data_{userId}_{DateTime.UtcNow:yyyyMMddHHmmss}";
                
                return model.Format.ToLower() switch
                {
                    "json" => GenerateJsonExport(userData, fileName),
                    "csv" => GenerateCsvExport(userData, fileName),
                    "xml" => GenerateXmlExport(userData, fileName),
                    _ => BadRequest(new { Message = "Unsupported format" })
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error exporting data for user");
                return StatusCode(500, new { Message = "An error occurred while exporting your data" });
            }
        }

        private IActionResult GenerateJsonExport(UserDataExport userData, string fileName)
        {
            var json = JsonSerializer.Serialize(userData, new JsonSerializerOptions
            {
                WriteIndented = true,
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });
            
            var bytes = Encoding.UTF8.GetBytes(json);
            return File(bytes, "application/json", $"{fileName}.json");
        }

        private IActionResult GenerateCsvExport(UserDataExport userData, string fileName)
        {
            var csv = new StringBuilder();
            
            // User basic info
            csv.AppendLine("User Information");
            csv.AppendLine($"User ID,{userData.UserId}");
            csv.AppendLine($"Username,{userData.UserName}");
            csv.AppendLine($"Email,{userData.Email}");
            csv.AppendLine($"Name,{userData.FirstName} {userData.LastName}");
            csv.AppendLine($"Created At,{userData.CreatedAt}");
            csv.AppendLine($"Last Login,{userData.LastLoginAt}");
            csv.AppendLine();
            
            // Consent information
            csv.AppendLine("Consent Information");
            csv.AppendLine($"Data Processing,{userData.Consent.DataProcessingConsent}");
            csv.AppendLine($"Marketing,{userData.Consent.MarketingConsent}");
            csv.AppendLine($"Analytics,{userData.Consent.AnalyticsConsent}");
            csv.AppendLine($"Cookies,{userData.Consent.CookieConsent}");
            csv.AppendLine($"Third Party,{userData.Consent.ThirdPartyConsent}");
            
            var bytes = Encoding.UTF8.GetBytes(csv.ToString());
            return File(bytes, "text/csv", $"{fileName}.csv");
        }

        private IActionResult GenerateXmlExport(UserDataExport userData, string fileName)
        {
            var xml = new StringBuilder();
            xml.AppendLine("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
            xml.AppendLine("<UserData>");
            xml.AppendLine($"  <UserId>{userData.UserId}</UserId>");
            xml.AppendLine($"  <UserName>{userData.UserName}</UserName>");
            xml.AppendLine($"  <Email>{userData.Email}</Email>");
            xml.AppendLine($"  <FirstName>{userData.FirstName}</FirstName>");
            xml.AppendLine($"  <LastName>{userData.LastName}</LastName>");
            xml.AppendLine($"  <CreatedAt>{userData.CreatedAt}</CreatedAt>");
            xml.AppendLine($"  <LastLoginAt>{userData.LastLoginAt}</LastLoginAt>");
            xml.AppendLine("  <Consent>");
            xml.AppendLine($"    <DataProcessing>{userData.Consent.DataProcessingConsent}</DataProcessing>");
            xml.AppendLine($"    <Marketing>{userData.Consent.MarketingConsent}</Marketing>");
            xml.AppendLine($"    <Analytics>{userData.Consent.AnalyticsConsent}</Analytics>");
            xml.AppendLine($"    <Cookies>{userData.Consent.CookieConsent}</Cookies>");
            xml.AppendLine($"    <ThirdParty>{userData.Consent.ThirdPartyConsent}</ThirdParty>");
            xml.AppendLine("  </Consent>");
            xml.AppendLine("</UserData>");
            
            var bytes = Encoding.UTF8.GetBytes(xml.ToString());
            return File(bytes, "application/xml", $"{fileName}.xml");
        }

        private async Task LogSecurityEvent(string eventType, object details, string riskLevel)
        {
            try
            {
                var securityEvent = new SecurityEventDto
                {
                    Timestamp = DateTime.UtcNow,
                    Type = eventType,
                    Details = details,
                    RiskLevel = riskLevel,
                    UserAgent = Request.Headers.UserAgent.ToString(),
                    Url = Request.Path
                };

                await _neo4jService.LogSecurityEventAsync(securityEvent);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to log security event {EventType}", eventType);
            }
        }
    }
}
