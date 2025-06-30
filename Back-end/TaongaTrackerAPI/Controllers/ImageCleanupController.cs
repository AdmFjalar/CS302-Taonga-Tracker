using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TaongaTrackerAPI.Services;

namespace TaongaTrackerAPI.Controllers
{
    /// <summary>
    /// Handles image cleanup operations and monitoring
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    [Produces("application/json")]
    public class ImageCleanupController : ControllerBase
    {
        private readonly IImageCleanupService _cleanupService;
        private readonly ILogger<ImageCleanupController> _logger;

        public ImageCleanupController(
            IImageCleanupService cleanupService,
            ILogger<ImageCleanupController> logger)
        {
            _cleanupService = cleanupService;
            _logger = logger;
        }

        /// <summary>
        /// Get image cleanup statistics and current status
        /// </summary>
        [HttpGet("stats")]
        [ProducesResponseType(typeof(ImageCleanupStats), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> GetImageStats(CancellationToken cancellationToken = default)
        {
            try
            {
                var stats = await _cleanupService.GetImageStatsAsync(cancellationToken);
                
                _logger.LogInformation("Retrieved image cleanup statistics: {TotalFiles} total, {Orphaned} orphaned, {DiskUsage} disk usage",
                    stats.TotalUploadedFiles, stats.OrphanedFileCount, stats.GetDiskUsageFormatted());

                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving image cleanup statistics");
                return StatusCode(500, new { Message = "An error occurred while retrieving image statistics" });
            }
        }

        /// <summary>
        /// Manually trigger image cleanup process
        /// </summary>
        [HttpPost("cleanup")]
        [EnableRateLimiting("GdprSecurityPolicy")]
        [ProducesResponseType(typeof(ImageCleanupResult), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> TriggerCleanup(CancellationToken cancellationToken = default)
        {
            try
            {
                _logger.LogInformation("Manual image cleanup triggered by admin user");

                var result = await _cleanupService.CleanupOrphanedImagesAsync(cancellationToken);

                if (result.Success)
                {
                    _logger.LogInformation("Manual image cleanup completed successfully: {Summary}", result.GetSummary());
                    return Ok(result);
                }
                else
                {
                    _logger.LogError("Manual image cleanup failed: {Error}", result.ErrorMessage);
                    return BadRequest(new { Message = result.ErrorMessage, Details = result });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during manual image cleanup");
                return StatusCode(500, new { Message = "An error occurred during cleanup process" });
            }
        }

        /// <summary>
        /// Check if a specific image file is still referenced in the database
        /// </summary>
        [HttpGet("check-reference")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> CheckImageReference(
            [FromQuery] string imagePath,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrEmpty(imagePath))
            {
                return BadRequest(new { Message = "Image path is required" });
            }

            try
            {
                var isReferenced = await _cleanupService.IsImageReferencedAsync(imagePath, cancellationToken);
                
                return Ok(new
                {
                    ImagePath = imagePath,
                    IsReferenced = isReferenced,
                    Status = isReferenced ? "Referenced" : "Orphaned"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking image reference for path: {ImagePath}", imagePath);
                return StatusCode(500, new { Message = "An error occurred while checking image reference" });
            }
        }

        /// <summary>
        /// Get cleanup history and logs
        /// </summary>
        [HttpGet("history")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> GetCleanupHistory(CancellationToken cancellationToken = default)
        {
            try
            {
                var stats = await _cleanupService.GetImageStatsAsync(cancellationToken);
                
                return Ok(new
                {
                    LastCleanupTime = stats.LastCleanupTime,
                    CurrentStats = stats,
                    Message = stats.LastCleanupTime.HasValue 
                        ? $"Last cleanup performed on {stats.LastCleanupTime:yyyy-MM-dd HH:mm:ss} UTC"
                        : "No cleanup history available"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving cleanup history");
                return StatusCode(500, new { Message = "An error occurred while retrieving cleanup history" });
            }
        }

        /// <summary>
        /// Get cleanup configuration and status
        /// </summary>
        [HttpGet("config")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public IActionResult GetCleanupConfig()
        {
            var config = HttpContext.RequestServices.GetRequiredService<IConfiguration>();
            
            return Ok(new
            {
                BackgroundServiceEnabled = config.GetValue<bool>("ImageCleanup:BackgroundServiceEnabled", true),
                IntervalHours = config.GetValue<int>("ImageCleanup:IntervalHours", 24),
                EnableDeletion = config.GetValue<bool>("ImageCleanup:EnableDeletion", false),
                ProtectedAgeHours = config.GetValue<int>("ImageCleanup:ProtectedAgeHours", 24),
                MaxDeletionsPerRun = config.GetValue<int>("ImageCleanup:MaxDeletionsPerRun", 100),
                Message = "Image cleanup configuration settings"
            });
        }
    }
}
