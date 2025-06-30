import React from 'react';
import '../../styles/static/FAQPage.css';

/**
 * Frequently asked questions page component for user support.
 *
 * @returns {JSX.Element} FAQ page component
 */
const FAQPage = () => {
  return (
    <div className="faq-page">
      <h1>Frequently Asked Questions</h1>
      <p className="last-updated">Last updated: 2025-06-28</p>

      <div className="faq-intro">
        <p>
          Find answers to the most frequently asked questions about Taonga Tracker,
          how it works, and how it can help you preserve your family heritage.
        </p>
      </div>

      <div className="faq-container">
        <div className="faq-item">
          <h3>What is Taonga Tracker?</h3>
          <div className="faq-answer">
            <p>
              Taonga Tracker is a family heritage application for documenting, organizing,
              and preserving heritage items and family relationships across generations.
              It creates digital records of family heirlooms with photos, stories, and provenance information.
            </p>
          </div>
        </div>

        <div className="faq-item">
          <h3>Is Taonga Tracker free to use?</h3>
          <div className="faq-answer">
            <p>
              Yes, this is an academic project developed for educational purposes and is
              completely free to use. However, please note this is a prototype system
              and not a commercial product.
            </p>
          </div>
        </div>

        <div className="faq-item">
          <h3>How do I get started?</h3>
          <div className="faq-answer">
            <p>
              Simply create an account by clicking "Sign Up" and start adding your family
              members and heirlooms. You can build your family tree and document your
              heritage items with photos and descriptions.
            </p>
          </div>
        </div>

        <div className="faq-item">
          <h3>Is my data secure?</h3>
          <div className="faq-answer">
            <p>
              While we implement basic security measures, this is an academic project
              and may not have commercial-grade security. Please avoid uploading highly
              sensitive personal information.
            </p>
          </div>
        </div>

        <div className="faq-item">
          <h3>Can I export my data?</h3>
          <div className="faq-answer">
            <p>
              Yes, you can export your family and heirloom data through the settings page.
              This allows you to download your information in a readable format.
            </p>
          </div>
        </div>

        <div className="faq-item">
          <h3>What file formats are supported for photos?</h3>
          <div className="faq-answer">
            <p>
              The application supports common image formats including JPEG, PNG, and GIF.
              For best results, use high-quality photos under 5MB in size.
            </p>
          </div>
        </div>

        <div className="faq-item">
          <h3>Can I share my family tree with others?</h3>
          <div className="faq-answer">
            <p>
              Currently, this MVP version focuses on individual family documentation.
              Sharing features may be added in future versions of the project.
            </p>
          </div>
        </div>

        <div className="faq-item">
          <h3>What happens to my data when the project ends?</h3>
          <div className="faq-answer">
            <p>
              As this is an academic project, the service may be discontinued or reset
              at any time. We recommend regularly exporting your data as a backup.
            </p>
          </div>
        </div>

        <div className="faq-item">
          <h3>How can I report bugs or suggest features?</h3>
          <div className="faq-answer">
            <p>
              Since this is an educational project, feedback can be provided through
              the university's computer science department or project team members.
            </p>
          </div>
        </div>

        <div className="faq-item">
          <h3>What does "Taonga" mean?</h3>
          <div className="faq-answer">
            <p>
              "Taonga" is a Māori word meaning treasure or something precious. It perfectly
              represents the family heirlooms and heritage items that this application
              helps you preserve and document.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;