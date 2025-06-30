using System.ComponentModel.DataAnnotations;

namespace TaongaTrackerAPI.Models
{
    public class DeleteAccountDto
    {
        [Required]
        public bool ConfirmDeletion { get; set; }
        
        public string? Reason { get; set; }
    }

    public class ConsentDto
    {
        public bool DataProcessingConsent { get; set; }
        public bool MarketingConsent { get; set; }
        public bool AnalyticsConsent { get; set; }
        public bool CookieConsent { get; set; }
        public bool ThirdPartyConsent { get; set; }
        public DateTime LastUpdated { get; set; }
    }

    public class UpdateConsentDto
    {
        public bool DataProcessingConsent { get; set; }
        public bool MarketingConsent { get; set; }
        public bool AnalyticsConsent { get; set; }
        public bool CookieConsent { get; set; }
        public bool ThirdPartyConsent { get; set; }
    }

    public class DataPortabilityDto
    {
        [Required]
        [RegularExpression("^(json|csv|xml)$", ErrorMessage = "Format must be json, csv, or xml")]
        public string Format { get; set; } = "json";
    }

    public class UserDataExport
    {
        public string UserId { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string? MiddleNames { get; set; }
        public string? ProfilePictureUrl { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime LastLoginAt { get; set; }
        public ConsentDto Consent { get; set; } = new();
        public List<object> FamilyTrees { get; set; } = new();
        public List<object> Vaults { get; set; } = new();
        public List<object> VaultItems { get; set; } = new();
        public List<object> SecurityEvents { get; set; } = new();
    }
}
