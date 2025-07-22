import React from 'react';
import '../../styles/static/StaticPage.css';

/**
 * Privacy policy page component.
 *
 * @returns {JSX.Element} Privacy policy page component
 */
const PrivacyPage = () => {
  return (
    <div className="static-page">
      <div className="static-content">
        <h1>Privacy Policy</h1>
        <p className="last-updated">Last updated: 2025-06-28</p>

        <div className="academic-disclaimer">
          <h2>⚠️ Important Notice: Academic Project</h2>
          <p><strong>This is an academic MVP (Minimum Viable Product) developed for educational purposes only.</strong></p>
          <p>This application is not intended for commercial use and is not compliant with specific privacy laws or regulations. By using this service, you acknowledge that:</p>
          <ul>
            <li>This is a prototype/demonstration system</li>
            <li>Data privacy and security are not guaranteed</li>
            <li>The system may have security vulnerabilities</li>
            <li>This should not be used to store sensitive personal information</li>
            <li>The service may be discontinued or reset at any time</li>
          </ul>
        </div>

        <section className="privacy-section">
          <h2>1. Information We Collect</h2>
          <h3>Personal Information</h3>
          <ul>
            <li>Username and email address for account creation</li>
            <li>Names and biographical information about family members</li>
            <li>Photos and descriptions of heirlooms</li>
            <li>Family relationships and connections</li>
          </ul>

          <h3>Technical Information</h3>
          <ul>
            <li>Browser type and version</li>
            <li>Device information</li>
            <li>Usage patterns and interactions</li>
            <li>Error logs and debugging information</li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>2. How We Use Information</h2>
          <p>Your information is used to:</p>
          <ul>
            <li>Provide the core functionality of the family heritage tracking system</li>
            <li>Maintain and improve the application</li>
            <li>Debug and fix technical issues</li>
            <li>Demonstrate software engineering concepts for educational purposes</li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>3. Data Storage and Security</h2>
          <p>
            As an academic project, this application implements basic security measures but
            may not meet commercial-grade security standards. Data is stored locally for
            the duration of the project and may be reset or deleted at any time.
          </p>
        </section>

        <section className="privacy-section">
          <h2>4. Data Sharing</h2>
          <p>
            We do not sell or share your personal information with third parties. Data
            may be accessed by project team members for development and debugging purposes
            only.
          </p>
        </section>

        <section className="privacy-section">
          <h2>5. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access your personal data</li>
            <li>Request deletion of your account and data</li>
            <li>Export your data in a readable format</li>
            <li>Modify or correct your information</li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>6. Cookies</h2>
          <p>
            This application uses minimal cookies for authentication and user preferences.
            You can manage cookie settings through your browser.
          </p>
        </section>

        <section className="privacy-section">
          <h2>7. Changes to This Policy</h2>
          <p>
            This privacy policy may be updated as the project evolves. Continued use
            constitutes acceptance of any changes.
          </p>
        </section>

        <section className="privacy-section">
          <h2>8. Contact</h2>
          <p>
            For questions about this privacy policy or your data, contact the development
            team through the email in the footer.
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPage;
