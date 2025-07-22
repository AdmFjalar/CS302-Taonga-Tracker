using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.Security;
using TaongaTrackerAPI.Models;
using TaongaTrackerAPI.Services;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class VaultItemController : ControllerBase
{
    private readonly INeo4jService _neo4jService;
    private readonly IFileUploadService _fileUploadService;
    private readonly ILogger<VaultItemController> _logger;

    public VaultItemController(
        INeo4jService neo4jService,
        IFileUploadService fileUploadService,
        ILogger<VaultItemController> logger)
    {
        _neo4jService = neo4jService;
        _fileUploadService = fileUploadService;
        _logger = logger;
    }

    [HttpPost]
    public async Task<IActionResult> CreateVaultItem([FromBody] VaultItemDto item)
    {
        Console.WriteLine(item.Title);
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        // Find or create a vault for the user
        var vault = await _neo4jService.GetOrCreateUserVaultAsync(userId);
        await _neo4jService.CreateVaultItemAsync(item, vault.VaultId, userId);
        return Ok(item);
    }
    
    [HttpPost("upload-image")]
    [RequestSizeLimit(5 * 1024 * 1024)] // 5MB limit
    [RequestFormLimits(MultipartBodyLengthLimit = 5 * 1024 * 1024)]
    public async Task<IActionResult> UploadImage([FromForm] IFormFile file, CancellationToken cancellationToken = default)
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

            // Use the secure file upload service
            var imageUrl = await _fileUploadService.UploadImageAsync(file, userId, cancellationToken);

            _logger.LogInformation("Vault item image uploaded successfully by user: {UserId}, URL: {ImageUrl}", 
                userId, imageUrl);

            return Ok(new { url = imageUrl });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("File upload validation failed: {Message}", ex.Message);
            return BadRequest(new { Message = ex.Message });
        }
        catch (SecurityException ex)
        {
            _logger.LogWarning("File upload security check failed: {Message}", ex.Message);
            return BadRequest(new { Message = "File upload rejected: " + ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during vault item image upload");
            return StatusCode(500, new { Message = "An error occurred while uploading the image" });
        }
    }
    
    [HttpPut("{vaultItemId}")]
    public async Task<IActionResult> UpdateVaultItem(string vaultItemId, [FromBody] VaultItemDto item)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();
        item.VaultItemId = vaultItemId;
        await _neo4jService.UpdateVaultItemAsync(item, userId);
        return Ok(item);
    }

    [HttpDelete("{vaultItemId}")]
    public async Task<IActionResult> DeleteVaultItem(string vaultItemId)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();
        await _neo4jService.DeleteVaultItemAsync(vaultItemId, userId);
        return NoContent();
    }

    [HttpGet]
    public async Task<IActionResult> GetUserVaultItems()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        var items = await _neo4jService.GetUserVaultItemsAsync(userId);
        return Ok(items);
    }
}