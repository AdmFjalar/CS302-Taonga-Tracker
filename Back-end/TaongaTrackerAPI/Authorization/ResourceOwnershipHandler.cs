using Microsoft.AspNetCore.Authorization;
using TaongaTrackerAPI.Services;

namespace TaongaTrackerAPI.Authorization
{
    public class ResourceOwnershipHandler : AuthorizationHandler<ResourceOwnershipRequirement>
    {
        private readonly INeo4jService _neo4jService;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public ResourceOwnershipHandler(INeo4jService neo4jService, IHttpContextAccessor httpContextAccessor)
        {
            _neo4jService = neo4jService;
            _httpContextAccessor = httpContextAccessor;
        }

        protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, ResourceOwnershipRequirement requirement)
        {
            var userId = context.User.FindFirst("sub")?.Value ?? context.User.FindFirst("id")?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                context.Fail();
                return;
            }

            var httpContext = _httpContextAccessor.HttpContext;
            var resourceId = httpContext?.Request.RouteValues["id"]?.ToString();
            
            if (string.IsNullOrEmpty(resourceId))
            {
                context.Fail();
                return;
            }

            var hasAccess = await _neo4jService.HasUserAccessToResourceAsync(userId, resourceId, requirement.ResourceType);
            
            if (hasAccess)
            {
                context.Succeed(requirement);
            }
            else
            {
                context.Fail();
            }
        }
    }
}