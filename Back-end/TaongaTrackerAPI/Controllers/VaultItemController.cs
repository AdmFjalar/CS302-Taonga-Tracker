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

    [HttpGet]
    public async Task<IActionResult> GetUserVaultItems()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        var items = await _neo4jService.GetUserVaultItemsAsync(userId);
        return Ok(items);
    }
}