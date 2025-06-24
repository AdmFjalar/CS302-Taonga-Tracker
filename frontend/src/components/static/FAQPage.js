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

      <div className="faq-intro">
        <p>
          Find answers to the most common questions about Taonga Tracker, how it works,
          and how you can use it to preserve your family heritage.
        </p>
      </div>

      <div className="faq-container">
        <div className="faq-item">
          <h3>What is Taonga Tracker?</h3>
          <div className="faq-answer">
            <p>
              Taonga Tracker is a platform designed to help families document, organize, and
              preserve their heritage items and family connections across generations. It allows
              you to create digital records of your family heirlooms, complete with photos,
              stories, and provenance information.
            </p>
          </div>
        </div>

        <div className="faq-item">
          <h3>Is Taonga Tracker free to use?</h3>
          <div className="faq-answer">
            <p>
              Currently, Taonga Tracker is a university project (CS302) and is available as
              a demonstration. There is no cost associated with using the platform during this
              development phase.
            </p>
          </div>
        </div>

        <div className="faq-item">
          <h3>How secure is my data?</h3>
          <div className="faq-answer">
            <p>
              As stated in our Terms and Conditions, Taonga Tracker is currently a Minimum Viable
              Product (MVP) created for educational purposes. While we implement basic security
              practices, we recommend not storing highly sensitive information at this stage.
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
              After logging in, navigate to the "Heirlooms" section from the sidebar menu.
              Click on the "Add New Item" button and fill out the form with details about your
              heirloom, including photos, description, history, and any known previous owners.
            </p>
          </div>
        </div>

        <div className="faq-item">
          <h3>Can I create a family tree?</h3>
          <div className="faq-answer">
            <p>
              Yes! Taonga Tracker includes a family tree feature that allows you to document your
              family relationships. Navigate to the "Family Tree" section from the sidebar menu
              to add family members and establish relationships between them.
            </p>
          </div>
        </div>

        <div className="faq-item">
          <h3>Can I link heirlooms to family members?</h3>
          <div className="faq-answer">
            <p>
              Absolutely. One of the key features of Taonga Tracker is the ability to connect
              heirlooms with their previous owners in your family tree. This creates a complete
              provenance record that helps preserve the full story of your family treasures.
            </p>
          </div>
        </div>

        <div className="faq-item">
          <h3>Can I share my heirloom information with other family members?</h3>
          <div className="faq-answer">
            <p>
              In the current MVP version, sharing features are limited. However, future updates
              plan to include family sharing capabilities so multiple family members can contribute
              to and view the family collection.
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