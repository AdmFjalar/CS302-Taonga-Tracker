using Microsoft.AspNetCore.Authorization;

namespace TaongaTrackerAPI.Authorization
{
    public class ResourceOwnershipRequirement : IAuthorizationRequirement
    {
        public string ResourceType { get; }
        
        public ResourceOwnershipRequirement(string resourceType)
        {
            ResourceType = resourceType;
        }
    }
}