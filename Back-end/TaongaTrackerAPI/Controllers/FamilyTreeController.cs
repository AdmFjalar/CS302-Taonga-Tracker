using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using TaongaTrackerAPI.Models;
using TaongaTrackerAPI.Services;

namespace TaongaTrackerAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FamilyTreeController : ControllerBase
    {
        private readonly INeo4jService _neo4jService;
        
        public FamilyTreeController(INeo4jService neo4jService)
        {
            _neo4jService = neo4jService;
        }

        [HttpPost]
        public async Task<ActionResult<FamilyMemberDto>> CreateFamilyTreeFromJsonAsync([FromBody] string jsonRequest)
        {
            await _neo4jService.CreateFamilyTreeFromJsonAsync(jsonRequest);
            return Ok();
        }
        // public async Task<ActionResult<FamilyMemberDto>> CreateFamilyMember(FamilyMemberDto familyMember)
        // {
        //     await _neo4jService.CreateFamilyMemberAsync(familyMember);
        //     return Ok(familyMember);
        // }
        
        [HttpGet]
        public async Task<ActionResult<List<FamilyTreeDto>>> GetAllFamilyTrees()
        {
            var familyTrees = await _neo4jService.GetAllFamilyTreesAsync();
            return Ok(familyTrees);
        }
    }   
}