using Microsoft.AspNetCore.Identity;
using Neo4j.Driver;
using System.Text.Json;
using TaongaTrackerAPI.Models;

namespace TaongaTrackerAPI.Services;

/// <summary>
/// GDPR and Security operations for Neo4jService
/// </summary>
public partial class Neo4jService
{
    #region GDPR Operations

    /// <summary>
    /// Delete all user data for GDPR compliance (Right to be forgotten)
    /// </summary>
    public async Task DeleteUserDataAsync(string userId, CancellationToken cancellationToken = default)
    {
        var session = _driver.AsyncSession();
        try
        {
            await session.ExecuteWriteAsync(async tx =>
            {
                // Delete all user-related data in correct order to maintain referential integrity
                
                // 1. Delete security events
                await tx.RunAsync(
                    "MATCH (u:User {Id: $userId})-[:HAS_SECURITY_EVENT]->(se:SecurityEvent) DETACH DELETE se",
                    new { userId });

                // 2. Delete breach reports
                await tx.RunAsync(
                    "MATCH (u:User {Id: $userId})-[:REPORTED_BREACH]->(br:BreachReport) DETACH DELETE br",
                    new { userId });

                // 3. Delete vault items
                await tx.RunAsync(
                    "MATCH (u:User {Id: $userId})-[:OWNS]->(v:Vault)-[:CONTAINS]->(vi:VaultItem) DETACH DELETE vi",
                    new { userId });

                // 4. Delete vaults
                await tx.RunAsync(
                    "MATCH (u:User {Id: $userId})-[:OWNS]->(v:Vault) DETACH DELETE v",
                    new { userId });

                // 5. Delete family members
                await tx.RunAsync(
                    "MATCH (u:User {Id: $userId})-[:OWNS]->(ft:FamilyTree)-[:CONTAINS]->(fm:FamilyMember) DETACH DELETE fm",
                    new { userId });

                // 6. Delete family trees
                await tx.RunAsync(
                    "MATCH (u:User {Id: $userId})-[:OWNS]->(ft:FamilyTree) DETACH DELETE ft",
                    new { userId });

                // 7. Delete consent records
                await tx.RunAsync(
                    "MATCH (u:User {Id: $userId})-[:HAS_CONSENT]->(c:Consent) DETACH DELETE c",
                    new { userId });

                // 8. Delete security settings
                await tx.RunAsync(
                    "MATCH (u:User {Id: $userId})-[:HAS_SECURITY_SETTINGS]->(ss:SecuritySettings) DETACH DELETE ss",
                    new { userId });

                // 9. Delete vulnerabilities
                await tx.RunAsync(
                    "MATCH (u:User {Id: $userId})-[:HAS_VULNERABILITY]->(v:Vulnerability) DETACH DELETE v",
                    new { userId });

                // 10. Finally delete the user node
                await tx.RunAsync(
                    "MATCH (u:User {Id: $userId}) DETACH DELETE u",
                    new { userId });

                _logger.LogInformation("Successfully deleted all data for user {UserId}", userId);
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting user data for user {UserId}", userId);
            throw;
        }
        finally
        {
            await session.CloseAsync();
        }
    }

    /// <summary>
    /// Get user's consent preferences
    /// </summary>
    public async Task<ConsentDto?> GetUserConsentAsync(string userId, CancellationToken cancellationToken = default)
    {
        var session = _driver.AsyncSession();
        try
        {
            var result = await session.ExecuteReadAsync(async tx =>
            {
                var cursor = await tx.RunAsync(
                    @"MATCH (u:User {Id: $userId})-[:HAS_CONSENT]->(c:Consent)
                      RETURN c.dataProcessingConsent as dataProcessingConsent,
                             c.marketingConsent as marketingConsent,
                             c.analyticsConsent as analyticsConsent,
                             c.cookieConsent as cookieConsent,
                             c.thirdPartyConsent as thirdPartyConsent,
                             c.lastUpdated as lastUpdated",
                    new { userId });

                if (await cursor.FetchAsync())
                {
                    var record = cursor.Current;
                    return new ConsentDto
                    {
                        DataProcessingConsent = record["dataProcessingConsent"].As<bool>(),
                        MarketingConsent = record["marketingConsent"].As<bool>(),
                        AnalyticsConsent = record["analyticsConsent"].As<bool>(),
                        CookieConsent = record["cookieConsent"].As<bool>(),
                        ThirdPartyConsent = record["thirdPartyConsent"].As<bool>(),
                        LastUpdated = record["lastUpdated"].As<DateTime>()
                    };
                }
                
                return null;
            });

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving consent for user {UserId}", userId);
            throw;
        }
        finally
        {
            await session.CloseAsync();
        }
    }

    /// <summary>
    /// Update user's consent preferences
    /// </summary>
    public async Task UpdateUserConsentAsync(string userId, ConsentDto consent, CancellationToken cancellationToken = default)
    {
        var session = _driver.AsyncSession();
        try
        {
            await session.ExecuteWriteAsync(async tx =>
            {
                await tx.RunAsync(
                    @"MATCH (u:User {Id: $userId})
                      MERGE (u)-[:HAS_CONSENT]->(c:Consent)
                      SET c.dataProcessingConsent = $dataProcessingConsent,
                          c.marketingConsent = $marketingConsent,
                          c.analyticsConsent = $analyticsConsent,
                          c.cookieConsent = $cookieConsent,
                          c.thirdPartyConsent = $thirdPartyConsent,
                          c.lastUpdated = $lastUpdated",
                    new
                    {
                        userId,
                        dataProcessingConsent = consent.DataProcessingConsent,
                        marketingConsent = consent.MarketingConsent,
                        analyticsConsent = consent.AnalyticsConsent,
                        cookieConsent = consent.CookieConsent,
                        thirdPartyConsent = consent.ThirdPartyConsent,
                        lastUpdated = consent.LastUpdated
                    });

                _logger.LogInformation("Updated consent preferences for user {UserId}", userId);
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating consent for user {UserId}", userId);
            throw;
        }
        finally
        {
            await session.CloseAsync();
        }
    }

    /// <summary>
    /// Export all user data for GDPR data portability
    /// </summary>
    public async Task<UserDataExport?> GetUserDataExportAsync(string userId, CancellationToken cancellationToken = default)
    {
        var session = _driver.AsyncSession();
        try
        {
            return await session.ExecuteReadAsync(async tx =>
            {
                // Get user basic information
                var userCursor = await tx.RunAsync(
                    @"MATCH (u:User {Id: $userId})
                      RETURN u.Id as userId, u.UserName as userName, u.Email as email,
                             u.FirstName as firstName, u.LastName as lastName,
                             u.MiddleNames as middleNames, u.ProfilePictureUrl as profilePictureUrl,
                             u.CreatedAt as createdAt, u.LastLoginAt as lastLoginAt",
                    new { userId });

                if (!await userCursor.FetchAsync())
                    return null;

                var userRecord = userCursor.Current;
                var userExport = new UserDataExport
                {
                    UserId = userRecord["userId"].As<string>(),
                    UserName = userRecord["userName"].As<string>(),
                    Email = userRecord["email"].As<string>(),
                    FirstName = userRecord["firstName"].As<string>(),
                    LastName = userRecord["lastName"].As<string>(),
                    MiddleNames = userRecord["middleNames"].As<string?>(),
                    ProfilePictureUrl = userRecord["profilePictureUrl"].As<string?>(),
                    CreatedAt = userRecord["createdAt"].As<DateTime>(),
                    LastLoginAt = userRecord["lastLoginAt"].As<DateTime>()
                };

                // Get consent information
                var consent = await GetUserConsentAsync(userId, cancellationToken);
                userExport.Consent = consent ?? new ConsentDto();

                // Get family trees
                var familyTreesCursor = await tx.RunAsync(
                    @"MATCH (u:User {Id: $userId})-[:OWNS]->(ft:FamilyTree)
                      RETURN ft.Id as id, ft.Name as name, ft.Description as description,
                             ft.CreatedAt as createdAt, ft.UpdatedAt as updatedAt",
                    new { userId });

                await familyTreesCursor.ForEachAsync(record =>
                {
                    userExport.FamilyTrees.Add(new
                    {
                        Id = record["id"].As<string>(),
                        Name = record["name"].As<string>(),
                        Description = record["description"].As<string?>(),
                        CreatedAt = record["createdAt"].As<DateTime>(),
                        UpdatedAt = record["updatedAt"].As<DateTime>()
                    });
                });

                // Get vaults
                var vaultsCursor = await tx.RunAsync(
                    @"MATCH (u:User {Id: $userId})-[:OWNS]->(v:Vault)
                      RETURN v.Id as id, v.Name as name, v.Description as description,
                             v.CreatedAt as createdAt, v.UpdatedAt as updatedAt",
                    new { userId });

                await vaultsCursor.ForEachAsync(record =>
                {
                    userExport.Vaults.Add(new
                    {
                        Id = record["id"].As<string>(),
                        Name = record["name"].As<string>(),
                        Description = record["description"].As<string?>(),
                        CreatedAt = record["createdAt"].As<DateTime>(),
                        UpdatedAt = record["updatedAt"].As<DateTime>()
                    });
                });

                // Get vault items
                var vaultItemsCursor = await tx.RunAsync(
                    @"MATCH (u:User {Id: $userId})-[:OWNS]->(:Vault)-[:CONTAINS]->(vi:VaultItem)
                      RETURN vi.Id as id, vi.Name as name, vi.Description as description,
                             vi.Type as type, vi.CreatedAt as createdAt, vi.UpdatedAt as updatedAt",
                    new { userId });

                await vaultItemsCursor.ForEachAsync(record =>
                {
                    userExport.VaultItems.Add(new
                    {
                        Id = record["id"].As<string>(),
                        Name = record["name"].As<string>(),
                        Description = record["description"].As<string?>(),
                        Type = record["type"].As<string>(),
                        CreatedAt = record["createdAt"].As<DateTime>(),
                        UpdatedAt = record["updatedAt"].As<DateTime>()
                    });
                });

                // Get security events (last 100 for privacy)
                var securityEventsCursor = await tx.RunAsync(
                    @"MATCH (u:User {Id: $userId})-[:HAS_SECURITY_EVENT]->(se:SecurityEvent)
                      RETURN se.timestamp as timestamp, se.type as type, se.riskLevel as riskLevel
                      ORDER BY se.timestamp DESC LIMIT 100",
                    new { userId });

                await securityEventsCursor.ForEachAsync(record =>
                {
                    userExport.SecurityEvents.Add(new
                    {
                        Timestamp = record["timestamp"].As<DateTime>(),
                        Type = record["type"].As<string>(),
                        RiskLevel = record["riskLevel"].As<string>()
                    });
                });

                return userExport;
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error exporting user data for user {UserId}", userId);
            throw;
        }
        finally
        {
            await session.CloseAsync();
        }
    }

    #endregion

    #region Security Operations

    /// <summary>
    /// Log a security event
    /// </summary>
    public async Task LogSecurityEventAsync(SecurityEventDto securityEvent, string? userId = null, CancellationToken cancellationToken = default)
    {
        var session = _driver.AsyncSession();
        try
        {
            await session.ExecuteWriteAsync(async tx =>
            {
                var eventId = Guid.NewGuid().ToString();
                var detailsJson = JsonSerializer.Serialize(securityEvent.Details);

                if (!string.IsNullOrEmpty(userId))
                {
                    // Link to user if userId provided
                    await tx.RunAsync(
                        @"MATCH (u:User {Id: $userId})
                          CREATE (u)-[:HAS_SECURITY_EVENT]->(se:SecurityEvent {
                              id: $eventId,
                              timestamp: $timestamp,
                              type: $type,
                              details: $details,
                              riskLevel: $riskLevel,
                              userAgent: $userAgent,
                              url: $url,
                              createdAt: datetime()
                          })",
                        new
                        {
                            userId,
                            eventId,
                            timestamp = securityEvent.Timestamp,
                            type = securityEvent.Type,
                            details = detailsJson,
                            riskLevel = securityEvent.RiskLevel,
                            userAgent = securityEvent.UserAgent,
                            url = securityEvent.Url
                        });
                }
                else
                {
                    // Create standalone security event
                    await tx.RunAsync(
                        @"CREATE (se:SecurityEvent {
                              id: $eventId,
                              timestamp: $timestamp,
                              type: $type,
                              details: $details,
                              riskLevel: $riskLevel,
                              userAgent: $userAgent,
                              url: $url,
                              createdAt: datetime()
                          })",
                        new
                        {
                            eventId,
                            timestamp = securityEvent.Timestamp,
                            type = securityEvent.Type,
                            details = detailsJson,
                            riskLevel = securityEvent.RiskLevel,
                            userAgent = securityEvent.UserAgent,
                            url = securityEvent.Url
                        });
                }

                _logger.LogInformation("Logged security event {EventType} with risk level {RiskLevel}", 
                    securityEvent.Type, securityEvent.RiskLevel);
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error logging security event {EventType}", securityEvent.Type);
            throw;
        }
        finally
        {
            await session.CloseAsync();
        }
    }

    /// <summary>
    /// Get security activity for a user
    /// </summary>
    public async Task<List<SecurityActivityDto>> GetSecurityActivityAsync(
        string userId, 
        string? eventType = null, 
        string? riskLevel = null, 
        DateTime? fromDate = null, 
        DateTime? toDate = null, 
        int limit = 100, 
        CancellationToken cancellationToken = default)
    {
        var session = _driver.AsyncSession();
        try
        {
            return await session.ExecuteReadAsync(async tx =>
            {
                var queryBuilder = new List<string>
                {
                    "MATCH (u:User {Id: $userId})-[:HAS_SECURITY_EVENT]->(se:SecurityEvent)"
                };

                var parameters = new Dictionary<string, object> { { "userId", userId } };

                // Add filters
                var whereConditions = new List<string>();

                if (!string.IsNullOrEmpty(eventType))
                {
                    whereConditions.Add("se.type = $eventType");
                    parameters["eventType"] = eventType;
                }

                if (!string.IsNullOrEmpty(riskLevel))
                {
                    whereConditions.Add("se.riskLevel = $riskLevel");
                    parameters["riskLevel"] = riskLevel;
                }

                if (fromDate.HasValue)
                {
                    whereConditions.Add("se.timestamp >= $fromDate");
                    parameters["fromDate"] = fromDate.Value;
                }

                if (toDate.HasValue)
                {
                    whereConditions.Add("se.timestamp <= $toDate");
                    parameters["toDate"] = toDate.Value;
                }

                if (whereConditions.Any())
                {
                    queryBuilder.Add("WHERE " + string.Join(" AND ", whereConditions));
                }

                queryBuilder.Add(@"RETURN se.id as id, se.timestamp as timestamp, se.type as type,
                                         se.details as details, se.riskLevel as riskLevel,
                                         se.userAgent as userAgent, se.url as url");
                queryBuilder.Add("ORDER BY se.timestamp DESC");
                queryBuilder.Add($"LIMIT {limit}");

                var query = string.Join(" ", queryBuilder);
                var cursor = await tx.RunAsync(query, parameters);

                var activities = new List<SecurityActivityDto>();
                await cursor.ForEachAsync(record =>
                {
                    var detailsJson = record["details"].As<string>();
                    object details = new();
                    
                    try
                    {
                        if (!string.IsNullOrEmpty(detailsJson))
                        {
                            details = JsonSerializer.Deserialize<object>(detailsJson) ?? new();
                        }
                    }
                    catch (JsonException ex)
                    {
                        _logger.LogWarning(ex, "Failed to deserialize security event details");
                    }

                    activities.Add(new SecurityActivityDto
                    {
                        Id = record["id"].As<string>(),
                        Timestamp = record["timestamp"].As<DateTime>(),
                        Type = record["type"].As<string>(),
                        Details = details,
                        RiskLevel = record["riskLevel"].As<string>(),
                        UserAgent = record["userAgent"].As<string?>(),
                        Url = record["url"].As<string?>(),
                        UserId = userId
                    });
                });

                return activities;
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving security activity for user {UserId}", userId);
            throw;
        }
        finally
        {
            await session.CloseAsync();
        }
    }

    /// <summary>
    /// Get vulnerabilities for a user
    /// </summary>
    public async Task<List<VulnerabilityDto>> GetUserVulnerabilitiesAsync(string userId, CancellationToken cancellationToken = default)
    {
        var session = _driver.AsyncSession();
        try
        {
            return await session.ExecuteReadAsync(async tx =>
            {
                var cursor = await tx.RunAsync(
                    @"MATCH (u:User {Id: $userId})-[:HAS_VULNERABILITY]->(v:Vulnerability)
                      WHERE v.status <> 'resolved'
                      RETURN v.id as id, v.type as type, v.severity as severity,
                             v.description as description, v.recommendation as recommendation,
                             v.discoveredAt as discoveredAt, v.status as status
                      ORDER BY 
                        CASE v.severity 
                          WHEN 'critical' THEN 1 
                          WHEN 'high' THEN 2 
                          WHEN 'medium' THEN 3 
                          WHEN 'low' THEN 4 
                          ELSE 5 
                        END,
                        v.discoveredAt DESC",
                    new { userId });

                var vulnerabilities = new List<VulnerabilityDto>();
                await cursor.ForEachAsync(record =>
                {
                    vulnerabilities.Add(new VulnerabilityDto
                    {
                        Id = record["id"].As<string>(),
                        Type = record["type"].As<string>(),
                        Severity = record["severity"].As<string>(),
                        Description = record["description"].As<string>(),
                        Recommendation = record["recommendation"].As<string>(),
                        DiscoveredAt = record["discoveredAt"].As<DateTime?>(),
                        Status = record["status"].As<string>()
                    });
                });

                return vulnerabilities;
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving vulnerabilities for user {UserId}", userId);
            throw;
        }
        finally
        {
            await session.CloseAsync();
        }
    }

    /// <summary>
    /// Check if user has recent suspicious activity
    /// </summary>
    public async Task<bool> HasRecentSuspiciousActivityAsync(string userId, CancellationToken cancellationToken = default)
    {
        var session = _driver.AsyncSession();
        try
        {
            return await session.ExecuteReadAsync(async tx =>
            {
                var cursor = await tx.RunAsync(
                    @"MATCH (u:User {Id: $userId})-[:HAS_SECURITY_EVENT]->(se:SecurityEvent)
                      WHERE se.type IN ['SUSPICIOUS_ACTIVITY', 'UNAUTHORIZED_ACCESS', 'LOGIN_FAILURE']
                        AND se.timestamp >= $cutoffDate
                        AND se.riskLevel IN ['high', 'critical']
                      RETURN count(se) as suspiciousCount",
                    new 
                    { 
                        userId, 
                        cutoffDate = DateTime.UtcNow.AddDays(-7) // Check last 7 days
                    });

                var record = await cursor.SingleAsync();
                var suspiciousCount = record["suspiciousCount"].As<int>();
                
                return suspiciousCount > 0;
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking suspicious activity for user {UserId}", userId);
            throw;
        }
        finally
        {
            await session.CloseAsync();
        }
    }

    /// <summary>
    /// Store a breach report
    /// </summary>
    public async Task StoreBreachReportAsync(string reportId, BreachReportDto breachReport, string userId, CancellationToken cancellationToken = default)
    {
        var session = _driver.AsyncSession();
        try
        {
            await session.ExecuteWriteAsync(async tx =>
            {
                var affectedDataJson = JsonSerializer.Serialize(breachReport.AffectedData);

                await tx.RunAsync(
                    @"MATCH (u:User {Id: $userId})
                      CREATE (u)-[:REPORTED_BREACH]->(br:BreachReport {
                          id: $reportId,
                          breachType: $breachType,
                          description: $description,
                          affectedData: $affectedData,
                          timestamp: $timestamp,
                          userAgent: $userAgent,
                          url: $url,
                          status: 'received',
                          createdAt: datetime()
                      })",
                    new
                    {
                        userId,
                        reportId,
                        breachType = breachReport.BreachType,
                        description = breachReport.Description,
                        affectedData = affectedDataJson,
                        timestamp = breachReport.Timestamp,
                        userAgent = breachReport.UserAgent,
                        url = breachReport.Url
                    });

                _logger.LogCritical("Stored breach report {ReportId} for user {UserId}: {BreachType}", 
                    reportId, userId, breachReport.BreachType);
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error storing breach report {ReportId} for user {UserId}", reportId, userId);
            throw;
        }
        finally
        {
            await session.CloseAsync();
        }
    }

    /// <summary>
    /// Get user's security settings
    /// </summary>
    public async Task<SecuritySettingsDto?> GetSecuritySettingsAsync(string userId, CancellationToken cancellationToken = default)
    {
        var session = _driver.AsyncSession();
        try
        {
            return await session.ExecuteReadAsync(async tx =>
            {
                var cursor = await tx.RunAsync(
                    @"MATCH (u:User {Id: $userId})-[:HAS_SECURITY_SETTINGS]->(ss:SecuritySettings)
                      RETURN ss.twoFactorEnabled as twoFactorEnabled,
                             ss.sessionTimeout as sessionTimeout,
                             ss.loginAlerts as loginAlerts,
                             ss.suspiciousActivityAlerts as suspiciousActivityAlerts,
                             ss.dataExportNotifications as dataExportNotifications",
                    new { userId });

                if (await cursor.FetchAsync())
                {
                    var record = cursor.Current;
                    return new SecuritySettingsDto
                    {
                        TwoFactorEnabled = record["twoFactorEnabled"].As<bool>(),
                        SessionTimeout = record["sessionTimeout"].As<int>(),
                        LoginAlerts = record["loginAlerts"].As<bool>(),
                        SuspiciousActivityAlerts = record["suspiciousActivityAlerts"].As<bool>(),
                        DataExportNotifications = record["dataExportNotifications"].As<bool>()
                    };
                }

                return null;
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving security settings for user {UserId}", userId);
            throw;
        }
        finally
        {
            await session.CloseAsync();
        }
    }

    /// <summary>
    /// Update user's security settings
    /// </summary>
    public async Task UpdateSecuritySettingsAsync(string userId, SecuritySettingsDto settings, CancellationToken cancellationToken = default)
    {
        var session = _driver.AsyncSession();
        try
        {
            await session.ExecuteWriteAsync(async tx =>
            {
                await tx.RunAsync(
                    @"MATCH (u:User {Id: $userId})
                      MERGE (u)-[:HAS_SECURITY_SETTINGS]->(ss:SecuritySettings)
                      SET ss.twoFactorEnabled = $twoFactorEnabled,
                          ss.sessionTimeout = $sessionTimeout,
                          ss.loginAlerts = $loginAlerts,
                          ss.suspiciousActivityAlerts = $suspiciousActivityAlerts,
                          ss.dataExportNotifications = $dataExportNotifications,
                          ss.updatedAt = datetime()",
                    new
                    {
                        userId,
                        twoFactorEnabled = settings.TwoFactorEnabled,
                        sessionTimeout = settings.SessionTimeout,
                        loginAlerts = settings.LoginAlerts,
                        suspiciousActivityAlerts = settings.SuspiciousActivityAlerts,
                        dataExportNotifications = settings.DataExportNotifications
                    });

                _logger.LogInformation("Updated security settings for user {UserId}", userId);
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating security settings for user {UserId}", userId);
            throw;
        }
        finally
        {
            await session.CloseAsync();
        }
    }

    #endregion

    #region Image Cleanup Operations

    /// <summary>
    /// Get all image paths referenced in the database
    /// </summary>
    public async Task<HashSet<string>> GetAllReferencedImagePathsAsync(CancellationToken cancellationToken = default)
    {
        var session = _driver.AsyncSession();
        try
        {
            return await session.ExecuteReadAsync(async tx =>
            {
                var referencedPaths = new HashSet<string>();

                // Query all nodes that might contain image references
                var queries = new[]
                {
                    // User profile pictures
                    "MATCH (u:User) WHERE u.ProfilePictureUrl IS NOT NULL RETURN u.ProfilePictureUrl as imagePath",
                    
                    // Family member photos
                    "MATCH (fm:FamilyMember) WHERE fm.PhotoUrl IS NOT NULL RETURN fm.PhotoUrl as imagePath",
                    
                    // Vault item images
                    "MATCH (vi:VaultItem) WHERE vi.ImageUrl IS NOT NULL RETURN vi.ImageUrl as imagePath",
                    
                    // Any other image references stored in vault item metadata
                    "MATCH (vi:VaultItem) WHERE vi.Metadata IS NOT NULL AND vi.Metadata CONTAINS '/uploads/images/' RETURN vi.Metadata as imagePath"
                };

                foreach (var query in queries)
                {
                    var cursor = await tx.RunAsync(query);
                    await cursor.ForEachAsync(record =>
                    {
                        var imagePath = record["imagePath"].As<string?>();
                        if (!string.IsNullOrEmpty(imagePath))
                        {
                            // Handle both full URLs and relative paths
                            if (imagePath.Contains("/uploads/images/"))
                            {
                                var relativePath = ExtractRelativePath(imagePath);
                                if (!string.IsNullOrEmpty(relativePath))
                                {
                                    referencedPaths.Add(relativePath);
                                }
                            }
                        }
                    });
                }

                return referencedPaths;
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving referenced image paths");
            throw;
        }
        finally
        {
            await session.CloseAsync();
        }
    }

    /// <summary>
    /// Check if a specific image path is referenced in the database
    /// </summary>
    public async Task<bool> IsImageReferencedAsync(string relativePath, CancellationToken cancellationToken = default)
    {
        var session = _driver.AsyncSession();
        try
        {
            return await session.ExecuteReadAsync(async tx =>
            {
                // Check all possible references to the image
                var cursor = await tx.RunAsync(
                    @"MATCH (n) 
                      WHERE (n:User AND n.ProfilePictureUrl CONTAINS $imagePath)
                         OR (n:FamilyMember AND n.PhotoUrl CONTAINS $imagePath)
                         OR (n:VaultItem AND (n.ImageUrl CONTAINS $imagePath OR n.Metadata CONTAINS $imagePath))
                      RETURN count(n) as referenceCount",
                    new { imagePath = relativePath });

                if (await cursor.FetchAsync())
                {
                    var count = cursor.Current["referenceCount"].As<int>();
                    return count > 0;
                }

                return false;
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking if image is referenced: {Path}", relativePath);
            // Return true on error to be safe (don't delete if we can't verify)
            return true;
        }
        finally
        {
            await session.CloseAsync();
        }
    }

    /// <summary>
    /// Log image cleanup statistics
    /// </summary>
    public async Task LogImageCleanupStatsAsync(ImageCleanupResult cleanupResult, CancellationToken cancellationToken = default)
    {
        var session = _driver.AsyncSession();
        try
        {
            await session.ExecuteWriteAsync(async tx =>
            {
                await tx.RunAsync(
                    @"CREATE (cleanup:ImageCleanup {
                        id: $id,
                        startTime: $startTime,
                        endTime: $endTime,
                        duration: $duration,
                        success: $success,
                        errorMessage: $errorMessage,
                        totalFilesScanned: $totalFilesScanned,
                        totalReferencesInDatabase: $totalReferencesInDatabase,
                        referencedFiles: $referencedFiles,
                        protectedFiles: $protectedFiles,
                        errorFiles: $errorFiles,
                        deletedFiles: $deletedFiles,
                        failedDeletions: $failedDeletions,
                        orphanedFileCount: $orphanedFileCount,
                        createdAt: datetime()
                    })",
                    new
                    {
                        id = Guid.NewGuid().ToString(),
                        startTime = cleanupResult.StartTime,
                        endTime = cleanupResult.EndTime,
                        duration = cleanupResult.Duration.TotalSeconds,
                        success = cleanupResult.Success,
                        errorMessage = cleanupResult.ErrorMessage,
                        totalFilesScanned = cleanupResult.TotalFilesScanned,
                        totalReferencesInDatabase = cleanupResult.TotalReferencesInDatabase,
                        referencedFiles = cleanupResult.ReferencedFiles,
                        protectedFiles = cleanupResult.ProtectedFiles,
                        errorFiles = cleanupResult.ErrorFiles,
                        deletedFiles = cleanupResult.DeletedFiles,
                        failedDeletions = cleanupResult.FailedDeletions,
                        orphanedFileCount = cleanupResult.OrphanedFiles.Count
                    });

                _logger.LogInformation("Logged image cleanup statistics to database");
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error logging image cleanup statistics");
            throw;
        }
        finally
        {
            await session.CloseAsync();
        }
    }

    /// <summary>
    /// Get the last image cleanup timestamp
    /// </summary>
    public async Task<DateTime?> GetLastImageCleanupTimeAsync(CancellationToken cancellationToken = default)
    {
        var session = _driver.AsyncSession();
        try
        {
            return await session.ExecuteReadAsync(async tx =>
            {
                var cursor = await tx.RunAsync(
                    @"MATCH (cleanup:ImageCleanup)
                      WHERE cleanup.success = true
                      RETURN cleanup.endTime as lastCleanup
                      ORDER BY cleanup.endTime DESC
                      LIMIT 1");

                if (await cursor.FetchAsync())
                {
                    return cursor.Current["lastCleanup"].As<DateTime?>();
                }

                return null;
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving last cleanup time");
            return null;
        }
        finally
        {
            await session.CloseAsync();
        }
    }

    private string ExtractRelativePath(string imagePath)
    {
        if (string.IsNullOrEmpty(imagePath))
            return string.Empty;

        // Handle full URLs like "https://domain.com/uploads/images/file.jpg"
        if (imagePath.Contains("/uploads/images/"))
        {
            var index = imagePath.IndexOf("/uploads/images/");
            return imagePath.Substring(index);
        }

        // Handle relative paths that might not start with /
        if (imagePath.StartsWith("uploads/images/"))
        {
            return "/" + imagePath;
        }

        return imagePath;
    }

    #endregion
}
