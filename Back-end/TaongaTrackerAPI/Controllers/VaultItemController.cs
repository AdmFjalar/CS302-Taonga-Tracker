using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using TaongaTrackerAPI.Models;
using TaongaTrackerAPI.Services;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class VaultItemController : ControllerBase
{
    private readonly INeo4jService _neo4jService;

    public VaultItemController(INeo4jService neo4jService)
    {
        _neo4jService = neo4jService;
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
        Console.WriteLine("Vault ID: " + vault.VaultId + " Item ID: " + item.VaultItemId + " Item Title: " + item.Title + " Owner ID: " + userId);
        return Ok(item);
    }
    
    [HttpPost("upload-image")]
    public async Task<IActionResult> UploadImage([FromForm] IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file uploaded.");

        var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
        Directory.CreateDirectory(uploadsFolder);
        var filePath = Path.Combine(uploadsFolder, Guid.NewGuid() + Path.GetExtension(file.FileName));

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var url = $"/uploads/{Path.GetFileName(filePath)}";
        Console.WriteLine(url);
        return Ok(new { url });
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