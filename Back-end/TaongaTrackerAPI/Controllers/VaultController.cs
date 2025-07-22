// Controllers/VaultController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using TaongaTrackerAPI.Models;
using TaongaTrackerAPI.Services;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class VaultController : ControllerBase
{
    private readonly INeo4jService _neo4jService;

    public VaultController(INeo4jService neo4jService)
    {
        _neo4jService = neo4jService;
    }

    [HttpPost]
    public async Task<IActionResult> CreateVault([FromBody] VaultDto vault)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        await _neo4jService.CreateVaultAsync(vault, userId);
        return Ok(vault);
    }

    [HttpGet]
    public async Task<IActionResult> GetUserVaults()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        var vaults = await _neo4jService.GetUserVaultsAsync(userId);
        return Ok(vaults);
    }
}