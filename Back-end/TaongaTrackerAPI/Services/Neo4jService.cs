using Neo4j.Driver;
using TaongaTrackerAPI.Models;

namespace TaongaTrackerAPI.Services
{
    public class Neo4jService : INeo4jService, IDisposable
    {
        private readonly IDriver _driver;

        public Neo4jService(IConfiguration config)
        {
            _driver = GraphDatabase.Driver(
                config["Neo4j:Uri"],
                AuthTokens.Basic(config["Neo4j:Username"], config["Neo4j:Password"]));
        }

        public async Task CreateFamilyMemberAsync(FamilyMemberDto familyMember)
        {
            var session = _driver.AsyncSession();
            try
            {
                await session.RunAsync(
                    "CREATE (p:FamilyMember {userId: $userId, firstName: $firstName, middleNames: $middleNames, lastName: $lastName, dateOfBirth: $dateOfBirth, dateOfDeath: $dateOfDeath, gender: $gender, parentsIds: $parentsIds, childrenIds: $childrenIds, occupation: $occupation, placeOfBirth: $placeOfBirth, placeOfDeath: $placeOfDeath, nationality: $nationality, religion: $religion, maritalStatus: $maritalStatus, spouseId: $spouseId, relationshipType: $relationshipType})",
                    new { userId = familyMember.UserId, firstName = familyMember.FirstName, middleNames = familyMember.MiddleNames, lastName = familyMember.LastName, dateOfBirth = familyMember.DateOfBirth, dateOfDeath = familyMember.DateOfDeath, gender = familyMember.Gender, parentsIds = familyMember.ParentsIds, childrenIds = familyMember.ChildrenIds, occupation = familyMember.Occupation, placeOfBirth = familyMember.PlaceOfBirth, placeOfDeath = familyMember.PlaceOfDeath, nationality = familyMember.Nationality, religion = familyMember.Religion, maritalStatus = familyMember.MaritalStatus, spouseId = familyMember.SpouseId, relationshipType = familyMember.RelationshipType });
            }
            finally
            {
                await session.CloseAsync();
            }
        }

        public async Task<List<FamilyMemberDto>> GetAllFamilyMembersAsync()
        {
            var session = _driver.AsyncSession();
            try
            {
                var result = await session.RunAsync("MATCH (p:FamilyMember) RETURN p");
                return await result.ToListAsync(r => new FamilyMemberDto
                {
                    UserId = r["p"].As<INode>()["userId"].As<string>(),
                    FirstName = r["p"].As<INode>()["firstName"].As<string>(),
                    MiddleNames = r["p"].As<INode>()["middleNames"].As<List<string>>(),
                    LastName = r["p"].As<INode>()["lastName"].As<string>(),
                    DateOfBirth = r["p"].As<INode>()["dateOfBirth"].As<DateTime?>(),
                    DateOfDeath = r["p"].As<INode>()["dateOfDeath"].As<DateTime?>(),
                    Gender = r["p"].As<INode>()["gender"].As<string>(),
                    ParentsIds = r["p"].As<INode>()["parentsIds"].As<List<int>>(),
                    ChildrenIds = r["p"].As<INode>()["childrenIds"].As<List<int>>(),
                    Occupation = r["p"].As<INode>()["occupation"].As<string>(),
                    PlaceOfBirth = r["p"].As<INode>()["placeOfBirth"].As<string>(),
                    PlaceOfDeath = r["p"].As<INode>()["placeOfDeath"].As<string>(),
                    Nationality = r["p"].As<INode>()["nationality"].As<string>(),
                    Religion = r["p"].As<INode>()["religion"].As<string>(),
                    MaritalStatus = r["p"].As<INode>()["maritalStatus"].As<string>(),
                    SpouseId = r["p"].As<INode>()["spouseId"].As<int?>(),
                    RelationshipType = r["p"].As<INode>()["relationshipType"].As<string>()
                });
            }
            finally
            {
                await session.CloseAsync();
            }
        }

        public void Dispose() => _driver?.Dispose();
    }
}