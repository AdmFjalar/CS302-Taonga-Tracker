import React from 'react';
import '../../styles/static/PrivacyPage.css';

/**
 * Privacy Policy page for Taonga Tracker - Academic MVP
 * @component
 */
const PrivacyPage = () => {
  return (
    <div className="privacy-page">
      <div className="privacy-container">
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
            <li>Name and contact information (email address)</li>
            <li>Account credentials (username, hashed password)</li>
            <li>Profile information and photos you choose to share</li>
            <li>Family tree data and heirloom information you provide</li>
          </ul>
          
          <h3>Automatically Collected Information</h3>
          <ul>
            <li>Device information (browser type, operating system)</li>
            <li>Usage data (pages visited, time spent on site)</li>
            <li>IP address and approximate location</li>
            <li>Cookies and similar tracking technologies</li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>2. How We Use Your Information</h2>
          <ul>
            <li>Demonstrate family heritage tracking functionality</li>
            <li>Authenticate your account for the demo system</li>
            <li>Test and improve the application features</li>
            <li>Academic research and educational purposes</li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>3. Data Sharing and Disclosure</h2>
          <p>As an academic project, your data may be:</p>
          <ul>
            <li>Reviewed by academic supervisors and instructors</li>
            <li>Used in academic presentations or demonstrations</li>
            <li>Shared with project team members for development purposes</li>
            <li>Disclosed if required by educational institution policies</li>
          </ul>
          <p><strong>We strongly recommend not using real personal information in this system.</strong></p>
        </section>

        <section className="privacy-section">
          <h2>4. Data Security - Current Limitations</h2>
          <p>This MVP has basic security measures but significant limitations:</p>
          <ul>
            <li>Data transmission uses HTTPS encryption</li>
            <li>Passwords are hashed using standard methods</li>
            <li>Basic authentication and access controls</li>
          </ul>
          <p><strong>Security Limitations:</strong></p>
          <ul>
            <li>Data is not encrypted at rest on our servers</li>
            <li>The system may have unpatched security vulnerabilities</li>
            <li>No comprehensive security auditing has been performed</li>
            <li>Backup and recovery procedures are not enterprise-grade</li>
            <li>No guarantee against data loss or unauthorized access</li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>5. Data Retention and Deletion</h2>
          <p>As an academic project:</p>
          <ul>
            <li>Data may be retained for the duration of the academic term/project</li>
            <li>The entire system and all data may be reset or deleted at any time</li>
            <li>No long-term data preservation is guaranteed</li>
            <li>You can request account deletion, but data recovery is not guaranteed</li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>6. Cookies and Tracking</h2>
          <p>We use basic cookies for:</p>
          <ul>
            <li><strong>Essential:</strong> Basic website functionality and user sessions</li>
            <li><strong>Development:</strong> Testing and debugging purposes</li>
          </ul>
          <p>No sophisticated tracking or analytics are implemented in this MVP.</p>
        </section>

        <section className="privacy-section">
          <h2>7. Age Restrictions</h2>
          <p>This academic project is intended for educational use. Users under 18 should obtain permission from a parent or guardian before using this system.</p>
        </section>

        <section className="privacy-section">
          <h2>8. Changes to This Policy</h2>
          <p>As this is an active development project, this privacy policy may change frequently without notice. Check back regularly for updates.</p>
        </section>

        <section className="privacy-section">
          <h2>9. Contact Information</h2>
          <p>For questions about this academic project or data handling:</p>
          <ul>
            <li>Project Team: support@taongatracker.com</li>
          </ul>
          <p><strong>Note:</strong> As this is an academic project, response times may vary and support may be limited.</p>
        </section>

        <section className="privacy-section">
          <h2>10. Academic Use Disclaimer</h2>
          <p><strong>By using this system, you acknowledge that:</strong></p>
          <ul>
            <li>This is a student/academic project, not a commercial service</li>
            <li>The system is provided "as-is" without warranties</li>
            <li>Privacy and security are not guaranteed</li>
            <li>You use this system at your own risk</li>
            <li>This system should only be used with test/demo data</li>
            <li>Real personal or sensitive information should not be entered</li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPage;
