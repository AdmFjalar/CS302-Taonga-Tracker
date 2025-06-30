using Microsoft.AspNetCore.Identity;
using Neo4j.Driver;
using TaongaTrackerAPI.Models;

namespace TaongaTrackerAPI.Services;

public partial class Neo4jService
{
    // User management methods with improved error handling and security
    public async Task<IdentityResult> CreateUserAsync(ApplicationUser user, CancellationToken cancellationToken)
    {
        try
        {
            return await ExecuteWithRetryAsync(async session =>
            {
                var query = @"
                    CREATE (u:User {
                        Id: $Id, 
                        UserName: $UserName, 
                        NormalizedUserName: $NormalizedUserName,
                        Email: $Email, 
                        NormalizedEmail: $NormalizedEmail,
                        PasswordHash: $PasswordHash, 
                        SecurityStamp: $SecurityStamp,
                        FirstName: $FirstName, 
                        MiddleNames: $MiddleNames, 
                        LastName: $LastName,
                        EmailConfirmed: $EmailConfirmed, 
                        ConcurrencyStamp: $ConcurrencyStamp,
                        ProfilePictureUrl: $ProfilePictureUrl,
                        CreatedAt: datetime(),
                        LastModified: datetime()
                    })
                    RETURN u.Id as Id";

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
                    user.LastName,
                    user.EmailConfirmed,
                    user.ConcurrencyStamp,
                    user.ProfilePictureUrl
                });

                var records = await result.ToListAsync();
                if (records.Count == 0)
                {
                    Logger.LogError("Failed to create user - no records returned for user: {UserId}", user.Id);
                    return IdentityResult.Failed(new IdentityError
                    {
                        Code = "CreateUserFailed",
                        Description = "Failed to create user in database"
                    });
                }

                var record = records.First();
                var createdUserId = record["Id"].As<string>();
                Logger.LogInformation("Successfully created user with ID: {UserId}", createdUserId);
                return IdentityResult.Success;
            }, cancellationToken);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Failed to create user with ID: {UserId}", user.Id);
            return IdentityResult.Failed(new IdentityError { 
                Code = "CreateUserFailed",
                Description = "Failed to create user. Please try again." 
            });
        }
    }

    public async Task<IdentityResult> UpdateUserAsync(ApplicationUser user, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        await using var session = Driver.AsyncSession();

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
                    u.LastName = $LastName,
                    u.ProfilePictureUrl = $ProfilePictureUrl,
                    u.EmailConfirmed = $EmailConfirmed,
                    u.ConcurrencyStamp = $ConcurrencyStamp
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
                user.LastName,
                user.ProfilePictureUrl,
                user.EmailConfirmed,
                user.ConcurrencyStamp
            });

            if (!await result.FetchAsync())
                return IdentityResult.Failed(new IdentityError { Description = "User not found or update failed." });

            return IdentityResult.Success;
        }
        catch (Exception e)
        {
            return IdentityResult.Failed(new IdentityError { Description = e.Message });
        }
    }

    public async Task<IdentityResult> UpdateUserProfileAsync(string userId, ApplicationUser user, CancellationToken cancellationToken)
    {
        try
        {
            return await ExecuteWithRetryAsync(async session =>
            {
                var query = @"
                    MATCH (u:User {Id: $UserId})
                    SET u.FirstName = $FirstName,
                        u.MiddleNames = $MiddleNames,
                        u.LastName = $LastName,
                        u.Email = $Email,
                        u.NormalizedEmail = $NormalizedEmail,
                        u.ProfilePictureUrl = $ProfilePictureUrl,
                        u.LastModified = datetime()
                    RETURN u.Id";

                var result = await session.RunAsync(query, new
                {
                    UserId = userId,
                    user.FirstName,
                    user.MiddleNames,
                    user.LastName,
                    user.Email,
                    NormalizedEmail = user.Email?.ToUpperInvariant(),
                    user.ProfilePictureUrl
                });

                var records = await result.ToListAsync();
                var record = records.FirstOrDefault();
                if (record == null)
                {
                    Logger.LogWarning("User profile update failed - user not found: {UserId}", userId);
                    return IdentityResult.Failed(new IdentityError
                    {
                        Code = "UserNotFound",
                        Description = "User not found"
                    });
                }

                Logger.LogInformation("Successfully updated profile for user: {UserId}", userId);
                return IdentityResult.Success;
            }, cancellationToken);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error updating user profile: {UserId}", userId);
            return IdentityResult.Failed(new IdentityError
            {
                Code = "UpdateProfileFailed",
                Description = "Failed to update user profile"
            });
        }
    }

    public async Task<IdentityResult> DeleteUserAsync(ApplicationUser user, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        await using var session = Driver.AsyncSession();

        try
        {
            var query = @"
                MATCH (u:User {Id: $Id})
                DELETE u";
            await session.RunAsync(query, new { user.Id });
            return IdentityResult.Success;
        }
        catch (Exception e)
        {
            return IdentityResult.Failed(new IdentityError { Description = e.Message });
        }
    }

    public async Task<ApplicationUser?> FindUserByIdAsync(string userId, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        await using var session = Driver.AsyncSession();

        try
        {
            var query = @"
                MATCH (u:User)
                WHERE u.Id = $Id
                RETURN u";

            var result = await session.RunAsync(query, new { Id = userId });
            var records = await result.ToListAsync();
            var record = records.SingleOrDefault();
            if (record == null) return null;

            var node = record["u"].As<INode>();
            return MapUser(node);
        }
        catch
        {
            return null;
        }
    }

    public async Task<ApplicationUser?> FindUserByNameAsync(string normalizedUserName, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        await using var session = Driver.AsyncSession();

        try
        {
            var query = @"
                MATCH (u:User)
                WHERE u.NormalizedUserName = $NormalizedUserName
                RETURN u";
            var result = await session.RunAsync(query, new { NormalizedUserName = normalizedUserName });
            var records = await result.ToListAsync();
            var record = records.SingleOrDefault();
            if (record == null) return null;

            var node = record["u"].As<INode>();
            return MapUser(node);
        }
        catch
        {
            return null;
        }
    }

    public async Task<ApplicationUser> FindUserByEmailAsync(string normalizedEmail, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        await using var session = Driver.AsyncSession();

        try
        {
            var query = @"
                MATCH (u:User)
                WHERE u.NormalizedEmail = $NormalizedEmail
                RETURN u";
            var result = await session.RunAsync(query, new { NormalizedEmail = normalizedEmail });
            var records = await result.ToListAsync();
            var record = records.SingleOrDefault();
            if (record == null) return null;

            var node = record["u"].As<INode>();
            return MapUser(node);
        }
        catch
        {
            return null;
        }
    }

    public async Task<bool> IsEmailAvailableAsync(string email, string? excludeUserId = null, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        await using var session = Driver.AsyncSession();

        try
        {
            var normalizedEmail = email.ToUpper();
            var query = excludeUserId != null
                ? @"
                    MATCH (u:User)
                    WHERE u.NormalizedEmail = $NormalizedEmail AND u.Id <> $ExcludeUserId
                    RETURN COUNT(u) > 0 as exists"
                : @"
                    MATCH (u:User)
                    WHERE u.NormalizedEmail = $NormalizedEmail
                    RETURN COUNT(u) > 0 as exists";

            var result = await session.RunAsync(query, new { NormalizedEmail = normalizedEmail, ExcludeUserId = excludeUserId });
            var record = await result.SingleAsync();
            var exists = record["exists"].As<bool>();
            return !exists; // Available if it doesn't exist
        }
        catch
        {
            return false; // Assume not available if error occurs
        }
    }

    public async Task<bool> IsUsernameAvailableAsync(string username, string? excludeUserId = null, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        await using var session = Driver.AsyncSession();

        try
        {
            var normalizedUsername = username.ToUpper();
            var query = excludeUserId != null
                ? @"
                    MATCH (u:User)
                    WHERE u.NormalizedUserName = $NormalizedUserName AND u.Id <> $ExcludeUserId
                    RETURN COUNT(u) > 0 as exists"
                : @"
                    MATCH (u:User)
                    WHERE u.NormalizedUserName = $NormalizedUserName
                    RETURN COUNT(u) > 0 as exists";

            var result = await session.RunAsync(query, new { NormalizedUserName = normalizedUsername, ExcludeUserId = excludeUserId });
            var record = await result.SingleAsync();
            var exists = record["exists"].As<bool>();
            return !exists; // Available if it doesn't exist
        }
        catch
        {
            return false; // Assume not available if error occurs
        }
    }

    public async Task<List<ApplicationUser>> SearchUsersAsync(string query, int limit = 10)
    {
        await using var session = Driver.AsyncSession();
        var cypher = @"
            MATCH (u:User)
            WHERE toLower(u.UserName) CONTAINS toLower($query)
               OR toLower(u.Email) CONTAINS toLower($query)
               OR toLower(u.FirstName) CONTAINS toLower($query)
               OR toLower(u.LastName) CONTAINS toLower($query)
            RETURN u
            LIMIT $limit";
        var result = await session.RunAsync(cypher, new { query, limit });
        return await result.ToListAsync(record =>
        {
            var node = record["u"].As<INode>();
            return MapUser(node);
        });
    }

    // Enhanced helper method for mapping Neo4j nodes to ApplicationUser with better null handling
    private static ApplicationUser MapUser(INode node)
    {
        if (node?.Properties == null)
            throw new ArgumentNullException(nameof(node), "Node or its properties cannot be null");

        return new ApplicationUser
        {
            Id = GetPropertyOrDefault(node, "Id", node.ElementId),
            UserName = GetPropertyOrDefault<string?>(node, "UserName", null),
            NormalizedUserName = GetPropertyOrDefault<string?>(node, "NormalizedUserName", null),
            Email = GetPropertyOrDefault<string?>(node, "Email", null),
            NormalizedEmail = GetPropertyOrDefault<string?>(node, "NormalizedEmail", null),
            PasswordHash = GetPropertyOrDefault<string?>(node, "PasswordHash", null),
            SecurityStamp = GetPropertyOrDefault<string?>(node, "SecurityStamp", null),
            FirstName = GetPropertyOrDefault(node, "FirstName", string.Empty),
            MiddleNames = GetPropertyOrDefault(node, "MiddleNames", string.Empty),
            LastName = GetPropertyOrDefault(node, "LastName", string.Empty),
            EmailConfirmed = GetPropertyOrDefault(node, "EmailConfirmed", false),
            ConcurrencyStamp = GetPropertyOrDefault<string?>(node, "ConcurrencyStamp", null),
            ProfilePictureUrl = GetPropertyOrDefault(node, "ProfilePictureUrl", string.Empty)
        };
    }

    private static T GetPropertyOrDefault<T>(INode node, string propertyName, T defaultValue)
    {
        try
        {
            return node.Properties.ContainsKey(propertyName) ? node[propertyName].As<T>() : defaultValue;
        }
        catch
        {
            return defaultValue;
        }
    }
}
