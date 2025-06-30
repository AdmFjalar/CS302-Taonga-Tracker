using System.Diagnostics;

namespace TaongaTrackerAPI.Services;

/// <summary>
/// Background service for automated image cleanup operations
/// </summary>
public class ImageCleanupBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<ImageCleanupBackgroundService> _logger;
    private readonly IConfiguration _configuration;
    
    public ImageCleanupBackgroundService(
        IServiceProvider serviceProvider,
        ILogger<ImageCleanupBackgroundService> logger,
        IConfiguration configuration)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        _configuration = configuration;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var isEnabled = _configuration.GetValue<bool>("ImageCleanup:BackgroundServiceEnabled", true);
        var intervalHours = _configuration.GetValue<int>("ImageCleanup:IntervalHours", 24);
        
        if (!isEnabled)
        {
            _logger.LogInformation("Image cleanup background service is disabled");
            return;
        }

        _logger.LogInformation("Image cleanup background service started. Interval: {Hours} hours", intervalHours);

        var interval = TimeSpan.FromHours(intervalHours);
        
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await Task.Delay(interval, stoppingToken);

                if (stoppingToken.IsCancellationRequested)
                    break;

                await PerformScheduledCleanup(stoppingToken);
            }
            catch (OperationCanceledException)
            {
                // Expected when cancellation is requested
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in image cleanup background service");
                // Continue running despite errors
                await Task.Delay(TimeSpan.FromMinutes(30), stoppingToken); // Wait 30 minutes before retry
            }
        }

        _logger.LogInformation("Image cleanup background service stopped");
    }

    private async Task PerformScheduledCleanup(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var cleanupService = scope.ServiceProvider.GetRequiredService<IImageCleanupService>();
        
        try
        {
            _logger.LogInformation("Starting scheduled image cleanup");
            
            var stopwatch = Stopwatch.StartNew();
            var result = await cleanupService.CleanupOrphanedImagesAsync(cancellationToken);
            stopwatch.Stop();

            if (result.Success)
            {
                _logger.LogInformation("Scheduled image cleanup completed successfully in {Duration}ms: {Summary}", 
                    stopwatch.ElapsedMilliseconds, result.GetSummary());
            }
            else
            {
                _logger.LogError("Scheduled image cleanup failed: {Error}", result.ErrorMessage);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during scheduled image cleanup");
        }
    }
}
