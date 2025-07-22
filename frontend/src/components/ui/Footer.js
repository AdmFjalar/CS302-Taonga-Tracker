import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/ui/Footer.css';

/**
 * Application footer component with links and contact information.
 *
 * @returns {JSX.Element} Footer component
 */
const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h4>Taonga Tracker</h4>
          <i>Preserving family heritage and heirlooms for generations to come.</i>
        </div>
        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/faq">FAQ</Link></li>
            <li><Link to="/terms">Terms &amp; Conditions</Link></li>
            <li><Link to="/privacy">Privacy Policy</Link></li>
            <li><Link to="/sitemap">Sitemap</Link></li>
          </ul>
        </div>
        <div className="footer-section">
          <h4>Contact</h4>
          <p>Email: <Link to="mailto:support@taongatracker.com">support@taongatracker.com</Link></p>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {currentYear} Taonga Tracker. All rights reserved. | <Link to="/terms">Terms of Use</Link></p>
      </div>
    </footer>
  );
};

export default Footer;
