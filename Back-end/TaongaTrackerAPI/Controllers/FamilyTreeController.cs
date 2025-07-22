using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using TaongaTrackerAPI.Models;
using TaongaTrackerAPI.Services;

namespace TaongaTrackerAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class FamilyTreeController : ControllerBase
    {
        private readonly INeo4jService _neo4jService;

        public FamilyTreeController(INeo4jService neo4jService)
        {
            _neo4jService = neo4jService;
        }

        /// <summary>
        /// Gets the user's family tree with all members and relationships.
        /// </summary>
        [HttpGet("me")]
        public async Task<ActionResult<FamilyTreeDto>> GetMyFamilyTree()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            var tree = await _neo4jService.GetUserFamilyTreeAsync(userId);
            return Ok(tree);
        }
    }
}