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
    public class FamilyMemberController : ControllerBase
    {
        private readonly INeo4jService _neo4jService;

        public FamilyMemberController(INeo4jService neo4jService)
        {
            _neo4jService = neo4jService;
        }

        /// <summary>
        /// Adds a family member to the user's family tree, creating the tree if needed.
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<FamilyMemberDto>> AddFamilyMember([FromBody] FamilyMemberDto member)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            var createdMember = await _neo4jService.AddFamilyMemberToUserTreeAsync(userId, member);
            return Ok(createdMember);
        }

        [HttpPut("{familyMemberId}")]
        public async Task<ActionResult<FamilyMemberDto>> UpdateFamilyMember(string familyMemberId, [FromBody] FamilyMemberDto member)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            var updated = await _neo4jService.UpdateFamilyMemberAsync(userId, familyMemberId, member);
            return Ok(updated);
        }

        [HttpDelete("{familyMemberId}")]
        public async Task<IActionResult> DeleteFamilyMember(string familyMemberId)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            await _neo4jService.DeleteFamilyMemberAsync(userId, familyMemberId);
            return NoContent();
        }

        /// <summary>
        /// Gets all family members in the user's family tree.
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<List<FamilyMemberDto>>> GetFamilyMembers()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            // Ensure the family tree and user node exist
            await _neo4jService.GetOrCreateUserFamilyTreeAsync(userId);

            var members = await _neo4jService.GetUserFamilyMembersAsync(userId);
            return Ok(members);
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
            return Ok(new { url });
        }
    }
}