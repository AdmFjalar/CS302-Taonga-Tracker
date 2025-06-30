using System.ComponentModel.DataAnnotations;

namespace TaongaTrackerAPI.Models
{
    public class SecurityScanDto
    {
        public string ScanType { get; set; } = "comprehensive";
        public bool IncludeVulnerabilities { get; set; } = true;
        public bool IncludePermissions { get; set; } = true;
        public bool IncludeDataAccess { get; set; } = true;
    }

    public class SecurityScanResultDto
    {
        public double RiskScore { get; set; }
        public List<VulnerabilityDto> Vulnerabilities { get; set; } = new();
        public object Permissions { get; set; } = new();
        public object DataAccess { get; set; } = new();
        public DateTime ScanTimestamp { get; set; }
    }

    public class VulnerabilityDto
    {
        public string Id { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string Severity { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Recommendation { get; set; } = string.Empty;
        public DateTime? DiscoveredAt { get; set; }
        public string Status { get; set; } = "open";
    }

    public class SecurityEventDto
    {
        [Required]
        public DateTime Timestamp { get; set; }
        
        [Required]
        public string Type { get; set; } = string.Empty;
        
        public object Details { get; set; } = new();
        
        [Required]
        [RegularExpression("^(low|medium|high|critical)$")]
        public string RiskLevel { get; set; } = "low";
        
        public string? UserAgent { get; set; }
        public string? Url { get; set; }
    }

    public class SecurityActivityDto
    {
        public string Id { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public string Type { get; set; } = string.Empty;
        public object Details { get; set; } = new();
        public string RiskLevel { get; set; } = string.Empty;
        public string? UserAgent { get; set; }
        public string? Url { get; set; }
        public string UserId { get; set; } = string.Empty;
    }

    public class BreachReportDto
    {
        [Required]
        public string BreachType { get; set; } = string.Empty;
        
        [Required]
        public string Description { get; set; } = string.Empty;
        
        public List<string> AffectedData { get; set; } = new();
        
        [Required]
        public DateTime Timestamp { get; set; }
        
        public string? UserAgent { get; set; }
        public string? Url { get; set; }
    }

    public class BreachReportResponseDto
    {
        public string ReportId { get; set; } = string.Empty;
        public string Status { get; set; } = "received";
        public DateTime Timestamp { get; set; }
    }

    public class SecuritySettingsDto
    {
        public bool TwoFactorEnabled { get; set; }
        public int SessionTimeout { get; set; } = 30;
        public bool LoginAlerts { get; set; } = true;
        public bool SuspiciousActivityAlerts { get; set; } = true;
        public bool DataExportNotifications { get; set; } = true;
    }

    public class TwoFactorDto
    {
        [Required]
        [RegularExpression("^(enable|verify|disable)$")]
        public string Action { get; set; } = string.Empty;
        
        public string? Phone { get; set; }
        public string? Code { get; set; }
        public string? Password { get; set; }
    }

    public static class SecurityEventTypes
    {
        public const string LOGIN_SUCCESS = "LOGIN_SUCCESS";
        public const string LOGIN_FAILURE = "LOGIN_FAILURE";
        public const string PASSWORD_CHANGE = "PASSWORD_CHANGE";
        public const string PROFILE_UPDATE = "PROFILE_UPDATE";
        public const string DATA_EXPORT = "DATA_EXPORT";
        public const string ACCOUNT_DELETION = "ACCOUNT_DELETION";
        public const string SUSPICIOUS_ACTIVITY = "SUSPICIOUS_ACTIVITY";
        public const string UNAUTHORIZED_ACCESS = "UNAUTHORIZED_ACCESS";
        public const string DATA_BREACH = "DATA_BREACH";
        public const string SECURITY_SCAN = "SECURITY_SCAN";
        public const string TWO_FACTOR_ENABLED = "TWO_FACTOR_ENABLED";
        public const string TWO_FACTOR_DISABLED = "TWO_FACTOR_DISABLED";
    }
}
