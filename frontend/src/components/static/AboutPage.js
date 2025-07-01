import React from 'react';
import '../../styles/static/StaticPage.css';

/**
 * About page component providing information about the Taonga Tracker project.
 *
 * @returns {JSX.Element} About page component
 */
const AboutPage = () => {
  return (
    <div className="static-page">
      <div className="static-content">
        <h1>About Taonga Tracker</h1>
        <p className="last-updated">Last updated: 2025-07-01</p>

        <section className="privacy-section">
          <h2>Our Purpose</h2>
          <p>
            Taonga Tracker was designed to assist users preserve their heritage, history, and heirlooms for future generations. The platform offers a central, organized solution for documenting a family's heirlooms and the stories, people, and connections that surround them.
          </p>
        </section>

        <section className="privacy-section">
          <h2>University Project</h2>
          <p>
            This application was developed as a Minimum Viable Product (MVP) for a university project for CS302. The application only demonstrates the core functionality of a heritage tracking system and is not commercial in its current state.
          </p>
        </section>

        <section className="privacy-section">
          <h2>Features</h2>
          <ul>
            <li>
              <strong>Heirloom Tracking:</strong> Collect and document family heirlooms by pictures, descriptions, histories, and ownership.
            </li>
            <li>
              <strong>Family Tree:</strong> Create and manage your family connections to understand heirloom provenance and heritage.
            </li>
            <li>
              <strong>Secure Accounts:</strong> Personal account information ensures that no one sees unless you want them to see it.
            </li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>Development Team</h2>
          <p>
            Taonga Tracker was developed by a dedicated group of university computer science students for course work in CS302. Collectively we decided to focus on developing a functional, easy-to-use application that demonstrates the concepts and best practices in software engineering.
          </p>
        </section>

        <div className="academic-note">
          <h2>Academic Project Notice</h2>
          <p>
            This is an educational MVP developed for CS302. All features are designed
            for demonstration and learning purposes.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
