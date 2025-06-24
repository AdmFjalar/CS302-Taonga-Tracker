import React from 'react';
import '../../styles/static/AboutPage.css';

/**
 * About Page component - provides information about the Taonga Tracker project
 * 
 * @returns {JSX.Element} The About page component
 */
const AboutPage = () => {
  return (
    <div className="about-page">
      <h1>About Taonga Tracker</h1>

      <section className="about-section">
        <h2>Our Mission</h2>
        <p>
          Taonga Tracker was developed with a mission to help families preserve their heritage,
          history, and heirlooms for generations to come. Our platform provides a secure and
          organized way to document your family's treasured possessions, stories, and connections.
        </p>
      </section>

      <section className="about-section">
        <h2>University Project</h2>
        <p>
          This application was developed as a Minimum Viable Product (MVP) for a CS302 university
          project. It demonstrates the core functionality of a heritage tracking system, but is not
          intended for commercial use in its current state.
        </p>
      </section>

      <section className="about-section">
        <h2>Features</h2>
        <ul className="feature-list">
          <li>
            <strong>Heirloom Tracking:</strong> Document and catalog your family treasures with photos,
            descriptions, histories, and ownership details.
          </li>
          <li>
            <strong>Family Tree:</strong> Create and manage your family connections to track heirloom
            provenance and heritage.
          </li>
          <li>
            <strong>Secure Accounts:</strong> Personal accounts ensure your family's information
            remains private and accessible only to you.
          </li>
        </ul>
      </section>

      <section className="about-section">
        <h2>Development Team</h2>
        <p>
          Taonga Tracker was developed by a team of dedicated computer science students as part of
          their coursework in CS302. The team focused on creating a functional, user-friendly
          application that demonstrates software engineering principles and best practices.
        </p>
      </section>

      <section className="about-section">
        <h2>Future Development</h2>
        <p>
          While Taonga Tracker is currently an MVP, there are many planned enhancements including
          improved security features, expanded storage options, advanced search capabilities, and
          integration with genealogy services.
        </p>
      </section>
    </div>
  );
};

export default AboutPage;
