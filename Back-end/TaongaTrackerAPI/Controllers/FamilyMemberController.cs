using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using TaongaTrackerAPI.Models;
using TaongaTrackerAPI.Services;

namespace TaongaTrackerAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FamilyMemberController : ControllerBase
    {
        private readonly INeo4jService _neo4jService;
        
        public FamilyMemberController(INeo4jService neo4jService)
        {
            _neo4jService = neo4jService;
        }

        [HttpPost]
        public async Task<ActionResult<FamilyMemberDto>> CreateFamilyMember(FamilyMemberDto familyMember)
        {
            await _neo4jService.CreateFamilyMemberAsync(familyMember);
            return Ok(familyMember);
        }
        
        [HttpGet]
        public async Task<ActionResult<List<FamilyMemberDto>>> GetAllFamilyMembers()
        {
            var familyMembers = await _neo4jService.GetAllFamilyMembersAsync();
            return Ok(familyMembers);
        }
    }   
}