using System.Text.RegularExpressions;

namespace TaongaTrackerAPI.Services;

public interface IImageCleanupService
{
    /// <summary>
    /// Performs cleanup of orphaned image files not referenced in the database
    /// </summary>
    Task<ImageCleanupResult> CleanupOrphanedImagesAsync(CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Gets statistics about uploaded images and database references
    /// </summary>
    Task<ImageCleanupStats> GetImageStatsAsync(CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Validates if a specific image file is still referenced in the database
    /// </summary>
    Task<bool> IsImageReferencedAsync(string relativePath, CancellationToken cancellationToken = default);
}

public class ImageCleanupService : IImageCleanupService
{
    private readonly INeo4jService _neo4jService;
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<ImageCleanupService> _logger;
    private readonly IConfiguration _configuration;
    
    // Image file extensions to process
    private readonly string[] _imageExtensions = { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
    
    public ImageCleanupService(
        INeo4jService neo4jService,
        IWebHostEnvironment environment,
        ILogger<ImageCleanupService> logger,
        IConfiguration configuration)
    {
        _neo4jService = neo4jService;
        _environment = environment;
        _logger = logger;
        _configuration = configuration;
    }

    public async Task<ImageCleanupResult> CleanupOrphanedImagesAsync(CancellationToken cancellationToken = default)
    {
        var result = new ImageCleanupResult
        {
            StartTime = DateTime.UtcNow
        };

        try
        {
            _logger.LogInformation("Starting orphaned image cleanup process");

            // Get all uploaded image files
            var uploadedFiles = GetAllUploadedImageFiles();
            result.TotalFilesScanned = uploadedFiles.Count;

            _logger.LogInformation("Found {FileCount} uploaded image files to check", uploadedFiles.Count);

            // Get all image references from the database
            var referencedImages = await GetAllReferencedImagesAsync(cancellationToken);
            result.TotalReferencesInDatabase = referencedImages.Count;

            _logger.LogInformation("Found {ReferenceCount} image references in database", referencedImages.Count);

            // Identify orphaned files
            var orphanedFiles = new List<string>();
            var protectedAgeHours = _configuration.GetValue<int>("ImageCleanup:ProtectedAgeHours", 24);
            var protectedCutoff = DateTime.UtcNow.AddHours(-protectedAgeHours);

            foreach (var filePath in uploadedFiles)
            {
                try
                {
                    var relativePath = GetRelativePath(filePath);
                    
                    // Skip recently uploaded files (protection against race conditions)
                    var fileInfo = new FileInfo(filePath);
                    if (fileInfo.CreationTime > protectedCutoff)
                    {
                        result.ProtectedFiles++;
                        _logger.LogDebug("Skipping recently created file: {FilePath}", relativePath);
                        continue;
                    }

                    // Check if file is referenced in database
                    if (!referencedImages.Contains(relativePath))
                    {
                        orphanedFiles.Add(filePath);
                        result.OrphanedFiles.Add(relativePath);
                    }
                    else
                    {
                        result.ReferencedFiles++;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error checking file: {FilePath}", filePath);
                    result.ErrorFiles++;
                }
            }

            _logger.LogInformation("Identified {OrphanCount} orphaned files for deletion", orphanedFiles.Count);

            // Delete orphaned files if enabled
            var enableDeletion = _configuration.GetValue<bool>("ImageCleanup:EnableDeletion", false);
            var maxDeletionsPerRun = _configuration.GetValue<int>("ImageCleanup:MaxDeletionsPerRun", 100);

            if (enableDeletion && orphanedFiles.Any())
            {
                var filesToDelete = orphanedFiles.Take(maxDeletionsPerRun).ToList();
                
                foreach (var filePath in filesToDelete)
                {
                    try
                    {
                        File.Delete(filePath);
                        result.DeletedFiles++;
                        
                        // Also try to delete empty parent directories
                        TryDeleteEmptyDirectory(Path.GetDirectoryName(filePath));
                        
                        _logger.LogInformation("Deleted orphaned file: {FilePath}", GetRelativePath(filePath));
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to delete orphaned file: {FilePath}", filePath);
                        result.FailedDeletions++;
                    }
                }

                if (orphanedFiles.Count > maxDeletionsPerRun)
                {
                    _logger.LogWarning("Found {TotalOrphaned} orphaned files but only deleted {Deleted} due to safety limit",
                        orphanedFiles.Count, filesToDelete.Count);
                }
            }
            else if (!enableDeletion)
            {
                _logger.LogInformation("Deletion disabled - would have deleted {Count} orphaned files", orphanedFiles.Count);
            }

            result.EndTime = DateTime.UtcNow;
            result.Duration = result.EndTime - result.StartTime;
            result.Success = true;

            // Log cleanup statistics
            await LogCleanupStats(result);

            _logger.LogInformation("Image cleanup completed: {Stats}", result.GetSummary());

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during image cleanup process");
            result.EndTime = DateTime.UtcNow;
            result.Duration = result.EndTime - result.StartTime;
            result.Success = false;
            result.ErrorMessage = ex.Message;
            return result;
        }
    }

    public async Task<ImageCleanupStats> GetImageStatsAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var uploadedFiles = GetAllUploadedImageFiles();
            var referencedImages = await GetAllReferencedImagesAsync(cancellationToken);
            
            var stats = new ImageCleanupStats
            {
                TotalUploadedFiles = uploadedFiles.Count,
                TotalReferencedImages = referencedImages.Count,
                TotalDiskUsageBytes = uploadedFiles.Sum(f => new FileInfo(f).Length),
                OrphanedFileCount = uploadedFiles.Count(f => !referencedImages.Contains(GetRelativePath(f))),
                LastCleanupTime = await GetLastCleanupTimeAsync(),
                UploadDirectoryPath = GetUploadDirectoryPath()
            };

            // Calculate orphaned file size
            var orphanedFiles = uploadedFiles.Where(f => !referencedImages.Contains(GetRelativePath(f)));
            stats.OrphanedFileSizeBytes = orphanedFiles.Sum(f => new FileInfo(f).Length);

            return stats;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating image statistics");
            throw;
        }
    }

    public async Task<bool> IsImageReferencedAsync(string relativePath, CancellationToken cancellationToken = default)
    {
        try
        {
            return await _neo4jService.IsImageReferencedAsync(relativePath, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking if image is referenced: {Path}", relativePath);
            return true; // Err on the side of caution
        }
    }

    private List<string> GetAllUploadedImageFiles()
    {
        var uploadPath = GetUploadDirectoryPath();
        var files = new List<string>();

        if (!Directory.Exists(uploadPath))
        {
            _logger.LogWarning("Upload directory does not exist: {Path}", uploadPath);
            return files;
        }

        foreach (var extension in _imageExtensions)
        {
            var pattern = $"*{extension}";
            files.AddRange(Directory.GetFiles(uploadPath, pattern, SearchOption.AllDirectories));
        }

        return files;
    }

    private async Task<HashSet<string>> GetAllReferencedImagesAsync(CancellationToken cancellationToken)
    {
        return await _neo4jService.GetAllReferencedImagePathsAsync(cancellationToken);
    }

    private string GetUploadDirectoryPath()
    {
        return Path.Combine(_environment.WebRootPath, "uploads", "images");
    }

    private string GetRelativePath(string fullPath)
    {
        var uploadPath = GetUploadDirectoryPath();
        if (fullPath.StartsWith(uploadPath))
        {
            var relativePath = fullPath.Substring(uploadPath.Length).TrimStart(Path.DirectorySeparatorChar);
            return $"/uploads/images/{relativePath.Replace(Path.DirectorySeparatorChar, '/')}";
        }
        return fullPath;
    }

    private void TryDeleteEmptyDirectory(string? directoryPath)
    {
        try
        {
            if (string.IsNullOrEmpty(directoryPath) || !Directory.Exists(directoryPath))
                return;

            var uploadPath = GetUploadDirectoryPath();
            if (!directoryPath.StartsWith(uploadPath))
                return; // Safety check

            if (!Directory.EnumerateFileSystemEntries(directoryPath).Any())
            {
                Directory.Delete(directoryPath);
                _logger.LogDebug("Deleted empty directory: {Path}", directoryPath);
                
                // Recursively try to delete parent directories if they're empty
                TryDeleteEmptyDirectory(Path.GetDirectoryName(directoryPath));
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to delete empty directory: {Path}", directoryPath);
        }
    }

    private async Task LogCleanupStats(ImageCleanupResult result)
    {
        try
        {
            await _neo4jService.LogImageCleanupStatsAsync(result);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to log cleanup statistics to database");
        }
    }

    private async Task<DateTime?> GetLastCleanupTimeAsync()
    {
        try
        {
            return await _neo4jService.GetLastImageCleanupTimeAsync();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to get last cleanup time from database");
            return null;
        }
    }
}

public class ImageCleanupResult
{
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public TimeSpan Duration { get; set; }
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }

    public int TotalFilesScanned { get; set; }
    public int TotalReferencesInDatabase { get; set; }
    public int ReferencedFiles { get; set; }
    public int ProtectedFiles { get; set; }
    public int ErrorFiles { get; set; }
    public int DeletedFiles { get; set; }
    public int FailedDeletions { get; set; }

    public List<string> OrphanedFiles { get; set; } = new();

    public string GetSummary()
    {
        return $"Scanned: {TotalFilesScanned}, Referenced: {ReferencedFiles}, Orphaned: {OrphanedFiles.Count}, " +
               $"Deleted: {DeletedFiles}, Protected: {ProtectedFiles}, Errors: {ErrorFiles + FailedDeletions}";
    }
}

public class ImageCleanupStats
{
    public int TotalUploadedFiles { get; set; }
    public int TotalReferencedImages { get; set; }
    public int OrphanedFileCount { get; set; }
    public long TotalDiskUsageBytes { get; set; }
    public long OrphanedFileSizeBytes { get; set; }
    public DateTime? LastCleanupTime { get; set; }
    public string UploadDirectoryPath { get; set; } = string.Empty;

    public string GetDiskUsageFormatted() => FormatBytes(TotalDiskUsageBytes);
    public string GetOrphanedSizeFormatted() => FormatBytes(OrphanedFileSizeBytes);

    private static string FormatBytes(long bytes)
    {
        const int scale = 1024;
        string[] orders = { "GB", "MB", "KB", "Bytes" };
        long max = (long)Math.Pow(scale, orders.Length - 1);

        foreach (string order in orders)
        {
            if (bytes > max)
                return string.Format("{0:##.##} {1}", decimal.Divide(bytes, max), order);

            max /= scale;
        }
        return "0 Bytes";
    }
}
