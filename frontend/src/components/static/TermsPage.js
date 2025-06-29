import React from 'react';
import '../../styles/static/TermsPage.css';

/**
 * Terms and Conditions Page component
 * 
 * @returns {JSX.Element} The Terms and Conditions page component
 */
const TermsPage = () => {
  return (
    <div className="terms-page">
      <h1>Terms and Conditions</h1>
        <p className="last-updated">Last updated: 2025-06-28</p>

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
          By using this website, you acknowledge and agree that:
        </p>
        <ul>
          <li>The creators, developers, and the educational institution are not liable for any damages, losses,
          or consequences that may arise from the use of this website.</li>
          <li>This website does not guarantee the security, privacy, or continuous availability of your data.</li>
          <li>Any information provided to this website is done so at your own risk.</li>
          <li>This website may contain bugs, errors, or security vulnerabilities as it is a student project
          and not a production-ready system.</li>
        </ul>
      </section>

      <section className="terms-section">
        <h2>3. Security Limitations</h2>
        <p>
          As a university project MVP, Taonga Tracker:
        </p>
        <ul>
          <li>May not incorporate all industry-standard security measures</li>
          <li>Does not guarantee protection against unauthorized access</li>
          <li>Should not be used to store sensitive personal information</li>
          <li>May be subject to unexpected outages or data loss</li>
        </ul>
        <p>
          We recommend using fictitious data when testing or demonstrating this system.
        </p>
      </section>

      <section className="terms-section">
        <h2>4. Intellectual Property</h2>
        <p>
          All code, design elements, and content within this website are created for educational
          purposes. The intellectual property rights belong to the respective student creators
          and the educational institution under which this project was developed.
        </p>
      </section>

      <section className="terms-section">
        <h2>5. Data Usage</h2>
        <p>
          Any data you provide may be used for educational demonstrations, system testing, and
          project evaluation purposes only. We do not sell or share your data with third parties.
        </p>
        <p>
          However, due to the educational nature of this project, we cannot guarantee that your
          data will be stored securely or indefinitely.
        </p>
      </section>

      <section className="terms-section">
        <h2>6. Changes to Terms</h2>
        <p>
          These terms may be updated at any time without notice as this is an educational project
          that may evolve over time.
        </p>
      </section>

      <section className="terms-section">
        <h2>7. Contact</h2>
        <p>
          This project is not necessarily actively maintained beyond the scope of the university course.
          For inquiries related to this project, please contact <a href="mailto:support@taongatracker.com">support@taongatracker.com</a>.
        </p>
      </section>

      <div className="terms-acceptance">
        <p>
          By using Taonga Tracker, you acknowledge that you have read, understood, and agree to these
          terms and conditions.
        </p>
      </div>
    </div>
  );
};

export default TermsPage;
