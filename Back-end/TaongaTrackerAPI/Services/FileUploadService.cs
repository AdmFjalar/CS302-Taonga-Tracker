using Microsoft.AspNetCore.StaticFiles;
using System.Security.Cryptography;
using System.Text.RegularExpressions;
using System.Security;

namespace TaongaTrackerAPI.Services;

public interface IFileUploadService
{
    Task<string> UploadImageAsync(IFormFile file, string userId, CancellationToken cancellationToken = default);
    Task<bool> DeleteImageAsync(string fileName, string userId);
    bool IsValidImageFile(IFormFile file);
    Task<bool> ScanFileForMalwareAsync(IFormFile file);
}

public class FileUploadService : IFileUploadService
{
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<FileUploadService> _logger;
    private readonly IConfiguration _configuration;

    // Security configuration
    private readonly string[] _allowedExtensions = { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
    private readonly string[] _allowedMimeTypes = { "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp" };
    private readonly int _maxFileSizeBytes = 5 * 1024 * 1024; // 5MB

    public FileUploadService(
        IWebHostEnvironment environment, 
        ILogger<FileUploadService> logger,
        IConfiguration configuration)
    {
        _environment = environment;
        _logger = logger;
        _configuration = configuration;
    }

    public async Task<string> UploadImageAsync(IFormFile file, string userId, CancellationToken cancellationToken = default)
    {
        if (file == null || file.Length == 0)
            throw new ArgumentException("File is required");

        // Validate file
        if (!IsValidImageFile(file))
            throw new ArgumentException("Invalid file type or content");

        // Scan for malware
        if (!await ScanFileForMalwareAsync(file))
            throw new SecurityException("File failed security scan");

        // Generate secure filename
        var secureFileName = GenerateSecureFileName(file.FileName, userId);
        var uploadsPath = Path.Combine(_environment.WebRootPath, "uploads", "images");
        
        // Ensure directory exists
        Directory.CreateDirectory(uploadsPath);
        
        var filePath = Path.Combine(uploadsPath, secureFileName);

        // Validate file path to prevent directory traversal
        if (!IsValidFilePath(filePath, uploadsPath))
            throw new SecurityException("Invalid file path");

        try
        {
            // Save file with validation
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream, cancellationToken);
            }

            // Validate saved file
            if (!await ValidateSavedImageAsync(filePath))
            {
                File.Delete(filePath);
                throw new ArgumentException("File validation failed after upload");
            }

            _logger.LogInformation("File uploaded successfully: {FileName} for user: {UserId}", 
                secureFileName, userId);

            return $"/uploads/images/{secureFileName}";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "File upload failed for user: {UserId}", userId);
            
            // Cleanup on failure
            if (File.Exists(filePath))
                File.Delete(filePath);
            
            throw;
        }
    }

    public Task<bool> DeleteImageAsync(string fileName, string userId)
    {
        try
        {
            // Extract filename from URL if needed
            if (fileName.StartsWith("/uploads/images/"))
                fileName = Path.GetFileName(fileName);

            var uploadsPath = Path.Combine(_environment.WebRootPath, "uploads", "images");
            var filePath = Path.Combine(uploadsPath, fileName);

            // Validate file path
            if (!IsValidFilePath(filePath, uploadsPath))
            {
                _logger.LogWarning("Invalid file path for deletion: {FileName} by user: {UserId}", 
                    fileName, userId);
                return Task.FromResult(false);
            }

            if (File.Exists(filePath))
            {
                File.Delete(filePath);
                _logger.LogInformation("File deleted: {FileName} by user: {UserId}", fileName, userId);
                return Task.FromResult(true);
            }

            return Task.FromResult(false);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "File deletion failed: {FileName} for user: {UserId}", fileName, userId);
            return Task.FromResult(false);
        }
    }

    public bool IsValidImageFile(IFormFile file)
    {
        try
        {
            // Check file size
            if (file.Length > _maxFileSizeBytes)
            {
                _logger.LogWarning("File too large: {Size} bytes", file.Length);
                return false;
            }

            // Check file extension
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!_allowedExtensions.Contains(extension))
            {
                _logger.LogWarning("Invalid file extension: {Extension}", extension);
                return false;
            }

            // Check MIME type
            if (!_allowedMimeTypes.Contains(file.ContentType.ToLowerInvariant()))
            {
                _logger.LogWarning("Invalid MIME type: {MimeType}", file.ContentType);
                return false;
            }

            // Validate content type matches file extension
            var provider = new FileExtensionContentTypeProvider();
            if (provider.TryGetContentType(file.FileName, out var expectedContentType))
            {
                if (!string.Equals(expectedContentType, file.ContentType, StringComparison.OrdinalIgnoreCase))
                {
                    _logger.LogWarning("Content type mismatch. Expected: {Expected}, Got: {Actual}", 
                        expectedContentType, file.ContentType);
                    return false;
                }
            }

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "File validation error");
            return false;
        }
    }

    public async Task<bool> ScanFileForMalwareAsync(IFormFile file)
    {
        try
        {
            // Basic file signature validation
            using var stream = file.OpenReadStream();
            var header = new byte[10];
            await stream.ReadExactlyAsync(header, 0, header.Length);

            // Check for known image file signatures
            if (IsValidImageSignature(header, file.ContentType))
            {
                // Additional checks for embedded scripts or malicious content
                stream.Position = 0;
                using var reader = new StreamReader(stream);
                var content = await reader.ReadToEndAsync();
                
                // Check for suspicious patterns
                if (ContainsSuspiciousContent(content))
                {
                    _logger.LogWarning("Suspicious content detected in uploaded file");
                    return false;
                }

                return true;
            }

            _logger.LogWarning("Invalid file signature detected");
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Malware scan failed");
            return false;
        }
    }

    private string GenerateSecureFileName(string originalFileName, string userId)
    {
        // Create secure filename with timestamp and user ID
        var extension = Path.GetExtension(originalFileName).ToLowerInvariant();
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        var randomId = Guid.NewGuid().ToString("N")[..8];
        var userHash = ComputeHash(userId)[..8];
        
        return $"{userHash}_{timestamp}_{randomId}{extension}";
    }

    private bool IsValidFilePath(string filePath, string basePath)
    {
        try
        {
            var fullFilePath = Path.GetFullPath(filePath);
            var fullBasePath = Path.GetFullPath(basePath);
            
            return fullFilePath.StartsWith(fullBasePath);
        }
        catch
        {
            return false;
        }
    }

    private Task<bool> ValidateSavedImageAsync(string filePath)
    {
        try
        {
            // Check if file exists and has content
            var fileInfo = new FileInfo(filePath);
            if (!fileInfo.Exists || fileInfo.Length == 0)
                return Task.FromResult(false);

            // Additional validation could include:
            // - Image library validation (using System.Drawing or ImageSharp)
            // - Metadata stripping
            // - Size validation
            
            return Task.FromResult(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Image validation failed for: {FilePath}", filePath);
            return Task.FromResult(false);
        }
    }

    private bool IsValidImageSignature(byte[] header, string contentType)
    {
        // JPEG: FF D8 FF
        if (contentType.Contains("jpeg") || contentType.Contains("jpg"))
            return header.Length >= 3 && header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF;

        // PNG: 89 50 4E 47 0D 0A 1A 0A
        if (contentType.Contains("png"))
            return header.Length >= 8 && header[0] == 0x89 && header[1] == 0x50 && 
                   header[2] == 0x4E && header[3] == 0x47;

        // GIF: 47 49 46 38
        if (contentType.Contains("gif"))
            return header.Length >= 4 && header[0] == 0x47 && header[1] == 0x49 && 
                   header[2] == 0x46 && header[3] == 0x38;

        // WebP: 52 49 46 46 (RIFF)
        if (contentType.Contains("webp"))
            return header.Length >= 4 && header[0] == 0x52 && header[1] == 0x49 && 
                   header[2] == 0x46 && header[3] == 0x46;

        return false;
    }

    private bool ContainsSuspiciousContent(string content)
    {
        var suspiciousPatterns = new[]
        {
            @"<script[^>]*>",
            @"javascript:",
            @"vbscript:",
            @"on\w+\s*=",
            @"<%.*%>",
            @"<?php",
            @"eval\s*\(",
            @"exec\s*\(",
            @"system\s*\("
        };

        return suspiciousPatterns.Any(pattern => 
            Regex.IsMatch(content, pattern, RegexOptions.IgnoreCase));
    }

    private string ComputeHash(string input)
    {
        using var sha256 = SHA256.Create();
        var hashBytes = sha256.ComputeHash(System.Text.Encoding.UTF8.GetBytes(input));
        return Convert.ToHexString(hashBytes);
    }
}
