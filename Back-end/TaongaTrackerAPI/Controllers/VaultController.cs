using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using TaongaTrackerAPI.Models;
using TaongaTrackerAPI.Services;

namespace TaongaTrackerAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class VaultController : ControllerBase
    {
        private readonly INeo4jService Neo4jService;
        
        public VaultController(INeo4jService neo4jService)
        {
            Neo4jService = neo4jService;
        }
        
        
    }   
}