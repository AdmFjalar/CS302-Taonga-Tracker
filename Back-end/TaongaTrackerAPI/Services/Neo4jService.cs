using Neo4j.Driver;
using TaongaTrackerAPI.Models;
using System.Text.Json;

namespace TaongaTrackerAPI.Services
{
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
                        MiddleNames = node.Properties.ContainsKey("middleNames") ? node["middleNames"]?.As<List<string>>() ?? new List<string>() : null,
                        LastName = node.Properties.ContainsKey("lastName") ? node["lastName"]?.As<string>() : null,
                        DateOfBirth = node.Properties.ContainsKey("dateOfBirth") ? node["dateOfBirth"]?.As<DateTime?>() : null,
                        DateOfDeath = node.Properties.ContainsKey("dateOfDeath") ? node["dateOfDeath"]?.As<DateTime?>() : null,
                        Gender = node.Properties.ContainsKey("gender") ? node["gender"]?.As<string>() : null,
                        ParentsIds = node.Properties.ContainsKey("parentsIds") ? node["parentsIds"]?.As<List<string>>() ?? new List<string>() : null,
                        ChildrenIds = node.Properties.ContainsKey("childrenIds") ? node["childrenIds"]?.As<List<string>>() ?? new List<string>() : null,
                        Occupation = node.Properties.ContainsKey("occupation") ? node["occupation"]?.As<string>() : null,
                        PlaceOfBirth = node.Properties.ContainsKey("placeOfBirth") ? node["placeOfBirth"]?.As<string>() : null,
                        PlaceOfDeath = node.Properties.ContainsKey("placeOfDeath") ? node["placeOfDeath"]?.As<string>() : null,
                        Nationality = node.Properties.ContainsKey("nationality") ? node["nationality"]?.As<string>() : null,
                        Religion = node.Properties.ContainsKey("religion") ? node["religion"]?.As<string>() : null,
                        MaritalStatus = node.Properties.ContainsKey("maritalStatus") ? node["maritalStatus"]?.As<string>() : null,
                        SpouseId = node.Properties.ContainsKey("spouseId") ? node["spouseId"]?.As<int?>() : null,
                        RelationshipType = node.Properties.ContainsKey("relationshipType") ? node["relationshipType"]?.As<string>() : null
                    };
                });
            }
            catch (Neo4jException e)
            {
                throw new ApplicationException("Error retrieving FamilyMember nodes from Neo4j.", e);
            }
        }
        
        public async Task CreateFamilyTreeFromJsonAsync(string jsonRequest)
        {
            if (string.IsNullOrEmpty(jsonRequest))
                throw new ArgumentException("JSON request cannot be null or empty.");

            var familyTreeDto = JsonSerializer.Deserialize<FamilyTreeDto>(jsonRequest);

            if (familyTreeDto == null)
                throw new ArgumentException("Failed to deserialize JSON into FamilyTreeDto.");

            await using var session = Driver.AsyncSession();

            var createTreeQuery = @"
        CREATE (t:FamilyTree { FamilyTreeId: $FamilyTreeId, OwnerUserId: $OwnerUserId })
        RETURN t";

            await session.RunAsync(createTreeQuery, new
            { 
                FamilyTreeId = familyTreeDto.FamilyTreeId,
                OwnerUserId = familyTreeDto.OwnerUserId
            });

            // If family members are provided, create nodes for them
            if (familyTreeDto.FamilyMembers != null)
            {
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
                familyMember.RelationshipType,
            });

            // Create the relationship between the member and the family tree
            var createRelationQuery = @"
                MATCH (t:FamilyTree { FamilyTreeId: $FamilyTreeId })
                MATCH (m:FamilyMember { FamilyMemberId: $FamilyMemberId })
                MERGE (m)-[:BELONGS_TO]->(t)";

            await session.RunAsync(createRelationQuery, new
            {
                FamilyTreeId = familyTreeDto.FamilyTreeId,
                FamilyMemberId = familyMember.FamilyMemberId
            });
        }
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
                        familyMembers = familyTree.FamilyMembers?.Select(m => m.FamilyMemberId).ToList() ?? new List<string>()
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
                RelationshipType = m["RelationshipType"]?.ToString(),
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

        private static void ValidateFamilyMemberData(FamilyMemberDto familyMember)
        {
            Console.WriteLine(familyMember);
            if (string.IsNullOrEmpty(familyMember.FirstName))
                throw new ArgumentException("FirstName is required.");
            if (string.IsNullOrEmpty(familyMember.LastName))
                throw new ArgumentException("LastName is required.");
        }

        public void Dispose() => Driver?.Dispose();
    }
}