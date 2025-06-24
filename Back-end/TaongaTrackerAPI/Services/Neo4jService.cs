using System.Text.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.Data;
using System.Linq;
using Neo4j.Driver;
using TaongaTrackerAPI.Models;

namespace TaongaTrackerAPI.Services;

public class Neo4jService : INeo4jService, IDisposable
{
    private readonly IDriver Driver;

    public Neo4jService(IConfiguration config)
    {
        var host = config["Neo4j:Host"] ?? "localhost";
        var boltPort = config["Neo4j:BoltPort"] ?? "7687";
        var username = config["Neo4j:Username"] ?? throw new ArgumentNullException("Neo4j:Username is missing in configuration.");
        var password = config["Neo4j:Password"] ?? throw new ArgumentNullException("Neo4j:Password is missing in configuration.");

        Driver = GraphDatabase.Driver(
            $"bolt://{host}:{boltPort}",
            AuthTokens.Basic(username, password));
    }

    public void Dispose()
    {
        Driver?.Dispose();
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

    public async Task<IdentityResult> CreateUserAsync(ApplicationUser user, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        await using var session = Driver.AsyncSession();

        try
        {
            var query = @"
                CREATE (u:User {Id: $Id, UserName: $UserName, NormalizedUserName: $NormalizedUserName,
                                Email: $Email, NormalizedEmail: $NormalizedEmail,
                                PasswordHash: $PasswordHash, SecurityStamp: $SecurityStamp,
                                FirstName: $FirstName, MiddleNames: $MiddleNames, LastName: $LastName,
                                EmailConfirmed: $EmailConfirmed, ConcurrencyStamp: $ConcurrencyStamp,
                                ProfilePictureUrl: $ProfilePictureUrl})
                RETURN u";

            await session.RunAsync(query, new
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

    // --- Family Member and Family Tree methods (updated) ---

    public async Task<FamilyTreeDto> GetOrCreateUserFamilyTreeAsync(string userId)
    {
        await using var session = Driver.AsyncSession();
        var query = @"
        MATCH (user:User {Id: $userId})
        MERGE (t:FamilyTree {OwnerUserId: $userId})
        MERGE (u:FamilyMember {FamilyMemberId: $userId})
        ON CREATE SET u.UserId = $userId
        SET u.FirstName = user.FirstName,
            u.MiddleNames = split(user.MiddleNames, ','),
            u.LastName = user.LastName,
            u.ProfilePictureUrl = user.ProfilePictureUrl
        MERGE (u)-[:BELONGS_TO]->(t)
        RETURN t";
        var result = await session.RunAsync(query, new { userId });
        var record = await result.SingleAsync();
        var node = record["t"].As<INode>();
        return new FamilyTreeDto
        {
            FamilyTreeId = node.ElementId,
            OwnerUserId = userId,
            FamilyMembers = new List<FamilyMemberDto>()
        };
    }

    public async Task EnsureUserFamilyMemberNodeAsync(string userId)
    {
        await using var session = Driver.AsyncSession();
        var query = @"
            MERGE (u:FamilyMember {FamilyMemberId: $userId})
            ON CREATE SET u.UserId = $userId";
        await session.RunAsync(query, new { userId });
    }

public async Task<FamilyMemberDto> AddFamilyMemberToUserTreeAsync(string userId, FamilyMemberDto member)
{
    await GetOrCreateUserFamilyTreeAsync(userId);

    await using var session = Driver.AsyncSession();
    var memberId = string.IsNullOrEmpty(member.FamilyMemberId) ? null : member.FamilyMemberId;
    var query = @"
    MATCH (t:FamilyTree {OwnerUserId: $userId})
    CREATE (m:FamilyMember)
    SET m = {
        FirstName: $firstName,
        MiddleNames: $middleNames,
        LastName: $lastName,
        DateOfBirth: $dateOfBirth,
        DateOfDeath: $dateOfDeath,
        Gender: $gender,
        Occupation: $occupation,
        PlaceOfBirth: $placeOfBirth,
        PlaceOfDeath: $placeOfDeath,
        Nationality: $nationality,
        Religion: $religion,
        MaritalStatus: $maritalStatus,
        RelationshipType: $relationshipType,
        ProfilePictureUrl: $profilePictureUrl,
        ParentsIds: $parentsIds,
        ChildrenIds: $childrenIds,
        SpouseIds: $spouseIds,
        SiblingIds: $siblingIds,
        UserId: $memberUserId
    }
    SET m.FamilyMemberId = coalesce($memberId, toString(id(m)))
    CREATE (m)-[:BELONGS_TO]->(t)
    RETURN m, toString(id(m)) AS memberId";
    var result = await session.RunAsync(query, new
    {
        userId,
        memberId,
        memberUserId = member.UserId,
        firstName = member.FirstName,
        middleNames = member.MiddleNames ?? new List<string>(),
        lastName = member.LastName,
        dateOfBirth = member.DateOfBirth,
        dateOfDeath = member.DateOfDeath,
        gender = member.Gender,
        occupation = member.Occupation,
        placeOfBirth = member.PlaceOfBirth,
        placeOfDeath = member.PlaceOfDeath,
        nationality = member.Nationality,
        religion = member.Religion,
        maritalStatus = member.MaritalStatus,
        relationshipType = member.RelationshipType,
        profilePictureUrl = member.ProfilePictureUrl,
        parentsIds = member.ParentsIds ?? new List<string>(),
        childrenIds = member.ChildrenIds ?? new List<string>(),
        spouseIds = member.SpouseIds ?? new List<string>(),
        siblingIds = member.SiblingIds ?? new List<string>()
    });

    if (!await result.FetchAsync())
        throw new Exception("Failed to create family member or family tree not found.");

    var record = result.Current;
    var node = record["m"].As<INode>();
    var newMemberId = record["memberId"].As<string>();

    // --- Bidirectional update logic for parents and children ---
    foreach (var parentId in member.ParentsIds ?? new List<string>())
    {
        await UpdateChildIdsOnParent(parentId, newMemberId, add: true);
    }
    foreach (var childId in member.ChildrenIds ?? new List<string>())
    {
        await UpdateParentIdsOnChild(childId, newMemberId, add: true);
    }
    foreach (var spouseId in member.SpouseIds ?? new List<string>())
    {
        await UpdateSpouseIdsOnMember(spouseId, newMemberId, add: true);
    }

    return new FamilyMemberDto
    {
        FamilyMemberId = newMemberId,
        UserId = node.Properties.ContainsKey("UserId") ? node["UserId"].As<string>() : null,
        FirstName = member.FirstName,
        MiddleNames = member.MiddleNames,
        LastName = member.LastName,
        DateOfBirth = member.DateOfBirth,
        DateOfDeath = member.DateOfDeath,
        Gender = member.Gender,
        Occupation = member.Occupation,
        PlaceOfBirth = member.PlaceOfBirth,
        PlaceOfDeath = member.PlaceOfDeath,
        Nationality = member.Nationality,
        Religion = member.Religion,
        MaritalStatus = member.MaritalStatus,
        RelationshipType = member.RelationshipType,
        ProfilePictureUrl = member.ProfilePictureUrl,
        ParentsIds = member.ParentsIds,
        ChildrenIds = member.ChildrenIds,
        SpouseIds = member.SpouseIds,
        SiblingIds = member.SiblingIds
    };
}

    public async Task<FamilyMemberDto> UpdateFamilyMemberAsync(string userId, string familyMemberId, FamilyMemberDto member)
{
    if (familyMemberId == userId)
    {
        await EnsureUserFamilyMemberNodeAsync(userId);
    }
    
    // Fetch the current state
    var currentMembers = await GetUserFamilyMembersAsync(userId);
    var current = currentMembers.FirstOrDefault(m => m.FamilyMemberId == familyMemberId);

    // Update the member node as before...

    // --- Bidirectional update logic ---

    // Handle ParentsIds
    var oldParents = current?.ParentsIds ?? new List<string>();
    var newParents = member.ParentsIds ?? new List<string>();

    var addedParents = newParents.Except(oldParents).ToList();
    var removedParents = oldParents.Except(newParents).ToList();

    foreach (var parentId in addedParents)
    {
        await UpdateChildIdsOnParent(parentId, familyMemberId, add: true);
    }
    foreach (var parentId in removedParents)
    {
        await UpdateChildIdsOnParent(parentId, familyMemberId, add: false);
    }

    // Handle ChildrenIds
    var oldChildren = current?.ChildrenIds ?? new List<string>();
    var newChildren = member.ChildrenIds ?? new List<string>();

    var addedChildren = newChildren.Except(oldChildren).ToList();
    var removedChildren = oldChildren.Except(newChildren).ToList();

    foreach (var childId in addedChildren)
    {
        await UpdateParentIdsOnChild(childId, familyMemberId, add: true);
    }
    foreach (var childId in removedChildren)
    {
        await UpdateParentIdsOnChild(childId, familyMemberId, add: false);
    }
    
    // Handle SpouseIds
    var oldSpouses = current?.SpouseIds ?? new List<string>();
    var newSpouses = member.SpouseIds ?? new List<string>();

    var addedSpouses = newSpouses.Except(oldSpouses).ToList();
    var removedSpouses = oldSpouses.Except(newSpouses).ToList();

    foreach (var spouseId in addedSpouses)
    {
        await UpdateSpouseIdsOnMember(spouseId, familyMemberId, add: true);
    }
    foreach (var spouseId in removedSpouses)
    {
        await UpdateSpouseIdsOnMember(spouseId, familyMemberId, add: false);
    }

    await using var session = Driver.AsyncSession();
    var query = @"
        MATCH (m:FamilyMember {FamilyMemberId: $familyMemberId})
        SET m.FirstName = $firstName,
            m.MiddleNames = $middleNames,
            m.LastName = $lastName,
            m.DateOfBirth = $dateOfBirth,
            m.DateOfDeath = $dateOfDeath,
            m.Gender = $gender,
            m.Occupation = $occupation,
            m.PlaceOfBirth = $placeOfBirth,
            m.PlaceOfDeath = $placeOfDeath,
            m.Nationality = $nationality,
            m.Religion = $religion,
            m.MaritalStatus = $maritalStatus,
            m.RelationshipType = $relationshipType,
            m.ProfilePictureUrl = $profilePictureUrl,
            m.ParentsIds = $parentsIds,
            m.ChildrenIds = $childrenIds,
            m.SpouseIds = $spouseIds,
            m.SiblingIds = $siblingIds
        RETURN m";
    var result = await session.RunAsync(query, new
    {
        familyMemberId,
        firstName = member.FirstName,
        middleNames = member.MiddleNames ?? new List<string>(),
        lastName = member.LastName,
        dateOfBirth = member.DateOfBirth,
        dateOfDeath = member.DateOfDeath,
        gender = member.Gender,
        occupation = member.Occupation,
        placeOfBirth = member.PlaceOfBirth,
        placeOfDeath = member.PlaceOfDeath,
        nationality = member.Nationality,
        religion = member.Religion,
        maritalStatus = member.MaritalStatus,
        relationshipType = member.RelationshipType,
        profilePictureUrl = member.ProfilePictureUrl,
        parentsIds = member.ParentsIds ?? new List<string>(),
        childrenIds = member.ChildrenIds ?? new List<string>(),
        spouseIds = member.SpouseIds ?? new List<string>(),
        siblingIds = member.SiblingIds ?? new List<string>()
    });

    if (!await result.FetchAsync())
        throw new KeyNotFoundException($"Family member with ID '{familyMemberId}' not found.");

    var record = result.Current;
    var node = record["m"].As<INode>();
    return new FamilyMemberDto
    {
        FamilyMemberId = node.Properties.ContainsKey("FamilyMemberId") ? node["FamilyMemberId"].As<string>() : node.ElementId,
        UserId = node.Properties.ContainsKey("UserId") ? node["UserId"].As<string>() : null,
        FirstName = node.Properties.ContainsKey("FirstName") ? node["FirstName"].As<string>() : null,
        MiddleNames = node.Properties.ContainsKey("MiddleNames") ? node["MiddleNames"].As<List<string>>() : new List<string>(),
        LastName = node.Properties.ContainsKey("LastName") ? node["LastName"].As<string>() : null,
        DateOfBirth = node.Properties.ContainsKey("DateOfBirth") ? node["DateOfBirth"].As<DateTime?>() : null,
        DateOfDeath = node.Properties.ContainsKey("DateOfDeath") ? node["DateOfDeath"].As<DateTime?>() : null,
        Gender = node.Properties.ContainsKey("Gender") ? node["Gender"].As<string>() : null,
        Occupation = node.Properties.ContainsKey("Occupation") ? node["Occupation"].As<string>() : null,
        PlaceOfBirth = node.Properties.ContainsKey("PlaceOfBirth") ? node["PlaceOfBirth"].As<string>() : null,
        PlaceOfDeath = node.Properties.ContainsKey("PlaceOfDeath") ? node["PlaceOfDeath"].As<string>() : null,
        Nationality = node.Properties.ContainsKey("Nationality") ? node["Nationality"].As<string>() : null,
        Religion = node.Properties.ContainsKey("Religion") ? node["Religion"].As<string>() : null,
        MaritalStatus = node.Properties.ContainsKey("MaritalStatus") ? node["MaritalStatus"].As<string>() : null,
        RelationshipType = node.Properties.ContainsKey("RelationshipType") ? node["RelationshipType"].As<string>() : null,
        ProfilePictureUrl = node.Properties.ContainsKey("ProfilePictureUrl") ? node["ProfilePictureUrl"].As<string>() : null,
        ParentsIds = node.Properties.ContainsKey("ParentsIds") ? node["ParentsIds"].As<List<string>>() : new List<string>(),
        ChildrenIds = node.Properties.ContainsKey("ChildrenIds") ? node["ChildrenIds"].As<List<string>>() : new List<string>(),
        SpouseIds = node.Properties.ContainsKey("SpouseIds") ? node["SpouseIds"].As<List<string>>() : new List<string>(),
        SiblingIds = node.Properties.ContainsKey("SiblingIds") ? node["SiblingIds"].As<List<string>>() : new List<string>()
    };
}

    public async Task DeleteFamilyMemberAsync(string userId, string familyMemberId)
    {
        // Fetch the member to get current parents and children
        var members = await GetUserFamilyMembersAsync(userId);
        var member = members.FirstOrDefault(m => m.FamilyMemberId == familyMemberId);
        if (member == null) return;

        // Remove this member from parents' ChildrenIds
        foreach (var parentId in member.ParentsIds ?? new List<string>())
        {
            await UpdateChildIdsOnParent(parentId, familyMemberId, add: false);
        }
        // Remove this member from children's ParentsIds
        foreach (var childId in member.ChildrenIds ?? new List<string>())
        {
            await UpdateParentIdsOnChild(childId, familyMemberId, add: false);
        }
        
        // Remove this member from spouses' SpousesIds
        foreach (var spouseId in member.SpouseIds ?? new List<string>())
        {
            await UpdateSpouseIdsOnMember(spouseId, familyMemberId, add: false);
        }

        // Now delete the member node
        await using var session = Driver.AsyncSession();
        var query = @"
        MATCH (m:FamilyMember {FamilyMemberId: $familyMemberId})
        DETACH DELETE m";
        await session.RunAsync(query, new { familyMemberId });
    }

    public async Task<List<FamilyMemberDto>> GetUserFamilyMembersAsync(string userId)
{
    await using var session = Driver.AsyncSession();
    var query = @"
        MATCH (t:FamilyTree {OwnerUserId: $userId})
        MATCH (m:FamilyMember)-[:BELONGS_TO]->(t)
        RETURN m";
    var result = await session.RunAsync(query, new { userId });
    var members = await result.ToListAsync(record =>
    {
        var node = record["m"].As<INode>();
        return new FamilyMemberDto
        {
            FamilyMemberId = node.Properties.ContainsKey("FamilyMemberId") ? node["FamilyMemberId"].As<string>() : node.ElementId,
            UserId = node.Properties.ContainsKey("UserId") ? node["UserId"].As<string>() : null,
            FirstName = node.Properties.ContainsKey("FirstName") ? node["FirstName"].As<string>() : null,
            MiddleNames = node.Properties.ContainsKey("MiddleNames") ? node["MiddleNames"].As<List<string>>() : new List<string>(),
            LastName = node.Properties.ContainsKey("LastName") ? node["LastName"].As<string>() : null,
            DateOfBirth = node.Properties.ContainsKey("DateOfBirth") ? node["DateOfBirth"].As<DateTime?>() : null,
            DateOfDeath = node.Properties.ContainsKey("DateOfDeath") ? node["DateOfDeath"].As<DateTime?>() : null,
            Gender = node.Properties.ContainsKey("Gender") ? node["Gender"].As<string>() : null,
            Occupation = node.Properties.ContainsKey("Occupation") ? node["Occupation"].As<string>() : null,
            PlaceOfBirth = node.Properties.ContainsKey("PlaceOfBirth") ? node["PlaceOfBirth"].As<string>() : null,
            PlaceOfDeath = node.Properties.ContainsKey("PlaceOfDeath") ? node["PlaceOfDeath"].As<string>() : null,
            ParentsIds = node.Properties.ContainsKey("ParentsIds") ? node["ParentsIds"].As<List<string>>() : new List<string>(),
            ChildrenIds = node.Properties.ContainsKey("ChildrenIds") ? node["ChildrenIds"].As<List<string>>() : new List<string>(),
            SpouseIds = node.Properties.ContainsKey("SpouseIds") ? node["SpouseIds"].As<List<string>>() : new List<string>(),
            SiblingIds = new List<string>(), // Will be set below
            Nationality = node.Properties.ContainsKey("Nationality") ? node["Nationality"].As<string>() : null,
            Religion = node.Properties.ContainsKey("Religion") ? node["Religion"].As<string>() : null,
            MaritalStatus = node.Properties.ContainsKey("MaritalStatus") ? node["MaritalStatus"].As<string>() : null,
            RelationshipType = node.Properties.ContainsKey("RelationshipType") ? node["RelationshipType"].As<string>() : null,
            ProfilePictureUrl = node.Properties.ContainsKey("ProfilePictureUrl") ? node["ProfilePictureUrl"].As<string>() : null
        };
    });

    // Populate SiblingIds dynamically
    foreach (var member in members)
    {
        member.SiblingIds = GetSiblingIds(member, members);
    }

    return members;
}

    public async Task<FamilyTreeDto> GetUserFamilyTreeAsync(string userId)
    {
        await using var session = Driver.AsyncSession();
        var query = @"
            MATCH (t:FamilyTree {OwnerUserId: $userId})
            OPTIONAL MATCH (m:FamilyMember)-[:BELONGS_TO]->(t)
            RETURN t, COLLECT(m) AS members";
        var result = await session.RunAsync(query, new { userId });
        var record = await result.SingleAsync();
        var treeNode = record["t"].As<INode>();
        var members = record["members"].As<List<INode>>().Select(node => new FamilyMemberDto
        {
            FamilyMemberId = node.Properties.ContainsKey("FamilyMemberId") ? node["FamilyMemberId"].As<string>() : node.ElementId,
            UserId = node.Properties.ContainsKey("UserId") ? node["UserId"].As<string>() : null,
            FirstName = node.Properties.ContainsKey("FirstName") ? node["FirstName"].As<string>() : null,
            MiddleNames = node.Properties.ContainsKey("MiddleNames") ? node["MiddleNames"].As<List<string>>() : new List<string>(),
            LastName = node.Properties.ContainsKey("LastName") ? node["LastName"].As<string>() : null,
            DateOfBirth = node.Properties.ContainsKey("DateOfBirth") ? node["DateOfBirth"].As<DateTime?>() : null,
            DateOfDeath = node.Properties.ContainsKey("DateOfDeath") ? node["DateOfDeath"].As<DateTime?>() : null,
            Gender = node.Properties.ContainsKey("Gender") ? node["Gender"].As<string>() : null,
            Occupation = node.Properties.ContainsKey("Occupation") ? node["Occupation"].As<string>() : null,
            PlaceOfBirth = node.Properties.ContainsKey("PlaceOfBirth") ? node["PlaceOfBirth"].As<string>() : null,
            PlaceOfDeath = node.Properties.ContainsKey("PlaceOfDeath") ? node["PlaceOfDeath"].As<string>() : null,
            ParentsIds = node.Properties.ContainsKey("ParentsIds") ? node["ParentsIds"].As<List<string>>() : new List<string>(),
            ChildrenIds = node.Properties.ContainsKey("ChildrenIds") ? node["ChildrenIds"].As<List<string>>() : new List<string>(),
            SpouseIds = node.Properties.ContainsKey("SpouseIds") ? node["SpouseIds"].As<List<string>>() : new List<string>(),
            SiblingIds = node.Properties.ContainsKey("SiblingIds") ? node["SiblingIds"].As<List<string>>() : new List<string>(),
            Nationality = node.Properties.ContainsKey("Nationality") ? node["Nationality"].As<string>() : null,
            Religion = node.Properties.ContainsKey("Religion") ? node["Religion"].As<string>() : null,
            MaritalStatus = node.Properties.ContainsKey("MaritalStatus") ? node["MaritalStatus"].As<string>() : null,
            RelationshipType = node.Properties.ContainsKey("RelationshipType") ? node["RelationshipType"].As<string>() : null,
            ProfilePictureUrl = node.Properties.ContainsKey("ProfilePictureUrl") ? node["ProfilePictureUrl"].As<string>() : null
        }).ToList();

        return new FamilyTreeDto
        {
            FamilyTreeId = treeNode.ElementId,
            OwnerUserId = userId,
            FamilyMembers = members
        };
    }

    // --- Vault and VaultItem methods (unchanged, as in your context) ---

    public async Task CreateVaultAsync(VaultDto vault, string ownerId)
    {
        await using var session = Driver.AsyncSession();

        var query = @"
            CREATE (v:Vault {
                VaultId: randomUUID(),
                OwnerId: $ownerId,
                SharedWithIds: $sharedWithIds
            })
            RETURN v.VaultId AS VaultId";

        var result = await session.RunAsync(query, new
        {
            ownerId,
            sharedWithIds = vault.SharedWithIds ?? new List<string>()
        });

        var record = await result.SingleAsync();
        vault.VaultId = record["VaultId"].As<string>();
        vault.OwnerId = ownerId;
    }

    public async Task<List<VaultDto>> GetUserVaultsAsync(string userId)
    {
        await using var session = Driver.AsyncSession();

        var query = @"
            MATCH (v:Vault)
            WHERE v.OwnerId = $userId OR $userId IN COALESCE(v.SharedWithIds, [])
            RETURN v";

        var result = await session.RunAsync(query, new { userId });
        var vaults = await result.ToListAsync(record =>
        {
            var node = record["v"].As<INode>();
            return new VaultDto
            {
                VaultId = node.Properties.ContainsKey("VaultId") ? node["VaultId"].As<string>() : node.ElementId,
                OwnerId = node.Properties.ContainsKey("OwnerId") ? node["OwnerId"].As<string>() : null,
                SharedWithIds = node.Properties.ContainsKey("SharedWithIds") ? node["SharedWithIds"].As<List<string>>() : new List<string>()
            };
        });

        return vaults;
    }

    public async Task<VaultDto> GetOrCreateUserVaultAsync(string userId)
    {
        var vaults = await GetUserVaultsAsync(userId);
        var userVault = vaults.FirstOrDefault(v => v.OwnerId == userId);

        if (userVault != null)
            return userVault;

        var defaultVault = new VaultDto
        {
            OwnerId = userId,
            SharedWithIds = new List<string>()
        };
        await CreateVaultAsync(defaultVault, userId);
        return defaultVault;
    }

    public async Task CreateVaultItemAsync(VaultItemDto item, string vaultId, string ownerId)
    {
        await using var session = Driver.AsyncSession();

        var query = @"
            MATCH (v:Vault) WHERE v.VaultId = $vaultId AND v.OwnerId = $ownerId
            CREATE (i:VaultItem {
                VaultItemId: randomUUID(),
                Title: $title,
                Description: $description,
                CreationDate: $creationDate,
                CreationPlace: $creationPlace,
                CreatorId: $creatorId,
                Materials: $materials,
                CraftType: $craftType,
                ItemType: $itemType,
                EstimatedValue: $estimatedValue,
                DateAcquired: $dateAcquired,
                PhotoUrl: $photoUrl,
                PreviousOwnerIds: $previousOwnerIds,
                SharedWithIds: $sharedWithIds,
                CurrentOwnerId: $ownerId,
                CurrentOwnerUserId: $ownerId
            })
            CREATE (v)-[:HAS_ITEM]->(i)
            RETURN i.VaultItemId AS VaultItemId";

        var result = await session.RunAsync(query, new
        {
            vaultId,
            ownerId,
            sharedWithIds = item.SharedWithIds ?? new List<string>(),
            title = item.Title,
            description = item.Description,
            creationDate = item.CreationDate,
            creationPlace = item.CreationPlace,
            creatorId = item.CreatorId,
            materials = item.Materials ?? new List<string>(),
            craftType = item.CraftType ?? new List<string>(),
            itemType = item.ItemType,
            estimatedValue = item.EstimatedValue,
            dateAcquired = item.DateAcquired,
            photoUrl = item.PhotoUrl,
            previousOwnerIds = item.PreviousOwnerIds ?? new List<string>()
        });

        var record = await result.SingleAsync();
        item.VaultItemId = record["VaultItemId"].As<string>();
        item.CurrentOwnerId = ownerId;
        item.CurrentOwnerUserId = ownerId;
    }

    public async Task UpdateVaultItemAsync(VaultItemDto item, string userId)
    {
        await using var session = Driver.AsyncSession();
        var query = @"
            MATCH (i:VaultItem {VaultItemId: $vaultItemId, CurrentOwnerId: $userId})
            SET i.Title = $title,
                i.Description = $description,
                i.CreationDate = $creationDate,
                i.CreationPlace = $creationPlace,
                i.CreatorId = $creatorId,
                i.Materials = $materials,
                i.CraftType = $craftType,
                i.ItemType = $itemType,
                i.EstimatedValue = $estimatedValue,
                i.DateAcquired = $dateAcquired,
                i.PhotoUrl = $photoUrl,
                i.PreviousOwnerIds = $previousOwnerIds
            RETURN i";
        var result = await session.RunAsync(query, new
        {
            vaultItemId = item.VaultItemId,
            userId,
            title = item.Title,
            description = item.Description,
            creationDate = item.CreationDate,
            creationPlace = item.CreationPlace,
            creatorId = item.CreatorId,
            materials = item.Materials ?? new List<string>(),
            craftType = item.CraftType ?? new List<string>(),
            itemType = item.ItemType,
            estimatedValue = item.EstimatedValue,
            dateAcquired = item.DateAcquired,
            photoUrl = item.PhotoUrl,
            previousOwnerIds = item.PreviousOwnerIds ?? new List<string>()
        });
        if (!await result.FetchAsync())
            throw new Exception("Vault item not found or update failed.");
    }

    public async Task DeleteVaultItemAsync(string vaultItemId, string userId)
    {
        await using var session = Driver.AsyncSession();
        var query = @"
            MATCH (i:VaultItem {VaultItemId: $vaultItemId, CurrentOwnerId: $userId})
            DETACH DELETE i";
        await session.RunAsync(query, new { vaultItemId, userId });
    }

    public async Task<List<VaultItemDto>> GetUserVaultItemsAsync(string userId)
    {
        await using var session = Driver.AsyncSession();

        var query = @"
            MATCH (v:Vault)-[:HAS_ITEM]->(i:VaultItem)
            WHERE v.OwnerId = $userId OR $userId IN COALESCE(v.SharedWithIds, [])
            RETURN i";

        var result = await session.RunAsync(query, new { userId });
        var items = await result.ToListAsync(record =>
        {
            var node = record["i"].As<INode>();
            return new VaultItemDto
            {
                VaultItemId = node.Properties.ContainsKey("VaultItemId") ? node["VaultItemId"].As<string>() : node.ElementId,
                Title = node.Properties.ContainsKey("Title") ? node["Title"].As<string>() : null,
                Description = node.Properties.ContainsKey("Description") ? node["Description"].As<string>() : null,
                CreationDate = node.Properties.ContainsKey("CreationDate") ? node["CreationDate"].As<DateTime?>() : null,
                CreationPlace = node.Properties.ContainsKey("CreationPlace") ? node["CreationPlace"].As<string>() : null,
                CreatorId = node.Properties.ContainsKey("CreatorId") ? node["CreatorId"].As<string>() : null,
                Materials = node.Properties.ContainsKey("Materials") ? node["Materials"].As<List<string>>() : new List<string>(),
                CraftType = node.Properties.ContainsKey("CraftType") ? node["CraftType"].As<List<string>>() : new List<string>(),
                ItemType = node.Properties.ContainsKey("ItemType") ? node["ItemType"].As<string>() : null,
                EstimatedValue = node.Properties.ContainsKey("EstimatedValue") ? node["EstimatedValue"].As<decimal?>() ?? 0 : 0,
                DateAcquired = node.Properties.ContainsKey("DateAcquired") ? node["DateAcquired"].As<DateTime?>() : null,
                PhotoUrl = node.Properties.ContainsKey("PhotoUrl") ? node["PhotoUrl"].As<string>() : null,
                PreviousOwnerIds = node.Properties.ContainsKey("PreviousOwnerIds") ? node["PreviousOwnerIds"].As<List<string>>() : new List<string>(),
                SharedWithIds = node.Properties.ContainsKey("SharedWithIds") ? node["SharedWithIds"].As<List<string>>() : new List<string>(),
                CurrentOwnerId = node.Properties.ContainsKey("CurrentOwnerId") ? node["CurrentOwnerId"].As<string>() : null,
                CurrentOwnerUserId = node.Properties.ContainsKey("CurrentOwnerUserId") ? node["CurrentOwnerUserId"].As<string>() : null
            };
        });

        return items;
    }

    // --- Search users ---

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

    // --- Helper methods ---

    private static ApplicationUser MapUser(INode node)
    {
        return new ApplicationUser
        {
            Id = node.Properties.ContainsKey("Id") ? node["Id"].As<string>() : node.ElementId,
            UserName = node.Properties.ContainsKey("UserName") ? node["UserName"].As<string>() : null,
            NormalizedUserName = node.Properties.ContainsKey("NormalizedUserName") ? node["NormalizedUserName"].As<string>() : null,
            Email = node.Properties.ContainsKey("Email") ? node["Email"].As<string>() : null,
            NormalizedEmail = node.Properties.ContainsKey("NormalizedEmail") ? node["NormalizedEmail"].As<string>() : null,
            PasswordHash = node.Properties.ContainsKey("PasswordHash") ? node["PasswordHash"].As<string>() : null,
            SecurityStamp = node.Properties.ContainsKey("SecurityStamp") ? node["SecurityStamp"].As<string>() : null,
            FirstName = node.Properties.ContainsKey("FirstName") ? node["FirstName"].As<string>() : string.Empty,
            MiddleNames = node.Properties.ContainsKey("MiddleNames") ? node["MiddleNames"].As<string>() : string.Empty,
            LastName = node.Properties.ContainsKey("LastName") ? node["LastName"].As<string>() : string.Empty,
            EmailConfirmed = node.Properties.ContainsKey("EmailConfirmed") && node["EmailConfirmed"].As<bool>(),
            ConcurrencyStamp = node.Properties.ContainsKey("ConcurrencyStamp") ? node["ConcurrencyStamp"].As<string>() : null,
            ProfilePictureUrl = node.Properties.ContainsKey("ProfilePictureUrl") ? node["ProfilePictureUrl"].As<string>() : string.Empty
        };
    }
    
    private async Task UpdateChildIdsOnParent(string parentId, string childId, bool add)
    {
        var query = add
            ? @"MATCH (p:FamilyMember {FamilyMemberId: $parentId})
            SET p.ChildrenIds = coalesce(p.ChildrenIds, []) + $childId"
            : @"MATCH (p:FamilyMember {FamilyMemberId: $parentId})
            SET p.ChildrenIds = [x IN coalesce(p.ChildrenIds, []) WHERE x <> $childId]";
        await using var session = Driver.AsyncSession();
        await session.RunAsync(query, new { parentId, childId });
    }

    private async Task UpdateParentIdsOnChild(string childId, string parentId, bool add)
    {
        var query = add
            ? @"MATCH (c:FamilyMember {FamilyMemberId: $childId})
            SET c.ParentsIds = coalesce(c.ParentsIds, []) + $parentId"
            : @"MATCH (c:FamilyMember {FamilyMemberId: $childId})
            SET c.ParentsIds = [x IN coalesce(c.ParentsIds, []) WHERE x <> $parentId]";
        await using var session = Driver.AsyncSession();
        await session.RunAsync(query, new { childId, parentId });
    }

    private async Task UpdateSpouseIdsOnMember(string memberId, string spouseId, bool add)
    {
        var query = add
            ? @"MATCH (m:FamilyMember {FamilyMemberId: $memberId})
            SET m.SpouseIds = coalesce(m.SpouseIds, []) + $spouseId"
            : @"MATCH (m:FamilyMember {FamilyMemberId: $memberId})
            SET m.SpouseIds = [x IN coalesce(m.SpouseIds, []) WHERE x <> $spouseId]";
        await using var session = Driver.AsyncSession();
        await session.RunAsync(query, new { memberId, spouseId });
    }
    
    private static List<string> GetSiblingIds(FamilyMemberDto member, List<FamilyMemberDto> allMembers)
    {
        var siblingIds = new HashSet<string>();
        foreach (var parentId in member.ParentsIds ?? new List<string>())
        {
            var siblings = allMembers
                .Where(m => m.ParentsIds != null && m.ParentsIds.Contains(parentId) && m.FamilyMemberId != member.FamilyMemberId)
                .Select(m => m.FamilyMemberId);
            foreach (var sibId in siblings)
                siblingIds.Add(sibId);
        }
        return siblingIds.ToList();
    }
    
    private static void ValidateFamilyMemberData(FamilyMemberDto familyMember)
    {
        Console.WriteLine(familyMember);
        if (string.IsNullOrEmpty(familyMember.FirstName))
            throw new ArgumentException("First name is required.");
        if (string.IsNullOrEmpty(familyMember.LastName))
            throw new ArgumentException("Last name is required.");
    }
}