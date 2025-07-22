import React, { useState, useRef } from 'react';
import '../../styles/static/StaticPage.css';

/**
 * Frequently asked questions page component for user support.
 *
 * @returns {JSX.Element} FAQ page component
 */
const FAQPage = () => {
  const [openQuestions, setOpenQuestions] = useState({});
  const answerRefs = useRef({});

  const toggleQuestion = (index) => {
    setOpenQuestions(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const faqData = [
    {
      question: "What is Taonga Tracker?",
      answer: "Taonga Tracker is a family heritage application for documenting, organizing, and preserving heritage items and family relationships across generations. It creates digital records of family heirlooms with photos, stories, and other information."
    },
    {
      question: "Is Taonga Tracker free to use?",
      answer: "Yes, this is an academic project developed for educational purposes and is completely free to use at this stage. However, please note this is a prototype system and not a commercial product. This may change in the future."
    },
    {
      question: "How do I get started?",
      answer: "Simply create an account by clicking \"Sign Up\" and start adding your family members and heirlooms. You can build your family tree and document your heirlooms with photos and descriptions."
    },
    {
      question: "Is my data secure?",
      answer: "While we implement basic security measures, this is an academic project and may not have commercial-grade security. Please avoid uploading highly sensitive personal information. Data is encrypted in transit, but currently not at rest."
    },
    {
      question: "Can I export my data?",
      answer: "Yes, you can export your family and heirloom data through the settings page. This allows you to download your information in JSON format."
    },
    {
      question: "What file formats are supported for photos?",
      answer: "The application supports common image formats including JPEG, PNG, and WEBP. For best results, use high-quality photos under 5MB in size. Images are subject to denial if they exceed the size limit or are marked as suspicious."
    },
    {
      question: "Can I share my family tree with others?",
      answer: "Currently, this MVP version focuses on individual family documentation. Sharing features may be added in future versions of the project. Fields for sharing currently do not function."
    },
    {
      question: "What happens to my data when the project ends?",
      answer: "As this is an academic project, data storage is temporary. We recommend regularly exporting your data. The project timeline and data retention policies will be communicated as the project progresses."
    },
    {
      question: "Can I delete my account?",
      answer: "Yes, you can delete your account and all associated data through the security settings page. This action is permanent and cannot be undone."
    },
    {
      question: "Who can I contact for support?",
      answer: "For technical support or questions about the project, you can contact the development team through the email provided in the footer of the website."
    }
  ];

  return (
    <div className="static-page">
      <div className="static-content">
        <h1>Frequently Asked Questions</h1>
        <p className="last-updated">Last updated: 2025-07-01</p>

        <div className="faq-intro">
          <p>
            Find answers to the most frequently asked questions about Taonga Tracker,
            how it works, and how it can help you preserve your family heritage.
          </p>
        </div>

        <div className="faq-container">
          {faqData.map((faq, index) => (
            <div key={index} className="faq-item">
              <button
                className={`faq-question ${openQuestions[index] ? 'active' : ''}`}
                onClick={() => toggleQuestion(index)}
                aria-expanded={openQuestions[index]}
              >
                <span className="faq-question-text">{faq.question}</span>
                <span className="faq-toggle-icon">
                  {openQuestions[index] ? '−' : '+'}
                </span>
              </button>
              <div
                className={`faq-answer ${openQuestions[index] ? 'open' : ''}`}
                ref={el => answerRefs.current[index] = el}
                style={{
                  height: openQuestions[index] ? 'auto' : '0',
                  opacity: openQuestions[index] ? '1' : '0'
                }}
              >
                <p>{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>

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

export default FAQPage;