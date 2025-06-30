using Neo4j.Driver;
using TaongaTrackerAPI.Models;

namespace TaongaTrackerAPI.Services;

public partial class Neo4jService
{
    // Family Tree and Family Member methods
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

        // Bidirectional update logic for parents and children
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

        // Bidirectional update logic
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
        return MapFamilyMember(node);
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
            return MapFamilyMember(node);
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
        var members = record["members"].As<List<INode>>().Select(node => MapFamilyMember(node)).ToList();

        return new FamilyTreeDto
        {
            FamilyTreeId = treeNode.ElementId,
            OwnerUserId = userId,
            FamilyMembers = members
        };
    }

    // Helper methods for bidirectional relationship updates
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

    // Helper methods for mapping and sibling calculation
    private static FamilyMemberDto MapFamilyMember(INode node)
    {
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
            SiblingIds = new List<string>(), // Will be set dynamically
            Nationality = node.Properties.ContainsKey("Nationality") ? node["Nationality"].As<string>() : null,
            Religion = node.Properties.ContainsKey("Religion") ? node["Religion"].As<string>() : null,
            MaritalStatus = node.Properties.ContainsKey("MaritalStatus") ? node["MaritalStatus"].As<string>() : null,
            RelationshipType = node.Properties.ContainsKey("RelationshipType") ? node["RelationshipType"].As<string>() : null,
            ProfilePictureUrl = node.Properties.ContainsKey("ProfilePictureUrl") ? node["ProfilePictureUrl"].As<string>() : null
        };
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
}
