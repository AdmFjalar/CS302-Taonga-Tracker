using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System.Security.Claims;
using TaongaTrackerAPI.Models;
using TaongaTrackerAPI.Services;

namespace TaongaTrackerAPI.Controllers
{
    /// <summary>
    /// Handles security operations including vulnerability scanning, activity logging, and security settings
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    [Produces("application/json")]
    public class SecurityController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly INeo4jService _neo4jService;
        private readonly ILogger<SecurityController> _logger;
        private readonly IConfiguration _configuration;

        public SecurityController(
            UserManager<ApplicationUser> userManager,
            INeo4jService neo4jService,
            ILogger<SecurityController> logger,
            IConfiguration configuration)
        {
            _userManager = userManager;
            _neo4jService = neo4jService;
            _logger = logger;
            _configuration = configuration;
        }

        /// <summary>
        /// Perform a comprehensive security scan
        /// </summary>
        [HttpPost("scan")]
        [EnableRateLimiting("GdprSecurityPolicy")]
        [ProducesResponseType(typeof(SecurityScanResultDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> SecurityScan([FromBody] SecurityScanDto model, CancellationToken cancellationToken = default)
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
                await LogSecurityEvent(SecurityEventTypes.SECURITY_SCAN, new
                {
                    UserId = userId,
                    ScanType = model.ScanType,
                    Timestamp = DateTime.UtcNow
                }, "low");

                var scanResult = await PerformSecurityScan(userId, model, cancellationToken);
                
                _logger.LogInformation("Security scan completed for user {UserId} with risk score {RiskScore}", 
                    userId, scanResult.RiskScore);

                return Ok(scanResult);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error performing security scan");
                return StatusCode(500, new { Message = "An error occurred during security scan" });
            }
        }

        /// <summary>
        /// Get current vulnerabilities for the user
        /// </summary>
        [HttpGet("vulnerabilities")]
        [ProducesResponseType(typeof(List<VulnerabilityDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetVulnerabilities(CancellationToken cancellationToken = default)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized();
                }

                var vulnerabilities = await _neo4jService.GetUserVulnerabilitiesAsync(userId, cancellationToken);
                return Ok(vulnerabilities);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving vulnerabilities");
                return StatusCode(500, new { Message = "An error occurred while retrieving vulnerabilities" });
            }
        }

        /// <summary>
        /// Log a security event
        /// </summary>
        [HttpPost("activity")]
        [EnableRateLimiting("GdprSecurityPolicy")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> LogActivity([FromBody] SecurityEventDto model, CancellationToken cancellationToken = default)
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

                await _neo4jService.LogSecurityEventAsync(model, userId, cancellationToken);
                
                _logger.LogInformation("Security event logged: {EventType} for user {UserId}", 
                    model.Type, userId);

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error logging security activity");
                return StatusCode(500, new { Message = "An error occurred while logging security activity" });
            }
        }

        /// <summary>
        /// Get security activity log
        /// </summary>
        [HttpGet("activity")]
        [ProducesResponseType(typeof(List<SecurityActivityDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetActivity(
            [FromQuery] string? eventType = null,
            [FromQuery] string? riskLevel = null,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null,
            [FromQuery] int limit = 100,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized();
                }

                var activities = await _neo4jService.GetSecurityActivityAsync(
                    userId, eventType, riskLevel, fromDate, toDate, limit, cancellationToken);
                
                return Ok(activities);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving security activity");
                return StatusCode(500, new { Message = "An error occurred while retrieving security activity" });
            }
        }

        /// <summary>
        /// Report a security breach
        /// </summary>
        [HttpPost("breach-report")]
        [EnableRateLimiting("GdprSecurityPolicy")]
        [ProducesResponseType(typeof(BreachReportResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> ReportBreach([FromBody] BreachReportDto model, CancellationToken cancellationToken = default)
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

                var reportId = Guid.NewGuid().ToString();
                var response = new BreachReportResponseDto
                {
                    ReportId = reportId,
                    Status = "received",
                    Timestamp = DateTime.UtcNow
                };

                // Log the breach report
                await LogSecurityEvent(SecurityEventTypes.DATA_BREACH, new
                {
                    ReportId = reportId,
                    BreachType = model.BreachType,
                    Description = model.Description,
                    AffectedData = model.AffectedData,
                    UserId = userId
                }, "critical");

                // Store breach report
                await _neo4jService.StoreBreachReportAsync(reportId, model, userId, cancellationToken);

                _logger.LogCritical("Security breach reported by user {UserId}: {BreachType} - {Description}", 
                    userId, model.BreachType, model.Description);

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reporting security breach");
                return StatusCode(500, new { Message = "An error occurred while reporting the breach" });
            }
        }

        /// <summary>
        /// Get security settings
        /// </summary>
        [HttpGet("settings")]
        [ProducesResponseType(typeof(SecuritySettingsDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetSecuritySettings(CancellationToken cancellationToken = default)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized();
                }

                var settings = await _neo4jService.GetSecuritySettingsAsync(userId, cancellationToken);
                if (settings == null)
                {
                    // Return default settings
                    settings = new SecuritySettingsDto
                    {
                        TwoFactorEnabled = false,
                        SessionTimeout = 30,
                        LoginAlerts = true,
                        SuspiciousActivityAlerts = true,
                        DataExportNotifications = true
                    };
                }

                return Ok(settings);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving security settings");
                return StatusCode(500, new { Message = "An error occurred while retrieving security settings" });
            }
        }

        /// <summary>
        /// Update security settings
        /// </summary>
        [HttpPut("settings")]
        [ProducesResponseType(typeof(SecuritySettingsDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> UpdateSecuritySettings([FromBody] SecuritySettingsDto model, CancellationToken cancellationToken = default)
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

                await _neo4jService.UpdateSecuritySettingsAsync(userId, model, cancellationToken);

                _logger.LogInformation("Security settings updated for user {UserId}", userId);

                return Ok(model);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating security settings");
                return StatusCode(500, new { Message = "An error occurred while updating security settings" });
            }
        }

        /// <summary>
        /// Manage two-factor authentication
        /// </summary>
        [HttpPost("2fa")]
        [EnableRateLimiting("GdprSecurityPolicy")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> ManageTwoFactor([FromBody] TwoFactorDto model, CancellationToken cancellationToken = default)
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

                var user = await _userManager.FindByIdAsync(userId);
                if (user == null)
                {
                    return NotFound(new { Message = "User not found" });
                }

                return model.Action.ToLower() switch
                {
                    "enable" => await EnableTwoFactor(user, model, cancellationToken),
                    "verify" => await VerifyTwoFactor(user, model, cancellationToken),
                    "disable" => await DisableTwoFactor(user, model, cancellationToken),
                    _ => BadRequest(new { Message = "Invalid action" })
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error managing two-factor authentication");
                return StatusCode(500, new { Message = "An error occurred while managing two-factor authentication" });
            }
        }

        private async Task<SecurityScanResultDto> PerformSecurityScan(string userId, SecurityScanDto model, CancellationToken cancellationToken)
        {
            var scanResult = new SecurityScanResultDto
            {
                ScanTimestamp = DateTime.UtcNow,
                RiskScore = 0.0,
                Vulnerabilities = new List<VulnerabilityDto>(),
                Permissions = new { },
                DataAccess = new { }
            };

            double riskScore = 0.0;
            var vulnerabilities = new List<VulnerabilityDto>();

            if (model.IncludeVulnerabilities)
            {
                var user = await _userManager.FindByIdAsync(userId);
                if (user != null)
                {
                    var passwordAgeVulnerability = CheckPasswordAge(user);
                    if (passwordAgeVulnerability != null)
                    {
                        vulnerabilities.Add(passwordAgeVulnerability);
                        riskScore += GetRiskScoreForSeverity(passwordAgeVulnerability.Severity);
                    }

                    if (!user.EmailConfirmed)
                    {
                        vulnerabilities.Add(new VulnerabilityDto
                        {
                            Id = Guid.NewGuid().ToString(),
                            Type = "EMAIL_UNCONFIRMED",
                            Severity = "medium",
                            Description = "Email address is not confirmed",
                            Recommendation = "Confirm your email address to improve account security"
                        });
                        riskScore += GetRiskScoreForSeverity("medium");
                    }

                    var twoFactorEnabled = await _userManager.GetTwoFactorEnabledAsync(user);
                    if (!twoFactorEnabled)
                    {
                        vulnerabilities.Add(new VulnerabilityDto
                        {
                            Id = Guid.NewGuid().ToString(),
                            Type = "TWO_FACTOR_DISABLED",
                            Severity = "high",
                            Description = "Two-factor authentication is not enabled",
                            Recommendation = "Enable two-factor authentication for enhanced security"
                        });
                        riskScore += GetRiskScoreForSeverity("high");
                    }

                    // Check recent login activity
                    var recentSuspiciousActivity = await _neo4jService.HasRecentSuspiciousActivityAsync(userId, cancellationToken);
                    if (recentSuspiciousActivity)
                    {
                        vulnerabilities.Add(new VulnerabilityDto
                        {
                            Id = Guid.NewGuid().ToString(),
                            Type = "SUSPICIOUS_ACTIVITY",
                            Severity = "high",
                            Description = "Recent suspicious activity detected",
                            Recommendation = "Review your recent account activity and change your password if necessary"
                        });
                        riskScore += GetRiskScoreForSeverity("high");
                    }
                }
            }

            scanResult.RiskScore = Math.Min(riskScore, 100.0); // Cap at 100
            scanResult.Vulnerabilities = vulnerabilities;

            return scanResult;
        }

        private async Task<IActionResult> EnableTwoFactor(ApplicationUser user, TwoFactorDto model, CancellationToken cancellationToken)
        {
            if (string.IsNullOrEmpty(model.Phone))
            {
                return BadRequest(new { Message = "Phone number is required to enable two-factor authentication" });
            }

            // Set phone number and enable 2FA
            user.PhoneNumber = model.Phone;
            await _userManager.UpdateAsync(user);
            await _userManager.SetTwoFactorEnabledAsync(user, true);

            // Log security event
            await LogSecurityEvent(SecurityEventTypes.TWO_FACTOR_ENABLED, new
            {
                UserId = user.Id,
                PhoneNumber = model.Phone,
                Timestamp = DateTime.UtcNow
            }, "low");

            _logger.LogInformation("Two-factor authentication enabled for user {UserId}", user.Id);

            return Ok(new { Message = "Two-factor authentication enabled successfully" });
        }

        private async Task<IActionResult> VerifyTwoFactor(ApplicationUser user, TwoFactorDto model, CancellationToken cancellationToken)
        {
            if (string.IsNullOrEmpty(model.Code))
            {
                return BadRequest(new { Message = "Verification code is required" });
            }

            // In a real implementation, you would verify the code with your 2FA provider
            // For now, we'll simulate verification
            var isValid = model.Code.Length == 6 && model.Code.All(char.IsDigit);
            
            if (!isValid)
            {
                return BadRequest(new { Message = "Invalid verification code" });
            }

            await Task.CompletedTask; // Satisfy async requirement

            return Ok(new { Message = "Two-factor authentication verified successfully" });
        }

        private async Task<IActionResult> DisableTwoFactor(ApplicationUser user, TwoFactorDto model, CancellationToken cancellationToken)
        {
            if (string.IsNullOrEmpty(model.Password))
            {
                return BadRequest(new { Message = "Password is required to disable two-factor authentication" });
            }

            // Verify password
            var passwordValid = await _userManager.CheckPasswordAsync(user, model.Password);
            if (!passwordValid)
            {
                return BadRequest(new { Message = "Invalid password" });
            }

            await _userManager.SetTwoFactorEnabledAsync(user, false);

            // Log security event
            await LogSecurityEvent(SecurityEventTypes.TWO_FACTOR_DISABLED, new
            {
                UserId = user.Id,
                Timestamp = DateTime.UtcNow
            }, "medium");

            _logger.LogInformation("Two-factor authentication disabled for user {UserId}", user.Id);

            return Ok(new { Message = "Two-factor authentication disabled successfully" });
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

                // If high or critical risk, you might want to send notifications
                if (riskLevel is "high" or "critical")
                {
                    _logger.LogWarning("High/Critical security event: {EventType} - {Details}", 
                        eventType, System.Text.Json.JsonSerializer.Serialize(details));
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to log security event {EventType}", eventType);
            }
        }
        
        private VulnerabilityDto? CheckPasswordAge(ApplicationUser user)
        {
            if (user.PasswordChangedAt == null)
            {
                // If we don't have a password change date, it's likely never been changed since creation
                return new VulnerabilityDto
                {
                    Id = Guid.NewGuid().ToString(),
                    Type = "PASSWORD_AGE_UNKNOWN",
                    Severity = "medium",
                    Description = "Password age cannot be determined - may never have been changed",
                    Recommendation = "Change your password regularly (recommended every 90 days)"
                };
            }

            var passwordAge = DateTime.UtcNow - user.PasswordChangedAt.Value;
            var maxPasswordAgeDays = _configuration.GetValue<int>("Security:MaxPasswordAgeDays", 90);

            if (passwordAge.TotalDays > maxPasswordAgeDays)
            {
                var severity = passwordAge.TotalDays > (maxPasswordAgeDays * 2) ? "high" : "medium";
                
                return new VulnerabilityDto
                {
                    Id = Guid.NewGuid().ToString(),
                    Type = "OLD_PASSWORD",
                    Severity = severity,
                    Description = $"Password is {(int)passwordAge.TotalDays} days old (exceeds recommended {maxPasswordAgeDays} days)",
                    Recommendation = $"Change your password regularly. Your password has not been changed in {(int)passwordAge.TotalDays} days"
                };
            }

            return null;
        }

        private static double GetRiskScoreForSeverity(string severity)
        {
            return severity.ToLower() switch
            {
                "low" => 10.0,      // Low risk: 10 points
                "medium" => 20.0,   // Medium risk: 20 points  
                "high" => 30.0,     // High risk: 30 points
                "critical" => 40.0, // Critical risk: 40 points
                _ => 5.0            // Unknown: 5 points
            };
        }
    }
}
