import React, { useState, useEffect } from 'react';
import '../../styles/ui/CookieConsent.css';

/**
 * GDPR-compliant cookie consent banner with granular preferences.
 *
 * @returns {JSX.Element} Cookie consent banner component
 */
const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true, // Always enabled, cannot be disabled
    functional: false,
    analytics: false,
    marketing: false
  });

  // Check for existing consent on component mount
  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      setShowBanner(true);
    } else {
      const savedPreferences = JSON.parse(consent);
      setPreferences(savedPreferences);
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('cookie_consent', JSON.stringify(allAccepted));
    setPreferences(allAccepted);
    setShowBanner(false);
    initializeServices(allAccepted);
  };

  const handleRejectAll = () => {
    const onlyNecessary = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('cookie_consent', JSON.stringify(onlyNecessary));
    setPreferences(onlyNecessary);
    setShowBanner(false);
    initializeServices(onlyNecessary);
  };

  const handleSavePreferences = () => {
    const savedPreferences = {
      ...preferences,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('cookie_consent', JSON.stringify(savedPreferences));
    setShowBanner(false);
    setShowDetails(false);
    initializeServices(savedPreferences);
  };

  const initializeServices = (consent) => {
    // Initialize services based on consent
    if (consent.analytics) {
      // Initialize analytics
      console.log('Analytics enabled');
    }
    if (consent.marketing) {
      // Initialize marketing tools
      console.log('Marketing cookies enabled');
    }
    if (consent.functional) {
      // Initialize functional features
      console.log('Functional cookies enabled');
    }
  };

  if (!showBanner) return null;

  return (
    <div className="cookie-consent-overlay">
      <div className="cookie-consent-banner">
        <div className="cookie-content">
          <h3>Cookie Preferences</h3>
          <p>
            We use cookies to enhance your experience, analyze site usage, and assist in our marketing efforts.
            You can customize your preferences below.
          </p>

          {showDetails && (
            <div className="cookie-details">
              <div className="cookie-category">
                <label>
                  <input
                    type="checkbox"
                    checked={preferences.necessary}
                    disabled
                  />
                  <strong>Necessary Cookies</strong>
                  <span>Required for basic site functionality</span>
                </label>
              </div>

              <div className="cookie-category">
                <label>
                  <input
                    type="checkbox"
                    checked={preferences.functional}
                    onChange={(e) => setPreferences(prev => ({
                      ...prev,
                      functional: e.target.checked
                    }))}
                  />
                  <strong>Functional Cookies</strong>
                  <span>Remember your preferences and settings</span>
                </label>
              </div>

              <div className="cookie-category">
                <label>
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) => setPreferences(prev => ({
                      ...prev,
                      analytics: e.target.checked
                    }))}
                  />
                  <strong>Analytics Cookies</strong>
                  <span>Help us understand how you use our site</span>
                </label>
              </div>

              <div className="cookie-category">
                <label>
                  <input
                    type="checkbox"
                    checked={preferences.marketing}
                    onChange={(e) => setPreferences(prev => ({
                      ...prev,
                      marketing: e.target.checked
                    }))}
                  />
                  <strong>Marketing Cookies</strong>
                  <span>Used to show you relevant advertisements</span>
                </label>
              </div>
            </div>
          )}

          <div className="cookie-actions">
            {!showDetails ? (
              <>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowDetails(true)}
                >
                  Customize
                </button>
                <button
                  className="btn btn-outline"
                  onClick={handleRejectAll}
                >
                  Reject All
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleAcceptAll}
                >
                  Accept All
                </button>
              </>
            ) : (
              <>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowDetails(false)}
                >
                  Back
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleSavePreferences}
                >
                  Save Preferences
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
