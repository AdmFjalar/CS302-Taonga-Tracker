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
        private readonly IFileUploadService _fileUploadService;
        private readonly ILogger<FamilyMemberController> _logger;

        public FamilyMemberController(
            INeo4jService neo4jService,
            IFileUploadService fileUploadService,
            ILogger<FamilyMemberController> logger)
        {
            _neo4jService = neo4jService;
            _fileUploadService = fileUploadService;
            _logger = logger;
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

                _logger.LogInformation("Family member image uploaded successfully by user: {UserId}, URL: {ImageUrl}", 
                    userId, imageUrl);

                return Ok(new { url = imageUrl });
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning("File upload validation failed: {Message}", ex.Message);
                return BadRequest(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error during family member image upload");
                return StatusCode(500, new { Message = "An error occurred while uploading the image" });
            }
        }
    }
}