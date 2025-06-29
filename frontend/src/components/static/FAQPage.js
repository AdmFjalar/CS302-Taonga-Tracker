import React from 'react';
import '../../styles/static/FAQPage.css';

/**
 * Frequently Asked Questions Page component
 *
 * @returns {JSX.Element} The FAQ page component
 */
const FAQPage = () => {
  return (
    <div className="faq-page">
      <h1>Frequently Asked Questions</h1>
        <p className="last-updated">Last updated: 2025-06-28</p>
      <div className="faq-intro">
        <p>
            Find out the most frequently asked questions about Taonga Tracker, how it works, and how it can help you preserve your family heritage.
        </p>
      </div>

      <div className="faq-container">
        <div className="faq-item">
          <h3>What is Taonga Tracker?</h3>
          <div className="faq-answer">
            <p>
                Taonga Tracker is a family heritage app for documenting, organizing and preserving heritage items & families and their relationships across generations. Taonga Tracker creates digital records of family heirlooms facilitating digital story telling, with accompanying photos and information on provenance.
            </p>
          </div>
        </div>

        <div className="faq-item">
          <h3>Is Taonga Tracker free to use?</h3>
          <div className="faq-answer">
            <p>
                Currently, Taonga Tracker is a university project (CS302) provided as a demonstration. As a result, there is no cost associated with using Taonga Tracker during this demonstration and development phase.
            </p>
          </div>
        </div>

        <div className="faq-item">
          <h3>How secure is my data?</h3>
          <div className="faq-answer">
            <p>
                As outlined in our Terms and Conditions, Taonga Tracker is a Minimum Viable Product (MVP) created for educational, instructional and knowledge dissemination purposes. We implement rudimentary security protocols. For the time being, we recommend not storing highly sensitive data.
            </p>
            <p>
              For more information about data security, please visit our <a href="/terms">Terms and Conditions</a> page.
            </p>
          </div>
        </div>

        <div className="faq-item">
          <h3>How do I add a family heirloom to my account?</h3>
          <div className="faq-answer">
            <p>
                After you log in, go to the sidebar menu and go to "Heirlooms". Click the "Add New Item" button and fill out the form with the information regarding the heirloom, such as photographs, description, history, and previous owners.
            </p>
          </div>
        </div>

        <div className="faq-item">
          <h3>Can I create a family tree?</h3>
          <div className="faq-answer">
            <p>
                Yes. Taonga Tracker has a family tree feature, so you can document your family relationships. From the sidebar menu, click on "Family Tree" to add family members and relationships.
            </p>
          </div>
        </div>

        <div className="faq-item">
          <h3>Can I link heirlooms to family members?</h3>
          <div className="faq-answer">
            <p>
                Yes. One of Taonga Tracker's features is linking heirlooms to family members in your family tree so there is a complete provenance record, preserving the full story of your family's treasures.
            </p>
          </div>
        </div>

        <div className="faq-item">
          <h3>Can I share my heirloom information with other family members?</h3>
          <div className="faq-answer">
            <p>
                Currently with the MVP, you cannot share heirlooms but there are plans for future updates with family sharing features for multiple family members to contribute and view the family collection.
            </p>
          </div>
        </div>

        <div className="faq-item">
          <h3>What types of items should I document?</h3>
          <div className="faq-answer">
              <p>
                  You can document any items that have significance to your family history, such as:
              </p>
              <ul>
                  <li>Jewelry and watches passed through generations</li>
                  <li>Furniture and household items with family history</li>
                  <li>Photographs, letters, and documents</li>
                  <li>Artwork created by or significant to family members</li>
                  <li>Cultural artifacts and treasures</li>
                  <li>Military medals and memorabilia</li>
                  <li>Any item with a story worth preserving for future generations</li>
              </ul>
          </div>
        </div>

          <div className="faq-item">
              <h3>I found a bug in the application. Where can I report it?</h3>
              <div className="faq-answer">
                  <p>
                      As this is a university project, we welcome feedback that helps improve the platform.
                      Please email any bug reports or suggestions to <a href="mailto:support@taongatracker.com">support@taongatracker.com</a>.
                  </p>
              </div>
          </div>

          <div className="faq-item">
              <h3>Will Taonga Tracker be developed further?</h3>
              <div className="faq-answer">
                  <p>
                      As mentioned on our <a href="/about">About page</a>, Taonga Tracker is currently an
                      MVP created for educational purposes. While there are plans for potential future
                      development, these are dependent on the outcome of the university project and
                      subsequent decisions.
                  </p>
              </div>
          </div>
      </div>

        <div className="faq-contact">
            <h3>Didn't find what you were looking for?</h3>
            <p>
                Contact us at <a href="mailto:support@taongatracker.com">support@taongatracker.com</a> with
                any additional questions you may have.
            </p>
        </div>
    </div>
  );
};

export default FAQPage;