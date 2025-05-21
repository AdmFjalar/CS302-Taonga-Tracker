using Microsoft.AspNetCore.Identity;
using Neo4j.Driver;
using TaongaTrackerAPI.Models;
using TaongaTrackerAPI.Services;

namespace TaongaTrackerAPI.Data;

public class UserStore : IUserStore<ApplicationUser>, IUserPasswordStore<ApplicationUser>
{
    private readonly INeo4jService Neo4jService;

    public UserStore(INeo4jService neo4JService)
    {
        Neo4jService = neo4JService;
    }

    public async Task<IdentityResult> CreateAsync(ApplicationUser user, CancellationToken cancellationToken)
    {
        var result = await Neo4jService.CreateUserAsync(user, cancellationToken);
        return result;
    }

    public async Task<ApplicationUser> FindByEmailAsync(string normalizedEmail, CancellationToken cancellationToken)
    {
        var user = await Neo4jService.FindUserByEmailAsync(normalizedEmail, cancellationToken);
        return user;
    }

    public Task<string> GetPasswordHashAsync(ApplicationUser user, CancellationToken cancellationToken)
    {
        return Task.FromResult(user.PasswordHash);
    }

    public Task<bool> HasPasswordAsync(ApplicationUser user, CancellationToken cancellationToken)
    {
        return Task.FromResult(!string.IsNullOrEmpty(user.PasswordHash));
    }

    public async Task<string?> GetNormalizedUserNameAsync(ApplicationUser user, CancellationToken cancellationToken)
    {
        throw new NotImplementedException();
    }

    public Task SetNormalizedUserNameAsync(ApplicationUser user, string normalizedName, CancellationToken cancellationToken)
    {
        user.NormalizedUserName = normalizedName;
        return Task.CompletedTask;
    }

    public Task SetPasswordHashAsync(ApplicationUser user, string passwordHash, CancellationToken cancellationToken)
    {
        user.PasswordHash = passwordHash;
        return Task.CompletedTask;
    }

    public async Task<string?> GetUserNameAsync(ApplicationUser user, CancellationToken cancellationToken)
    {
        throw new NotImplementedException();
    }

    public Task SetUserNameAsync(ApplicationUser user, string userName, CancellationToken cancellationToken)
    {
        user.UserName = userName;
        return Task.CompletedTask;
    }

    public Task<string> GetUserIdAsync(ApplicationUser user, CancellationToken cancellationToken)
    {
        return Task.FromResult(user.Id);
    }

    public Task<string> GetFirstNameAsync(ApplicationUser user, CancellationToken cancellationToken)
    {
        return Task.FromResult(user.FirstName);
    }

    public Task<string> GetMiddleNamesAsync(ApplicationUser user, CancellationToken cancellationToken)
    {
        return Task.FromResult(user.MiddleNames);
    }
    
    public Task<string> GetLastNameAsync(ApplicationUser user, CancellationToken cancellationToken)
    {
        return Task.FromResult(user.LastName);
    }
    
    public async Task<IdentityResult> UpdateAsync(ApplicationUser user, CancellationToken cancellationToken)
    {
        var result = await Neo4jService.UpdateUserAsync(user, cancellationToken);
        return result;
    }

    public async Task<IdentityResult> DeleteAsync(ApplicationUser user, CancellationToken cancellationToken)
    {
        var result = await Neo4jService.DeleteUserAsync(user, cancellationToken);
        return result;
    }

    public async Task<ApplicationUser?> FindByIdAsync(string userId, CancellationToken cancellationToken)
    {
        var user = await Neo4jService.FindUserByIdAsync(userId, cancellationToken);
        return user;
}

    public async Task<ApplicationUser?> FindByNameAsync(string normalizedUserName, CancellationToken cancellationToken)
    {
       var user = await Neo4jService.FindUserByNameAsync(normalizedUserName, cancellationToken);
       return user;
    }

    public void Dispose()
    {
    }
}