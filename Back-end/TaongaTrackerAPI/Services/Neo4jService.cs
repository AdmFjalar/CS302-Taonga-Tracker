using System.Text.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.Data;
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

        var username = config["Neo4j:Username"] ??
                       throw new ArgumentNullException("Neo4j:Username is missing in configuration.");
        var password = config["Neo4j:Password"] ??
                       throw new ArgumentNullException("Neo4j:Password is missing in configuration.");

        Driver = GraphDatabase.Driver(
            $"bolt://{host}:{boltPort}",
            AuthTokens.Basic(username, password));
    }

    public void Dispose()
    {
        Driver?.Dispose();
    }

    public async Task CreateFamilyMemberFromJsonAsync(string jsonRequest)
    {
        if (string.IsNullOrEmpty(jsonRequest))
            throw new ArgumentException("JSON request cannot be empty");

        Console.WriteLine($"Received JSON Request: {jsonRequest}");

        try
        {
            var familyMember = JsonSerializer.Deserialize<FamilyMemberDto>(jsonRequest);
            if (familyMember == null)
                throw new ArgumentException("Failed to deserialize family member data");

            Console.WriteLine("Deserialized FamilyMemberDto successfully.");
            await CreateFamilyMemberAsync(familyMember);
        }
        catch (JsonException e)
        {
            Console.WriteLine($"Invalid JSON Format Exception: {e.Message}");
            throw new ArgumentException("Invalid JSON format", e);
        }
    }

    public async Task CreateFamilyMemberAsync(FamilyMemberDto familyMember)
    {
        ValidateFamilyMemberData(familyMember);
        
        await using var session = Driver.AsyncSession();
        try
        {
            await session.RunAsync(
                "CREATE (p:FamilyMember {userId: $userId, firstName: $firstName, middleNames: $middleNames, " +
                "lastName: $lastName, dateOfBirth: $dateOfBirth, dateOfDeath: $dateOfDeath, gender: $gender, " +
                "parentsIds: $parentsIds, childrenIds: $childrenIds, occupation: $occupation, placeOfBirth: $placeOfBirth, " +
                "placeOfDeath: $placeOfDeath, nationality: $nationality, religion: $religion, maritalStatus: $maritalStatus, " +
                "spouseId: $spouseId, relationshipType: $relationshipType})",
                new
                {
                    userId = familyMember.UserId,
                    firstName = familyMember.FirstName,
                    middleNames = familyMember.MiddleNames,
                    lastName = familyMember.LastName,
                    dateOfBirth = familyMember.DateOfBirth,
                    dateOfDeath = familyMember.DateOfDeath,
                    gender = familyMember.Gender,
                    parentsIds = familyMember.ParentsIds ?? new List<string>(),
                    childrenIds = familyMember.ChildrenIds ?? new List<string>(),
                    occupation = familyMember.Occupation,
                    placeOfBirth = familyMember.PlaceOfBirth,
                    placeOfDeath = familyMember.PlaceOfDeath,
                    nationality = familyMember.Nationality,
                    religion = familyMember.Religion,
                    maritalStatus = familyMember.MaritalStatus,
                    spouseId = familyMember.SpouseId,
                    relationshipType = familyMember.RelationshipType
                });
        }
        catch (Neo4jException e)
        {
            throw new ApplicationException("Error creating FamilyMember node in Neo4j.", e);
        }
    }

    public async Task<List<FamilyMemberDto>> GetAllFamilyMembersAsync(int skip = 0, int limit = 100)
    {
        await using var session = Driver.AsyncSession();

        try
        {
            var query = "MATCH (p:FamilyMember) RETURN p SKIP $skip LIMIT $limit";
            var result = await session.RunAsync(query, new { skip, limit });

            return await result.ToListAsync(record =>
            {
                var node = record["p"].As<INode>();
                return new FamilyMemberDto
                {
                    FamilyMemberId = node.ElementId,
                    UserId = node.Properties.ContainsKey("userId") ? node["userId"]?.As<string>() : null,
                    FirstName = node.Properties.ContainsKey("firstName") ? node["firstName"]?.As<string>() : null,
                    MiddleNames = node.Properties.ContainsKey("middleNames")
                        ? node["middleNames"]?.As<List<string>>() ?? new List<string>()
                        : null,
                    LastName = node.Properties.ContainsKey("lastName") ? node["lastName"]?.As<string>() : null,
                    DateOfBirth = node.Properties.ContainsKey("dateOfBirth")
                        ? node["dateOfBirth"]?.As<DateTime?>()
                        : null,
                    DateOfDeath = node.Properties.ContainsKey("dateOfDeath")
                        ? node["dateOfDeath"]?.As<DateTime?>()
                        : null,
                    Gender = node.Properties.ContainsKey("gender") ? node["gender"]?.As<string>() : null,
                    ParentsIds = node.Properties.ContainsKey("parentsIds")
                        ? node["parentsIds"]?.As<List<string>>() ?? new List<string>()
                        : null,
                    ChildrenIds = node.Properties.ContainsKey("childrenIds")
                        ? node["childrenIds"]?.As<List<string>>() ?? new List<string>()
                        : null,
                    Occupation = node.Properties.ContainsKey("occupation") ? node["occupation"]?.As<string>() : null,
                    PlaceOfBirth = node.Properties.ContainsKey("placeOfBirth")
                        ? node["placeOfBirth"]?.As<string>()
                        : null,
                    PlaceOfDeath = node.Properties.ContainsKey("placeOfDeath")
                        ? node["placeOfDeath"]?.As<string>()
                        : null,
                    Nationality = node.Properties.ContainsKey("nationality") ? node["nationality"]?.As<string>() : null,
                    Religion = node.Properties.ContainsKey("religion") ? node["religion"]?.As<string>() : null,
                    MaritalStatus = node.Properties.ContainsKey("maritalStatus")
                        ? node["maritalStatus"]?.As<string>()
                        : null,
                    SpouseId = node.Properties.ContainsKey("spouseId") ? node["spouseId"]?.As<int?>() : null,
                    RelationshipType = node.Properties.ContainsKey("relationshipType")
                        ? node["relationshipType"]?.As<string>()
                        : null
                };
            });
        }
        catch (Neo4jException e)
        {
            throw new ApplicationException("Error retrieving FamilyMember nodes from Neo4j.", e);
        }
    }

    public async Task CreateFamilyTreeFromJsonAsync(string userId, string jsonRequest)
    {
        if (string.IsNullOrEmpty(jsonRequest))
            throw new ArgumentException("JSON request cannot be null or empty.");

        var familyTreeDto = JsonSerializer.Deserialize<FamilyTreeDto>(jsonRequest);

        if (familyTreeDto == null)
            throw new ArgumentException("Failed to deserialize JSON into FamilyTreeDto.");
        
        familyTreeDto.OwnerUserId = userId;
        
        await using var session = Driver.AsyncSession();

        var createTreeQuery = @"
        CREATE (t:FamilyTree { FamilyTreeId: $FamilyTreeId, OwnerUserId: $OwnerUserId })
        RETURN t";

        await session.RunAsync(createTreeQuery, new
        {
            familyTreeDto.FamilyTreeId, familyTreeDto.OwnerUserId
        });

        // If family members are provided, create nodes for them
        if (familyTreeDto.FamilyMembers != null)
            foreach (var familyMember in familyTreeDto.FamilyMembers)
            {
                var createMemberQuery = @"
                MERGE (m:FamilyMember { FamilyMemberId: $FamilyMemberId })
                SET m += {
                    UserId: $UserId,
                    FirstName: $FirstName,
                    MiddleNames: $MiddleNames,
                    LastName: $LastName,
                    DateOfBirth: $DateOfBirth,
                    DateOfDeath: $DateOfDeath,
                    Gender: $Gender,
                    Occupation: $Occupation,
                    PlaceOfBirth: $PlaceOfBirth,
                    PlaceOfDeath: $PlaceOfDeath,
                    Nationality: $Nationality,
                    Religion: $Religion,
                    MaritalStatus: $MaritalStatus,
                    RelationshipType: $RelationshipType
                }
                RETURN m";

                await session.RunAsync(createMemberQuery, new
                {
                    familyMember.FamilyMemberId,
                    familyMember.UserId,
                    familyMember.FirstName,
                    familyMember.MiddleNames,
                    familyMember.LastName,
                    familyMember.DateOfBirth,
                    familyMember.DateOfDeath,
                    familyMember.Gender,
                    familyMember.Occupation,
                    familyMember.PlaceOfBirth,
                    familyMember.PlaceOfDeath,
                    familyMember.Nationality,
                    familyMember.Religion,
                    familyMember.MaritalStatus,
                    familyMember.RelationshipType
                });

                // Create the relationship between the member and the family tree
                var createRelationQuery = @"
                MATCH (t:FamilyTree { FamilyTreeId: $FamilyTreeId })
                MATCH (m:FamilyMember { FamilyMemberId: $FamilyMemberId })
                MERGE (m)-[:BELONGS_TO]->(t)";

                await session.RunAsync(createRelationQuery, new
                {
                    familyTreeDto.FamilyTreeId, familyMember.FamilyMemberId
                });
            }
    }

    public async Task CreateFamilyTreeAsync(FamilyTreeDto familyTree)
    {
        await using var session = Driver.AsyncSession();
        try
        {
            await session.RunAsync(
                @"
                    CREATE (f:FamilyTree {ownerUserId: $ownerUserId, sharedWithIds: $sharedWithIds})
                    WITH f
                    UNWIND $familyMembers AS memberId
                    MATCH (m:FamilyMember {FamilyMemberId: memberId})
                    CREATE (f)-[:HAS_MEMBER]->(m)",
                new
                {
                    ownerUserId = familyTree.OwnerUserId,
                    sharedWithIds = familyTree.SharedWithIds ?? new List<string>(),
                    familyMembers = familyTree.FamilyMembers?.Select(m => m.FamilyMemberId).ToList() ??
                                    new List<string>()
                });
        }
        catch (Neo4jException e)
        {
            throw new ApplicationException("Error creating FamilyTree node in Neo4j.", e);
        }
    }

    public async Task<List<FamilyTreeDto>> GetAllFamilyTreesAsync()
    {
        await using var session = Driver.AsyncSession();

        var query = @"
        MATCH (t:FamilyTree)
        OPTIONAL MATCH (m:FamilyMember)-[:BELONGS_TO]->(t)
        RETURN elementId(t) AS FamilyTreeId, 
               t.OwnerUserId AS OwnerUserId, 
               COLLECT({
                   FamilyMemberId: elementId(m), 
                   UserId: m.UserId,
                   FirstName: m.FirstName,
                   MiddleNames: m.MiddleNames,
                   LastName: m.LastName,
                   DateOfBirth: m.DateOfBirth,
                   DateOfDeath: m.DateOfDeath,
                   Gender: m.Gender,
                   Occupation: m.Occupation,
                   PlaceOfBirth: m.PlaceOfBirth,
                   PlaceOfDeath: m.PlaceOfDeath,
                   Nationality: m.Nationality,
                   Religion: m.Religion,
                   MaritalStatus: m.MaritalStatus,
                   RelationshipType: m.RelationshipType
               }) AS FamilyMembers";

        var result = await session.RunAsync(query);

        var familyTrees = new List<FamilyTreeDto>();

        await foreach (var record in result)
        {
            var familyTreeId = record["FamilyTreeId"].As<string>();
            var ownerUserId = record["OwnerUserId"].As<string>();

            var familyMembers = record["FamilyMembers"]?.As<List<IDictionary<string, object>>?>()?
                .Where(m => m != null)
                .Select(m => new FamilyMemberDto
                {
                    FamilyMemberId = m["FamilyMemberId"]?.ToString(),
                    UserId = m["UserId"]?.ToString(),
                    FirstName = m["FirstName"]?.ToString(),
                    MiddleNames = m["MiddleNames"] as List<string>,
                    LastName = m["LastName"]?.ToString(),
                    DateOfBirth = m["DateOfBirth"] == null ? null : DateTime.Parse(m["DateOfBirth"].ToString()),
                    DateOfDeath = m["DateOfDeath"] == null ? null : DateTime.Parse(m["DateOfDeath"].ToString()),
                    Gender = m["Gender"]?.ToString(),
                    Occupation = m["Occupation"]?.ToString(),
                    PlaceOfBirth = m["PlaceOfBirth"]?.ToString(),
                    PlaceOfDeath = m["PlaceOfDeath"]?.ToString(),
                    Nationality = m["Nationality"]?.ToString(),
                    Religion = m["Religion"]?.ToString(),
                    MaritalStatus = m["MaritalStatus"]?.ToString(),
                    RelationshipType = m["RelationshipType"]?.ToString()
                }).ToList();

            var familyTree = new FamilyTreeDto
            {
                FamilyTreeId = familyTreeId,
                OwnerUserId = ownerUserId,
                FamilyMembers = familyMembers
            };

            familyTrees.Add(familyTree);
        }

        return familyTrees;
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
                                EmailConfirmed: $EmailConfirmed, ConcurrencyStamp: $ConcurrencyStamp})
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
                user.ConcurrencyStamp
            });

            return IdentityResult.Success;
        }
        catch (Exception e)
        {
            return IdentityResult.Failed(new IdentityError { Description = e.Message });
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
            var result = await session.RunAsync(query, new { normalizedEmail });

            try
            {
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
                    NormalizedEmail = node.Properties.ContainsKey("NormalizedEmail")
                        ? node["NormalizedEmail"].As<string>()
                        : null,
                    UserName = node.Properties.ContainsKey("UserName") ? node["UserName"].As<string>() : null,
                    NormalizedUserName = node.Properties.ContainsKey("NormalizedUserName")
                        ? node["NormalizedUserName"].As<string>()
                        : null,
                    PasswordHash = node.Properties.ContainsKey("PasswordHash")
                        ? node["PasswordHash"].As<string>()
                        : null,
                    SecurityStamp = node.Properties.ContainsKey("SecurityStamp")
                        ? node["SecurityStamp"].As<string>()
                        : null
                };
            }
            catch (Exception e)
            {
                return null;
            }
        }
        catch (Exception e)
        {
            throw new Exception(e.Message);
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

            if (!await result.FetchAsync())
                return IdentityResult.Failed(new IdentityError { Description = "User not found or update failed." });

            return IdentityResult.Success;
        }
        catch (Exception e)
        {
            return IdentityResult.Failed(new IdentityError { Description = e.Message });
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
            try
            {
                var record = await result.SingleAsync();

                if (record == null) return null;

                var node = record["u"].As<INode>();
                return new ApplicationUser
                {
                    Id = node.Properties.ContainsKey("Id") ? node["Id"].As<string>() : null,
                    FirstName = node.Properties.ContainsKey("FirstName") ? node["FirstName"].As<string>() : string.Empty,
                    MiddleNames = node.Properties.ContainsKey("MiddleNames")
                        ? node["MiddleNames"].As<string>()
                        : string.Empty,
                    LastName = node.Properties.ContainsKey("LastName") ? node["LastName"].As<string>() : string.Empty,
                    Email = node.Properties.ContainsKey("Email") ? node["Email"].As<string>() : null,
                    NormalizedEmail = node.Properties.ContainsKey("NormalizedEmail")
                        ? node["NormalizedEmail"].As<string>()
                        : null,
                    UserName = node.Properties.ContainsKey("UserName") ? node["UserName"].As<string>() : null,
                    NormalizedUserName = node.Properties.ContainsKey("NormalizedUserName")
                        ? node["NormalizedUserName"].As<string>()
                        : null,
                    PasswordHash = node.Properties.ContainsKey("PasswordHash") ? node["PasswordHash"].As<string>() : null,
                    SecurityStamp =
                        node.Properties.ContainsKey("SecurityStamp") ? node["SecurityStamp"].As<string>() : null,
                    EmailConfirmed = node.Properties.ContainsKey("EmailConfirmed")
                        ? node["EmailConfirmed"].As<bool>()
                        : false,
                    ConcurrencyStamp = node.Properties.ContainsKey("ConcurrencyStamp")
                        ? node["ConcurrencyStamp"].As<string>()
                        : null
                };    
            }
            catch (Exception e)
            {
                return null;
            }
            
        }
        catch (Exception ex)
        {
            throw new Exception($"Error occurred while finding user by ID: {ex.Message}", ex);
        }
    }

    public async Task<ApplicationUser?> FindUserByNameAsync(string normalizedUserName,
        CancellationToken cancellationToken)
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

            try
            {
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
                    NormalizedEmail = node.Properties.ContainsKey("NormalizedEmail")
                        ? node["NormalizedEmail"].As<string>()
                        : null,
                    UserName = node.Properties.ContainsKey("UserName") ? node["UserName"].As<string>() : null,
                    NormalizedUserName = node.Properties.ContainsKey("NormalizedUserName")
                        ? node["NormalizedUserName"].As<string>()
                        : null,
                    PasswordHash = node.Properties.ContainsKey("PasswordHash")
                        ? node["PasswordHash"].As<string>()
                        : null,
                    SecurityStamp = node.Properties.ContainsKey("SecurityStamp")
                        ? node["SecurityStamp"].As<string>()
                        : null
                };
            }
            catch (Exception e)
            {
                return null;
            }
            
        }
        catch (Exception e)
        {
            throw new Exception(e.Message);
        }
    }

    public async Task<IdentityResult> CreateRoleAsync(ApplicationRole role, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        await using var session = Driver.AsyncSession();

        try
        {
            var query = @"
                CREATE (r:Role {Id: $Id, Name: $Name, NormalizedName: $NormalizedName})
                RETURN r";

            await session.RunAsync(query, new
            {
                role.Id,
                role.Name,
                role.NormalizedName
            });

            return IdentityResult.Success;
        }
        catch (Exception e)
        {
            return IdentityResult.Failed(new IdentityError { Description = e.Message });
        }
    }

    public async Task<bool> HasUserAccessToResourceAsync(string userId, string resourceId, string resourceType)
    {
        await using var session = Driver.AsyncSession();

        var query = resourceType.ToLower() switch
        {
            "familytree" => @"
            MATCH (t:FamilyTree)
            WHERE elementId(t) = $resourceId
            AND (t.OwnerUserId = $userId OR $userId IN COALESCE(t.SharedWithIds, []))
            RETURN COUNT(t) > 0 AS hasAccess",
            "familymember" => @"
            MATCH (m:FamilyMember)
            WHERE elementId(m) = $resourceId
            AND (m.OwnerUserId = $userId OR $userId IN COALESCE(m.SharedWithIds, []))
            RETURN COUNT(m) > 0 AS hasAccess",
            _ => throw new ArgumentException($"Unknown resource type: {resourceType}")
        };

        var result = await session.RunAsync(query, new { resourceId, userId });
        var record = await result.SingleAsync();

        return record?["hasAccess"]?.As<bool>() ?? false;
    }

    public async Task<List<FamilyTreeDto>> GetUserFamilyTreesAsync(string userId)
    {
        await using var session = Driver.AsyncSession();

        var query = @"
        MATCH (t:FamilyTree)
        WHERE t.OwnerUserId = $userId OR $userId IN COALESCE(t.SharedWithIds, [])
        OPTIONAL MATCH (m:FamilyMember)-[:BELONGS_TO]->(t)
        RETURN elementId(t) AS FamilyTreeId, 
               t.OwnerUserId AS OwnerUserId,
               COALESCE(t.SharedWithIds, []) AS SharedWithIds,
               COLLECT({
                   FamilyMemberId: elementId(m), 
                   UserId: m.UserId,
                   FirstName: m.FirstName,
                   LastName: m.LastName
               }) AS FamilyMembers";

        var result = await session.RunAsync(query, new { userId });
        var familyTrees = new List<FamilyTreeDto>();

        await foreach (var record in result)
        {
            var familyTree = new FamilyTreeDto
            {
                FamilyTreeId = record["FamilyTreeId"].As<string>(),
                OwnerUserId = record["OwnerUserId"].As<string>(),
                SharedWithIds = record["SharedWithIds"].As<List<string>>()
                // Map family members...
            };
            familyTrees.Add(familyTree);
        }

        return familyTrees;
    }

    public async Task<List<FamilyMemberDto>> GetUserFamilyMembersAsync(string userId, int skip = 0, int limit = 100)
    {
        await using var session = Driver.AsyncSession();

        var query = @"
        MATCH (m:FamilyMember)
        WHERE m.OwnerUserId = $userId OR $userId IN COALESCE(m.SharedWithIds, [])
        RETURN m 
        SKIP $skip LIMIT $limit";

        var result = await session.RunAsync(query, new { userId, skip, limit });

        return await result.ToListAsync(record =>
        {
            var node = record["m"].As<INode>();
            return new FamilyMemberDto
            {
                FamilyMemberId = node.ElementId,
                UserId = node.Properties.ContainsKey("userId") ? node["userId"]?.As<string>() : null,
                FirstName = node.Properties.ContainsKey("firstName") ? node["firstName"]?.As<string>() : null,
                LastName = node.Properties.ContainsKey("lastName") ? node["lastName"]?.As<string>() : null,
                MiddleNames = node.Properties.ContainsKey("middleNames")
                    ? node["middleNames"]?.As<List<string>>()
                    : null,
                DateOfBirth = node.Properties.ContainsKey("dateOfBirth") ? node["dateOfBirth"]?.As<DateTime?>() : null,
                DateOfDeath = node.Properties.ContainsKey("dateOfDeath") ? node["dateOfDeath"]?.As<DateTime?>() : null,
                Gender = node.Properties.ContainsKey("gender") ? node["gender"]?.As<string>() : null,
                Occupation = node.Properties.ContainsKey("occupation") ? node["occupation"]?.As<string>() : null,
                PlaceOfBirth = node.Properties.ContainsKey("placeOfBirth") ? node["placeOfBirth"]?.As<string>() : null,
                PlaceOfDeath = node.Properties.ContainsKey("placeOfDeath") ? node["placeOfDeath"]?.As<string>() : null,
                Nationality = node.Properties.ContainsKey("nationality") ? node["nationality"]?.As<string>() : null,
                Religion = node.Properties.ContainsKey("religion") ? node["religion"]?.As<string>() : null,
                MaritalStatus = node.Properties.ContainsKey("maritalStatus")
                    ? node["maritalStatus"]?.As<string>()
                    : null,
                RelationshipType = node.Properties.ContainsKey("relationshipType")
                    ? node["relationshipType"]?.As<string>()
                    : null
            };
        });
    }

    public async Task CreateFamilyTreeAsync(FamilyTreeDto familyTree, string ownerId)
    {
        await using var session = Driver.AsyncSession();

        var query = @"
        CREATE (t:FamilyTree {
            OwnerUserId: $ownerId, 
            SharedWithIds: $sharedWithIds,
            CreatedAt: datetime()
        })
        RETURN elementId(t) AS FamilyTreeId";

        var result = await session.RunAsync(query, new
        {
            ownerId,
            sharedWithIds = familyTree.SharedWithIds ?? new List<string>()
        });

        var record = await result.SingleAsync();
        familyTree.FamilyTreeId = record["FamilyTreeId"].As<string>();
        familyTree.OwnerUserId = ownerId;
    }

    public async Task CreateFamilyMemberAsync(FamilyMemberDto familyMember, string ownerId)
    {
        ValidateFamilyMemberData(familyMember);

        await using var session = Driver.AsyncSession();

        var query = @"
        CREATE (m:FamilyMember {
            OwnerUserId: $ownerId,
            SharedWithIds: $sharedWithIds,
            firstName: $firstName, 
            lastName: $lastName,
            middleNames: $middleNames,
            dateOfBirth: $dateOfBirth,
            dateOfDeath: $dateOfDeath,
            gender: $gender,
            occupation: $occupation,
            placeOfBirth: $placeOfBirth,
            placeOfDeath: $placeOfDeath,
            nationality: $nationality,
            religion: $religion,
            maritalStatus: $maritalStatus,
            relationshipType: $relationshipType,
            CreatedAt: datetime()
        })
        RETURN elementId(m) AS FamilyMemberId";

        var result = await session.RunAsync(query, new
        {
            ownerId,
            sharedWithIds = new List<string>(),
            firstName = familyMember.FirstName,
            lastName = familyMember.LastName,
            middleNames = familyMember.MiddleNames,
            dateOfBirth = familyMember.DateOfBirth,
            dateOfDeath = familyMember.DateOfDeath,
            gender = familyMember.Gender,
            occupation = familyMember.Occupation,
            placeOfBirth = familyMember.PlaceOfBirth,
            placeOfDeath = familyMember.PlaceOfDeath,
            nationality = familyMember.Nationality,
            religion = familyMember.Religion,
            maritalStatus = familyMember.MaritalStatus,
            relationshipType = familyMember.RelationshipType
        });

        var record = await result.SingleAsync();
        familyMember.FamilyMemberId = record["FamilyMemberId"].As<string>();
    }

    public async Task ShareResourceAsync(string resourceId, string resourceType, string ownerId, string targetUserId)
    {
        await using var session = Driver.AsyncSession();

        var query = resourceType.ToLower() switch
        {
            "familytree" => @"
            MATCH (t:FamilyTree)
            WHERE elementId(t) = $resourceId AND t.OwnerUserId = $ownerId
            SET t.SharedWithIds = CASE 
                WHEN $targetUserId IN COALESCE(t.SharedWithIds, []) THEN t.SharedWithIds
                ELSE COALESCE(t.SharedWithIds, []) + [$targetUserId]
            END",
            "familymember" => @"
            MATCH (m:FamilyMember)
            WHERE elementId(m) = $resourceId AND m.OwnerUserId = $ownerId
            SET m.SharedWithIds = CASE 
                WHEN $targetUserId IN COALESCE(m.SharedWithIds, []) THEN m.SharedWithIds
                ELSE COALESCE(m.SharedWithIds, []) + [$targetUserId]
            END",
            _ => throw new ArgumentException($"Unknown resource type: {resourceType}")
        };

        await session.RunAsync(query, new { resourceId, ownerId, targetUserId });
    }
    
    public async Task CreateVaultAsync(VaultDto vault, string ownerId)
{
    await using var session = Driver.AsyncSession();

    var query = @"
        CREATE (v:Vault {
            VaultId: randomUUID(),
            OwnerId: $ownerId,
            SharedWithIds: $sharedWithIds,
            CreatedAt: datetime()
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
            CurrentOwnerId: $ownerId,
            CurrentOwnerUserId: $ownerId,
            SharedWithIds: $sharedWithIds,
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
            PreviousOwnerIds: $previousOwnerIds
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

public async Task<List<VaultItemDto>> GetUserVaultItemsAsync(string userId)
{
    await using var session = Driver.AsyncSession();

    var query = @"
        MATCH (v:Vault)-[:HAS_ITEM]->(i:VaultItem)
        WHERE v.OwnerId = $userId OR $userId IN COALESCE(v.SharedWithIds, [])
           OR i.CurrentOwnerId = $userId OR $userId IN COALESCE(i.SharedWithIds, [])
        RETURN i";

    var result = await session.RunAsync(query, new { userId });
    var items = await result.ToListAsync(record =>
    {
        var node = record["i"].As<INode>();
        return new VaultItemDto
        {
            VaultItemId = node.Properties.ContainsKey("VaultItemId") ? node["VaultItemId"].As<string>() : node.ElementId,
            CurrentOwnerId = node.Properties.ContainsKey("CurrentOwnerId") ? node["CurrentOwnerId"].As<string>() : null,
            CurrentOwnerUserId = node.Properties.ContainsKey("CurrentOwnerUserId") ? node["CurrentOwnerUserId"].As<string>() : null,
            SharedWithIds = node.Properties.ContainsKey("SharedWithIds") ? node["SharedWithIds"].As<List<string>>() : new List<string>(),
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
            PreviousOwnerIds = node.Properties.ContainsKey("PreviousOwnerIds") ? node["PreviousOwnerIds"].As<List<string>>() : new List<string>()
        };
    });

    return items;
}

    private static void ValidateFamilyMemberData(FamilyMemberDto familyMember)
    {
        Console.WriteLine(familyMember);
        if (string.IsNullOrEmpty(familyMember.FirstName))
            throw new ArgumentException("FirstName is required.");
        if (string.IsNullOrEmpty(familyMember.LastName))
            throw new ArgumentException("LastName is required.");
    }
}