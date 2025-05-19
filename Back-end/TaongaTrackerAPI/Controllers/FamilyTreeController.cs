using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using TaongaTrackerAPI.Models;
using TaongaTrackerAPI.Services;

namespace TaongaTrackerAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class FamilyTreeController : ControllerBase
    {
        private readonly INeo4jService Neo4jService;
        
        public FamilyTreeController(INeo4jService neo4jService)
        {
            Neo4jService = neo4jService;
        }

        [HttpPost]
        public async Task<ActionResult<FamilyMemberDto>> CreateFamilyTreeFromJsonAsync([FromBody] string jsonRequest)
        {
            await Neo4jService.CreateFamilyTreeFromJsonAsync(jsonRequest);
            return Ok();
        }
        // public async Task<ActionResult<FamilyMemberDto>> CreateFamilyMember(FamilyMemberDto familyMember)
        // {
        //     await Neo4jService.CreateFamilyMemberAsync(familyMember);
        //     return Ok(familyMember);
        // }
        
        [HttpGet]
        public async Task<ActionResult<List<FamilyTreeDto>>> GetAllFamilyTrees()
        {
            var familyTrees = await Neo4jService.GetAllFamilyTreesAsync();
            return Ok(familyTrees);
        }
    }   
}