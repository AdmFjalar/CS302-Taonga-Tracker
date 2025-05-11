using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using TaongaTrackerAPI.Models;
using TaongaTrackerAPI.Services;

namespace TaongaTrackerAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class VaultController : ControllerBase
    {
        private readonly INeo4jService _neo4jService;
        
        public VaultController(INeo4jService neo4jService)
        {
            _neo4jService = neo4jService;
        }
        
        
    }   
}