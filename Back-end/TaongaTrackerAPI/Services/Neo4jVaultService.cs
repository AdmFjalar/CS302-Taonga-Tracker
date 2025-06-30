using Neo4j.Driver;
using TaongaTrackerAPI.Models;

namespace TaongaTrackerAPI.Services;

public partial class Neo4jService
{
    // Vault and VaultItem methods
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
                OwnerId = node.Properties.ContainsKey("OwnerId") ? node["OwnerId"].As<string>() ?? string.Empty : string.Empty,
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
            VaultId = Guid.NewGuid().ToString(),
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
                Currency: $currency,
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
            currency = item.Currency,
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
                i.Currency = $currency,
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
            currency = item.Currency,
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
                VaultItemId = node.Properties.ContainsKey("VaultItemId") ? node["VaultItemId"].As<string>() ?? string.Empty : node.ElementId,
                Title = node.Properties.ContainsKey("Title") ? node["Title"].As<string>() ?? string.Empty : string.Empty,
                Description = node.Properties.ContainsKey("Description") ? node["Description"].As<string>() : null,
                CreationDate = node.Properties.ContainsKey("CreationDate") ? node["CreationDate"].As<DateTime?>() : null,
                CreationPlace = node.Properties.ContainsKey("CreationPlace") ? node["CreationPlace"].As<string>() : null,
                CreatorId = node.Properties.ContainsKey("CreatorId") ? node["CreatorId"].As<string>() : null,
                Materials = node.Properties.ContainsKey("Materials") ? node["Materials"].As<List<string>>() : new List<string>(),
                CraftType = node.Properties.ContainsKey("CraftType") ? node["CraftType"].As<List<string>>() : new List<string>(),
                ItemType = node.Properties.ContainsKey("ItemType") ? node["ItemType"].As<string>() : null,
                EstimatedValue = node.Properties.ContainsKey("EstimatedValue") ? node["EstimatedValue"].As<decimal?>() ?? 0 : 0,
                Currency = node.Properties.ContainsKey("Currency") ? node["Currency"].As<string>() : null,
                DateAcquired = node.Properties.ContainsKey("DateAcquired") ? node["DateAcquired"].As<DateTime?>() : null,
                PhotoUrl = node.Properties.ContainsKey("PhotoUrl") ? node["PhotoUrl"].As<string>() : null,
                PreviousOwnerIds = node.Properties.ContainsKey("PreviousOwnerIds") ? node["PreviousOwnerIds"].As<List<string>>() : new List<string>(),
                SharedWithIds = node.Properties.ContainsKey("SharedWithIds") ? node["SharedWithIds"].As<List<string>>() : new List<string>(),
                CurrentOwnerId = node.Properties.ContainsKey("CurrentOwnerId") ? node["CurrentOwnerId"].As<string>() ?? string.Empty : string.Empty,
                CurrentOwnerUserId = node.Properties.ContainsKey("CurrentOwnerUserId") ? node["CurrentOwnerUserId"].As<string>() ?? string.Empty : string.Empty
            };
        });

        return items;
    }

    // Resource access methods
    public async Task<bool> HasUserAccessToResourceAsync(string userId, string resourceId, string resourceType)
    {
        await using var session = Driver.AsyncSession();
        
        var query = resourceType.ToLower() switch
        {
            "vault" => @"
                MATCH (v:Vault {VaultId: $resourceId})
                WHERE v.OwnerId = $userId OR $userId IN COALESCE(v.SharedWithIds, [])
                RETURN COUNT(v) > 0 as hasAccess",
            "vaultitem" => @"
                MATCH (v:Vault)-[:HAS_ITEM]->(i:VaultItem {VaultItemId: $resourceId})
                WHERE v.OwnerId = $userId OR $userId IN COALESCE(v.SharedWithIds, [])
                RETURN COUNT(i) > 0 as hasAccess",
            "familytree" => @"
                MATCH (t:FamilyTree {OwnerUserId: $userId})
                RETURN COUNT(t) > 0 as hasAccess",
            _ => "RETURN false as hasAccess"
        };

        var result = await session.RunAsync(query, new { userId, resourceId });
        var record = await result.SingleAsync();
        return record["hasAccess"].As<bool>();
    }

    public async Task ShareResourceAsync(string resourceId, string resourceType, string ownerId, string targetUserId)
    {
        await using var session = Driver.AsyncSession();
        
        var query = resourceType.ToLower() switch
        {
            "vault" => @"
                MATCH (v:Vault {VaultId: $resourceId, OwnerId: $ownerId})
                SET v.SharedWithIds = COALESCE(v.SharedWithIds, []) + $targetUserId",
            "vaultitem" => @"
                MATCH (i:VaultItem {VaultItemId: $resourceId, CurrentOwnerId: $ownerId})
                SET i.SharedWithIds = COALESCE(i.SharedWithIds, []) + $targetUserId",
            _ => throw new ArgumentException($"Unsupported resource type: {resourceType}")
        };

        await session.RunAsync(query, new { resourceId, ownerId, targetUserId });
    }
}
