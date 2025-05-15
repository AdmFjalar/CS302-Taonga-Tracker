using Neo4j.Driver;
using TaongaTrackerAPI.Models;
using System.Text.Json;

namespace TaongaTrackerAPI.Services
{
    public class Neo4jService : INeo4jService, IDisposable
    {
        private readonly IDriver _driver;

        public Neo4jService(IConfiguration config)
        {
            var host = config["Neo4j:Host"] ?? "localhost";
            var boltPort = config["Neo4j:BoltPort"] ?? "7687";

            var username = config["Neo4j:Username"] ?? throw new ArgumentNullException("Neo4j:Username is missing in configuration.");
            var password = config["Neo4j:Password"] ?? throw new ArgumentNullException("Neo4j:Password is missing in configuration.");

            _driver = GraphDatabase.Driver(
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
            catch (JsonException ex)
            {
                Console.WriteLine($"Invalid JSON Format Exception: {ex.Message}");
                throw new ArgumentException("Invalid JSON format", ex);
            }
        }
        
        public async Task CreateFamilyMemberAsync(FamilyMemberDto familyMember)
        {
            ValidateFamilyMemberData(familyMember);

            await using var session = _driver.AsyncSession();
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
                        parentsIds = familyMember.ParentsIds ?? new List<int>(),
                        childrenIds = familyMember.ChildrenIds ?? new List<int>(),
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
            catch (Neo4jException ex)
            {
                throw new ApplicationException("Error creating FamilyMember node in Neo4j.", ex);
            }
        }

        public async Task<List<FamilyMemberDto>> GetAllFamilyMembersAsync(int skip = 0, int limit = 100)
        {
            await using var session = _driver.AsyncSession();

            try
            {
                var query = "MATCH (p:FamilyMember) RETURN p SKIP $skip LIMIT $limit";
                var result = await session.RunAsync(query, new { skip, limit });

                return await result.ToListAsync(record =>
                {
                    var node = record["p"].As<INode>();
                    return new FamilyMemberDto
                    {
                        UserId = node.Properties.ContainsKey("userId") ? node["userId"]?.As<string>() : null,
                        FirstName = node.Properties.ContainsKey("firstName") ? node["firstName"]?.As<string>() : null,
                        MiddleNames = node.Properties.ContainsKey("middleNames") ? node["middleNames"]?.As<List<string>>() ?? new List<string>() : null,
                        LastName = node.Properties.ContainsKey("lastName") ? node["lastName"]?.As<string>() : null,
                        DateOfBirth = node.Properties.ContainsKey("dateOfBirth") ? node["dateOfBirth"]?.As<DateTime?>() : null,
                        DateOfDeath = node.Properties.ContainsKey("dateOfDeath") ? node["dateOfDeath"]?.As<DateTime?>() : null,
                        Gender = node.Properties.ContainsKey("gender") ? node["gender"]?.As<string>() : null,
                        ParentsIds = node.Properties.ContainsKey("parentsIds") ? node["parentsIds"]?.As<List<int>>() ?? new List<int>() : null,
                        ChildrenIds = node.Properties.ContainsKey("childrenIds") ? node["childrenIds"]?.As<List<int>>() ?? new List<int>() : null,
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
            catch (Neo4jException ex)
            {
                throw new ApplicationException("Error retrieving FamilyMember nodes from Neo4j.", ex);
            }
        }
        
        public async Task CreateFamilyTreeFromJsonAsync(string jsonRequest)
        {
            if (string.IsNullOrEmpty(jsonRequest))
                throw new ArgumentException("JSON request cannot be empty");
            
        }

        public async Task<List<FamilyTreeDto>> GetAllFamilyTreesAsync()
        {
            await using var session = _driver.AsyncSession();

            try
            {
                var query = "MATCH (p:FamilyTree) RETURN ID(p) as nodeId, p";
                var result = await session.RunAsync(query);
        
                return await result.ToListAsync(record =>
                {
                    var node = record["p"].As<INode>();
                    var nodeId = record["nodeId"].As<long>();
                    return new FamilyTreeDto
                    {
                        FamilyTreeId = (int)nodeId,
                        OwnerUserId = node["ownerUserId"]?.As<string>() ?? string.Empty,
                        FamilyMembers = node["familyMembers"]?.As<List<FamilyMemberDto>>() ?? new List<FamilyMemberDto>(),
                        SharedWithIds = node["sharedWithIds"]?.As<List<string>>() ?? new List<string>()
                    };
                });
            }
            catch (Exception e)
            {
                throw new ApplicationException("Error retrieving FamilyTree nodes from Neo4j.", e);
            }
        }

        private static void ValidateFamilyMemberData(FamilyMemberDto familyMember)
        {
            Console.WriteLine(familyMember);
            if (string.IsNullOrEmpty(familyMember.FirstName))
                throw new ArgumentException("FirstName is required.");
            if (string.IsNullOrEmpty(familyMember.LastName))
                throw new ArgumentException("LastName is required.");
        }

        public void Dispose() => _driver?.Dispose();
    }
}