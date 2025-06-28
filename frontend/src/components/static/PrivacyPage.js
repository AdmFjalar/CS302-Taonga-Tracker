import React from 'react';
import '../../styles/static/PrivacyPage.css';

/**
 * GDPR-compliant Privacy Policy page
 * @component
 */
const PrivacyPage = () => {
  return (
    <div className="privacy-page">
      <div className="privacy-container">
        <h1>Privacy Policy</h1>
        <p className="last-updated">Last updated: {new Date().toLocaleDateString()}</p>

        <section className="privacy-section">
          <h2>1. Information We Collect</h2>
          <h3>Personal Information</h3>
          <ul>
            <li>Name and contact information (email address)</li>
            <li>Account credentials (username, encrypted password)</li>
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
            <li>Provide and maintain our family heritage tracking service</li>
            <li>Authenticate your account and ensure security</li>
            <li>Communicate with you about your account and our services</li>
            <li>Improve our website and user experience</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>3. Legal Basis for Processing (GDPR)</h2>
          <p>We process your personal data based on:</p>
          <ul>
            <li><strong>Contract:</strong> To provide our services as agreed</li>
            <li><strong>Legitimate Interest:</strong> To improve our services and prevent fraud</li>
            <li><strong>Consent:</strong> For marketing communications and optional features</li>
            <li><strong>Legal Obligation:</strong> To comply with applicable laws</li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>4. Data Sharing and Disclosure</h2>
          <p>We do not sell your personal information. We may share data only in these situations:</p>
          <ul>
            <li>With your explicit consent</li>
            <li>To comply with legal requirements</li>
            <li>To protect our rights and prevent fraud</li>
            <li>With service providers who assist in operating our website (under strict confidentiality agreements)</li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>5. Your Rights Under GDPR</h2>
          <p>If you are located in the EU/EEA, you have the following rights:</p>
          <ul>
            <li><strong>Access:</strong> Request a copy of your personal data</li>
            <li><strong>Rectification:</strong> Correct inaccurate personal data</li>
            <li><strong>Erasure:</strong> Request deletion of your personal data</li>
            <li><strong>Portability:</strong> Receive your data in a portable format</li>
            <li><strong>Restriction:</strong> Limit how we process your data</li>
            <li><strong>Objection:</strong> Object to processing based on legitimate interests</li>
            <li><strong>Withdraw Consent:</strong> Withdraw consent for data processing</li>
          </ul>
          <p>To exercise these rights, contact us at privacy@taongatracker.com</p>
        </section>

        <section className="privacy-section">
          <h2>6. Data Security</h2>
          <p>We implement appropriate security measures including:</p>
          <ul>
            <li>Encryption of data in transit and at rest</li>
            <li>Regular security assessments and updates</li>
            <li>Access controls and authentication requirements</li>
            <li>Staff training on data protection</li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>7. Data Retention</h2>
          <p>We retain your personal data only as long as necessary for:</p>
          <ul>
            <li>Providing our services</li>
            <li>Complying with legal obligations</li>
            <li>Resolving disputes and enforcing agreements</li>
          </ul>
          <p>Account data is typically retained for 7 years after account deletion, unless you request immediate deletion.</p>
        </section>

        <section className="privacy-section">
          <h2>8. Cookies and Tracking</h2>
          <p>We use cookies and similar technologies for:</p>
          <ul>
            <li><strong>Essential:</strong> Website functionality and security</li>
            <li><strong>Performance:</strong> Analytics to improve our service</li>
            <li><strong>Functional:</strong> Remembering your preferences</li>
            <li><strong>Marketing:</strong> Delivering relevant content (with consent)</li>
          </ul>
          <p>You can manage cookie preferences through our cookie consent banner.</p>
        </section>

        <section className="privacy-section">
          <h2>9. International Data Transfers</h2>
          <p>Your data may be processed in countries outside your residence. We ensure adequate protection through:</p>
          <ul>
            <li>Standard Contractual Clauses (SCCs)</li>
            <li>Adequacy decisions by the European Commission</li>
            <li>Other appropriate safeguards as required by law</li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>10. Children's Privacy</h2>
          <p>Our service is not intended for children under 16. We do not knowingly collect personal information from children under 16. If you believe we have collected such information, please contact us immediately.</p>
        </section>

        <section className="privacy-section">
          <h2>11. Changes to This Policy</h2>
          <p>We may update this privacy policy from time to time. We will notify you of significant changes by email or through a prominent notice on our website.</p>
        </section>

        <section className="privacy-section">
          <h2>12. Contact Information</h2>
          <p>For questions about this privacy policy or to exercise your rights, contact us:</p>
          <ul>
            <li>Email: privacy@taongatracker.com</li>
            <li>Address: [Your Company Address]</li>
            <li>Data Protection Officer: dpo@taongatracker.com</li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>13. Supervisory Authority</h2>
          <p>If you are located in the EU/EEA and have concerns about our data processing, you may lodge a complaint with your local data protection authority.</p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPage;
