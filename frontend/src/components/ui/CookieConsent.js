import React, { useState, useEffect } from 'react';
import '../../styles/ui/CookieConsent.css';

/**
 * GDPR-compliant cookie consent banner
 * @component
 */
const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true, // Always true, cannot be disabled
    functional: false,
    analytics: false,
    marketing: false
  });

  useEffect(() => {
    // Check if user has already made a choice
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
    const consentData = {
      ...preferences,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('cookie_consent', JSON.stringify(consentData));
    setShowBanner(false);
    setShowDetails(false);
    initializeServices(consentData);
  };

  const initializeServices = (consent) => {
    // Initialize analytics only if consented
    if (consent.analytics && window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'granted'
      });
    }

    // Initialize marketing tools only if consented
    if (consent.marketing) {
      // Initialize marketing pixels, etc.
    }
  };

  const handlePreferenceChange = (type) => {
    if (type === 'necessary') return; // Cannot change necessary cookies

    setPreferences(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  if (!showBanner) return null;

  return (
    <div className="cookie-consent">
      <div className="cookie-consent-content">
        <div className="cookie-consent-text">
          <h3>We value your privacy</h3>
          <p>
            We use cookies to enhance your browsing experience, serve personalized content,
            and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.
          </p>
        </div>

        <div className="cookie-consent-actions">
          <button
            className="btn-secondary"
            onClick={() => setShowDetails(!showDetails)}
          >
            Customize
          </button>
          <button
            className="btn-outline"
            onClick={handleRejectAll}
          >
            Reject All
          </button>
          <button
            className="btn-primary"
            onClick={handleAcceptAll}
          >
            Accept All
          </button>
        </div>
      </div>

      {showDetails && (
        <div className="cookie-preferences">
          <h4>Cookie Preferences</h4>

          <div className="cookie-category">
            <div className="cookie-category-header">
              <input
                type="checkbox"
                id="necessary"
                checked={preferences.necessary}
                disabled={true}
                onChange={() => {}}
              />
              <label htmlFor="necessary">
                <strong>Necessary Cookies</strong>
                <span className="required">Required</span>
              </label>
            </div>
            <p>Essential for the website to function properly. Cannot be disabled.</p>
          </div>

          <div className="cookie-category">
            <div className="cookie-category-header">
              <input
                type="checkbox"
                id="functional"
                checked={preferences.functional}
                onChange={() => handlePreferenceChange('functional')}
              />
              <label htmlFor="functional">
                <strong>Functional Cookies</strong>
              </label>
            </div>
            <p>Enable enhanced functionality like user preferences and settings.</p>
          </div>

          <div className="cookie-category">
            <div className="cookie-category-header">
              <input
                type="checkbox"
                id="analytics"
                checked={preferences.analytics}
                onChange={() => handlePreferenceChange('analytics')}
              />
              <label htmlFor="analytics">
                <strong>Analytics Cookies</strong>
              </label>
            </div>
            <p>Help us understand how visitors interact with our website.</p>
          </div>

          <div className="cookie-category">
            <div className="cookie-category-header">
              <input
                type="checkbox"
                id="marketing"
                checked={preferences.marketing}
                onChange={() => handlePreferenceChange('marketing')}
              />
              <label htmlFor="marketing">
                <strong>Marketing Cookies</strong>
              </label>
            </div>
            <p>Used to deliver relevant advertisements and track ad performance.</p>
          </div>

          <div className="cookie-preferences-actions">
            <button
              className="btn-primary"
              onClick={handleSavePreferences}
            >
              Save Preferences
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CookieConsent;
