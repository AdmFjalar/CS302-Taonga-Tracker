using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System.Security.Claims;
using TaongaTrackerAPI.Services;

namespace TaongaTrackerAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
[EnableRateLimiting("GeneralPolicy")]
public class FileUploadController : ControllerBase
{
    private readonly IFileUploadService _fileUploadService;
    private readonly ILogger<FileUploadController> _logger;

    public FileUploadController(
        IFileUploadService fileUploadService,
        ILogger<FileUploadController> logger)
    {
        _fileUploadService = fileUploadService;
        _logger = logger;
    }

    [HttpPost("image")]
    [RequestSizeLimit(5 * 1024 * 1024)] // 5MB limit
    [RequestFormLimits(MultipartBodyLengthLimit = 5 * 1024 * 1024)]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status413PayloadTooLarge)]
    [ProducesResponseType(StatusCodes.Status415UnsupportedMediaType)]
    public async Task<IActionResult> UploadImage(IFormFile file, CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogWarning("File upload attempt without valid user ID");
                return Unauthorized();
            }

            if (file == null || file.Length == 0)
            {
                return BadRequest(new { Message = "No file provided or file is empty" });
            }

            // Validate file before processing
            if (!_fileUploadService.IsValidImageFile(file))
            {
                _logger.LogWarning("Invalid file upload attempt by user: {UserId}, FileName: {FileName}", 
                    userId, file.FileName);
                return BadRequest(new { Message = "Invalid file type or format" });
            }

            var imageUrl = await _fileUploadService.UploadImageAsync(file, userId, cancellationToken);

            _logger.LogInformation("Image uploaded successfully by user: {UserId}, URL: {ImageUrl}", 
                userId, imageUrl);

            return Ok(new 
            { 
                Message = "Image uploaded successfully",
                ImageUrl = imageUrl,
                FileName = Path.GetFileName(imageUrl)
            });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("File upload validation failed: {Message}", ex.Message);
            return BadRequest(new { Message = ex.Message });
        }
        catch (SecurityException ex)
        {
            _logger.LogWarning("File upload security violation: {Message}", ex.Message);
            return StatusCode(415, new { Message = "File failed security validation" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during file upload");
            return StatusCode(500, new { Message = "An error occurred while uploading the file" });
        }
    }

    [HttpDelete("image/{fileName}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteImage(string fileName)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            if (string.IsNullOrWhiteSpace(fileName))
            {
                return BadRequest(new { Message = "File name is required" });
            }

            var deleted = await _fileUploadService.DeleteImageAsync(fileName, userId);
            
            if (deleted)
            {
                return Ok(new { Message = "Image deleted successfully" });
            }
            else
            {
                return NotFound(new { Message = "Image not found" });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting image: {FileName}", fileName);
            return StatusCode(500, new { Message = "An error occurred while deleting the image" });
        }
    }
}
