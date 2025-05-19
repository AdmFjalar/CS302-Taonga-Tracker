using Microsoft.AspNetCore.Identity;
using Neo4j.Driver;
using TaongaTrackerAPI.Models;

namespace TaongaTrackerAPI.Data;

public class UserStore : IUserStore<ApplicationUser>, IUserPasswordStore<ApplicationUser>
{
    private readonly IDriver _driver;

    public UserStore(IDriver driver)
    {
        _driver = driver;
    }

    public async Task<IdentityResult> CreateAsync(ApplicationUser user, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        await using var session = _driver.AsyncSession();

        try
        {
            var query = @"
                CREATE (u:User {Id: $Id, UserName: $UserName, NormalizedUserName: $NormalizedUserName, 
                                Email: $Email, NormalizedEmail: $NormalizedEmail, 
                                PasswordHash: $PasswordHash, SecurityStamp: $SecurityStamp})
                RETURN u";

            await session.RunAsync(query, new
            {
                user.Id,
                user.UserName,
                user.NormalizedUserName,
                user.Email,
                user.NormalizedEmail,
                user.PasswordHash,
                user.SecurityStamp
            });

            return IdentityResult.Success;
        }
        catch (Exception ex)
        {
            return IdentityResult.Failed(new IdentityError { Description = ex.Message });
        }
    }

    public async Task<ApplicationUser> FindByEmailAsync(string normalizedEmail, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        await using var session = _driver.AsyncSession();

        try
        {
            var query = @"
                MATCH (u:User)
                WHERE u.NormalizedEmail = $NormalizedEmail
                RETURN u";
            var result = await session.RunAsync(query, new { normalizedEmail });

            var record = await result.SingleAsync();
            if (record == null) return null;

            var node = record["u"].As<INode>();
            return new ApplicationUser
            {
                Id = node.ElementId,
                Email = node.Properties.ContainsKey("Email") ? node["Email"].As<string>() : null,
                FirstName = node.Properties.ContainsKey("FirstName") ? node["FirstName"].As<string>() : null,
                MiddleNames = node.Properties.ContainsKey("MiddleNames") ? node["MiddleNames"].As<string>() : null,
                LastName = node.Properties.ContainsKey("LastName") ? node["LastName"].As<string>() : null,
                NormalizedEmail = node.Properties.ContainsKey("NormalizedEmail") ? node["NormalizedEmail"].As<string>() : null,
                UserName = node.Properties.ContainsKey("UserName") ? node["UserName"].As<string>() : null,
                NormalizedUserName = node.Properties.ContainsKey("NormalizedUserName") ? node["NormalizedUserName"].As<string>() : null,
                PasswordHash = node.Properties.ContainsKey("PasswordHash") ? node["PasswordHash"].As<string>() : null,
                SecurityStamp = node.Properties.ContainsKey("SecurityStamp") ? node["SecurityStamp"].As<string>() : null
            };

        }
        catch (Exception e)
        {
            throw new Exception(e.Message);
        }
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
        cancellationToken.ThrowIfCancellationRequested();
        await using var session = _driver.AsyncSession();

        try
        {
            var query = @"
            MATCH (u:User {Id: $Id})
            SET u.UserName = $UserName,
                u.NormalizedUserName = $NormalizedUserName,
                u.Email = $Email,
                u.NormalizedEmail = $NormalizedEmail,
                u.PasswordHash = $PasswordHash,
                u.SecurityStamp = $SecurityStamp,
                u.FirstName = $FirstName,
                u.MiddleNames = $MiddleNames,
                u.LastName = $LastName
            RETURN u";

            var result = await session.RunAsync(query, new
            {
                user.Id,
                user.UserName,
                user.NormalizedUserName,
                user.Email,
                user.NormalizedEmail,
                user.PasswordHash,
                user.SecurityStamp,
                user.FirstName,
                user.MiddleNames,
                user.LastName
            });

            // If no records were affected, return a failure result.
            if (!await result.FetchAsync())
            {
                return IdentityResult.Failed(new IdentityError { Description = "User not found or update failed." });
            }

            return IdentityResult.Success;
        }
        catch (Exception e)
        {
            return IdentityResult.Failed(new IdentityError { Description = e.Message });
        }
    }

    public async Task<IdentityResult> DeleteAsync(ApplicationUser user, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        await using var session = _driver.AsyncSession();

        try
        {
            var query = @"
            MATCH (u:User {Id: $Id})
            DELETE u";

        await session.RunAsync(query, new
        {
            user.Id
        });

        return IdentityResult.Success;
        }
        catch (Exception e)
        {
            return IdentityResult.Failed(new IdentityError { Description = e.Message });
        }
    }

    public async Task<ApplicationUser?> FindByIdAsync(string userId, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        await using var session = _driver.AsyncSession();

        try
        {
            var query = @"
            MATCH (u:User)
            WHERE u.elementId = $ElementId
            RETURN u";

        var result = await session.RunAsync(query, new { ElementId = userId });
        var record = await result.SingleAsync();

        if (record == null)
        {
            return null;
        }

        var node = record["u"].As<INode>();
        return new ApplicationUser
        {
            Id = node.ElementId, // Using ElementId
            FirstName = node.Properties.ContainsKey("FirstName") ? node["FirstName"].As<string>() : null,
            MiddleNames = node.Properties.ContainsKey("MiddleNames") ? node["MiddleNames"].As<string>() : null,
            LastName = node.Properties.ContainsKey("LastName") ? node["LastName"].As<string>() : null,
            Email = node.Properties.ContainsKey("Email") ? node["Email"].As<string>() : null,
            NormalizedEmail = node.Properties.ContainsKey("NormalizedEmail") ? node["NormalizedEmail"].As<string>() : null,
            UserName = node.Properties.ContainsKey("UserName") ? node["UserName"].As<string>() : null,
            NormalizedUserName = node.Properties.ContainsKey("NormalizedUserName") ? node["NormalizedUserName"].As<string>() : null,
            PasswordHash = node.Properties.ContainsKey("PasswordHash") ? node["PasswordHash"].As<string>() : null,
            SecurityStamp = node.Properties.ContainsKey("SecurityStamp") ? node["SecurityStamp"].As<string>() : null
        };
    }
    catch (Exception ex)
    {
        // Handle or log error if needed
        throw new Exception($"Error occurred while finding user by ID: {ex.Message}", ex);
    }
}

    public async Task<ApplicationUser?> FindByNameAsync(string normalizedUserName, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        await using var session = _driver.AsyncSession();

        try
        {
            var query = @"
                MATCH (u:User)
                WHERE u.NormalizedUserName = $NormalizedUserName
                RETURN u";
            var result = await session.RunAsync(query, new { normalizedUserName });

            var record = await result.SingleAsync();
            if (record == null) return null;

            var node = record["u"].As<INode>();
            return new ApplicationUser
            {
                Id = node.ElementId,
                Email = node.Properties.ContainsKey("Email") ? node["Email"].As<string>() : null,
                FirstName = node.Properties.ContainsKey("FirstName") ? node["FirstName"].As<string>() : null,
                MiddleNames = node.Properties.ContainsKey("MiddleNames") ? node["MiddleNames"].As<string>() : null,
                LastName = node.Properties.ContainsKey("LastName") ? node["LastName"].As<string>() : null,
                NormalizedEmail = node.Properties.ContainsKey("NormalizedEmail") ? node["NormalizedEmail"].As<string>() : null,
                UserName = node.Properties.ContainsKey("UserName") ? node["UserName"].As<string>() : null,
                NormalizedUserName = node.Properties.ContainsKey("NormalizedUserName") ? node["NormalizedUserName"].As<string>() : null,
                PasswordHash = node.Properties.ContainsKey("PasswordHash") ? node["PasswordHash"].As<string>() : null,
                SecurityStamp = node.Properties.ContainsKey("SecurityStamp") ? node["SecurityStamp"].As<string>() : null
            };

        }
        catch (Exception e)
        {
            throw new Exception(e.Message);
        }
    }

    public void Dispose()
    {
        // Dispose resources if needed
    }
}