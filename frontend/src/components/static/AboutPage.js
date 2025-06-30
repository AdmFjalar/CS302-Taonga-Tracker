import React from 'react';
import '../../styles/static/AboutPage.css';

/**
 * About page component providing information about the Taonga Tracker project.
 *
 * @returns {JSX.Element} About page component
 */
const AboutPage = () => {
  return (
    <div className="about-page">
      <h1>About Taonga Tracker</h1>
      <p className="last-updated">Last updated: 2025-06-28</p>

      <section className="about-section">
        <h2>Our Purpose</h2>
        <p>
          Taonga Tracker was designed with the purpose of assisting families preserving their heritage, history, or heirlooms for future generations. The platform offers a safe and organized method for documenting a family's treasured items and the stories, people, and connections that surround them.
        </p>
      </section>

      <section className="about-section">
        <h2>University Project</h2>
        <p>
          This application was developed as a Minimum Viable Product (MVP) for a university project for CS302. The application only demonstrates the core functionality of a heritage tracking system and is not commercial in its current state.
        </p>
      </section>

      <section className="about-section">
        <h2>Features</h2>
        <ul className="feature-list">
          <li>
            <p><strong>Heirloom Tracking:</strong> Collect and document family heirlooms by pictures, descriptions, histories, and ownership.</p>
          </li>
          <li>
            <p><strong>Family Tree:</strong> Create and manage your family connections to understand heirloom provenance and heritage.</p>
          </li>
          <li>
            <p><strong>Secure Accounts:</strong> Personal account information ensures that no one sees unless you want them to see it.</p>
          </li>
        </ul>
      </section>

      <section className="about-section">
        <h2>Development Team</h2>
        <p>
          Taonga Tracker was developed by a dedicated group of university computer science students for course work in CS302. Collectively we decided to focus on developing a functional, easy-to-use application that demonstrates the concepts and best practices in software engineering.
        </p>
      </section>

      <section className="about-section">
        <h2>Technology Stack</h2>
        <p>
          This application is built using modern web technologies including React for the frontend, with a focus on responsive design and user experience. The backend utilizes secure authentication and data management practices.
        </p>
      </section>

      <section className="about-section">
        <h2>Privacy & Security</h2>
        <p>
          We take the privacy and security of your family data seriously. All information is stored securely and access is restricted to your account only. We implement industry-standard security practices to protect your heritage documentation.
        </p>
      </section>
    </div>
  );
};

export default AboutPage;
