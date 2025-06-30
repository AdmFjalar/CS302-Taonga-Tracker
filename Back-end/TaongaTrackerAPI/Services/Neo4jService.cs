using Microsoft.AspNetCore.Identity;
using Neo4j.Driver;
using TaongaTrackerAPI.Models;

namespace TaongaTrackerAPI.Services;

public partial class Neo4jService : INeo4jService, IDisposable
{
    private readonly IDriver _driver;
    private readonly ILogger<Neo4jService> _logger;

    public Neo4jService(IConfiguration config, ILogger<Neo4jService> logger)
    {
        _logger = logger;
        
        var host = config["Neo4j:Host"] ?? "localhost";
        var boltPort = config["Neo4j:BoltPort"] ?? "7687";
        var username = config["Neo4j:Username"] ?? throw new ArgumentNullException(nameof(config), "Neo4j:Username is missing in configuration.");
        var password = config["Neo4j:Password"] ?? throw new ArgumentNullException(nameof(config), "Neo4j:Password is missing in configuration.");

        _driver = GraphDatabase.Driver(
            $"bolt://{host}:{boltPort}",
            AuthTokens.Basic(username, password));
    }

    protected IDriver Driver => _driver;
    protected ILogger<Neo4jService> Logger => _logger;

    public void Dispose()
    {
        try
        {
            _driver?.Dispose();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error disposing Neo4j driver");
        }
    }

    public async Task<IdentityResult> CreateRoleAsync(ApplicationRole role, CancellationToken cancellationToken)
    {
        // Role management implementation if needed
        await Task.CompletedTask;
        return IdentityResult.Success;
    }

    // Helper method for consistent error handling and logging
    protected async Task<T> ExecuteWithRetryAsync<T>(
        Func<IAsyncSession, Task<T>> operation,
        CancellationToken cancellationToken = default,
        int maxRetries = 3)
    {
        var attempt = 0;
        while (true)
        {
            try
            {
                cancellationToken.ThrowIfCancellationRequested();
                await using var session = _driver.AsyncSession();
                return await operation(session);
            }
            catch (Exception ex) when (attempt < maxRetries && IsTransientError(ex))
            {
                attempt++;
                var delay = TimeSpan.FromMilliseconds(100 * Math.Pow(2, attempt)); // Exponential backoff
                _logger.LogWarning(ex, "Neo4j operation failed, retrying attempt {Attempt}/{MaxRetries} after {Delay}ms", 
                    attempt, maxRetries, delay.TotalMilliseconds);
                
                await Task.Delay(delay, cancellationToken);
            }
        }
    }

    private static bool IsTransientError(Exception ex)
    {
        return ex is TransientException || 
               ex is SessionExpiredException ||
               ex is ServiceUnavailableException ||
               (ex is Neo4jException neo4jEx && neo4jEx.Code?.StartsWith("Neo.TransientError") == true);
    }
}
