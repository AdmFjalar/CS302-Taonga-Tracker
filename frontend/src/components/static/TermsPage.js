import React from 'react';
import '../../styles/static/TermsPage.css';

/**
 * Terms and conditions page component for the academic project.
 *
 * @returns {JSX.Element} Terms and conditions page component
 */
const TermsPage = () => {
  return (
    <div className="terms-page">
      <h1>Terms and Conditions</h1>
      <p className="last-updated">Last updated: 2025-07-01</p>

      <div className="terms-notice">
        <h2>⚠️ Important Notice: Academic Project</h2>
        <p><strong>This is an academic MVP (Minimum Viable Product) developed for educational purposes only.</strong></p>
      </div>

      <section className="terms-section">
        <h2>1. Educational Purpose</h2>
        <p>
          This website ("Taonga Tracker") is a Minimum Viable Product (MVP) created solely for
          educational and demonstration purposes as part of a university project. It is not
          intended to be a commercial product or service with production-grade security measures.
        </p>
      </section>

      <section className="terms-section">
        <h2>2. Limited Liability</h2>
        <p>
          The developers and associated university disclaim all liability for any data loss,
          security breaches, or other issues that may arise from the use of this academic project.
          Use this application at your own risk.
        </p>
      </section>

      <section className="terms-section">
        <h2>3. Data Security</h2>
        <p>
          While we implement basic security measures, this is an educational project and may not
          have the same level of security as commercial applications. Do not upload sensitive
          personal information or valuable data.
        </p>
      </section>

      <section className="terms-section">
        <h2>4. User Responsibilities</h2>
        <p>
          Users are responsible for:
        </p>
        <ul>
          <li>Providing accurate information</li>
          <li>Maintaining the confidentiality of their account</li>
          <li>Using the application in accordance with its educational purpose</li>
          <li>Not attempting to exploit or damage the system</li>
        </ul>
      </section>

      <section className="terms-section">
        <h2>5. Intellectual Property</h2>
        <p>
          This project is developed for educational purposes. Users retain ownership of their
          uploaded content, while the application code and design remain the intellectual
          property of the development team.
        </p>
      </section>

      <section className="terms-section">
        <h2>6. Modifications</h2>
        <p>
          These terms may be updated as the project evolves. Continued use of the application
          constitutes acceptance of any modifications to these terms.
        </p>
      </section>

      <section className="terms-section">
        <h2>7. Contact</h2>
        <p>
          For questions about these terms or the project, please contact the development team
          through the email in the footer.
        </p>
      </section>
    </div>
  );
};

export default TermsPage;
