import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/static/StaticPage.css';

/**
 * Sitemap page component displaying all available navigation links and pages.
 *
 * @returns {JSX.Element} Sitemap page component
 */
const SitemapPage = () => {
  return (
    <div className="static-page">
      <div className="static-content">
        <h1>Sitemap</h1>
        <p className="last-updated">Last updated: 2025-06-28</p>
        <p>Find all pages and features available on Taonga Tracker:</p>
        
        <div className="sitemap-section">
          <h2>Main Pages</h2>
          <ul className="sitemap-list">
            <li><Link to="/" className="sitemap-link">Home <span className="sitemap-description">- Welcome page and overview</span></Link></li>
            <li><Link to="/login" className="sitemap-link">Login <span className="sitemap-description">- Sign in to your account</span></Link></li>
            <li><Link to="/register" className="sitemap-link">Register <span className="sitemap-description">- Create a new account</span></Link></li>
          </ul>
        </div>

        <div className="sitemap-section">
          <h2>User Dashboard</h2>
          <ul className="sitemap-list">
            <li><Link to="/home" className="sitemap-link">Dashboard <span className="sitemap-description">- Main user dashboard with statistics</span></Link></li>
            <li><Link to="/settings" className="sitemap-link">Settings <span className="sitemap-description">- Account settings and preferences</span></Link></li>
            <li><Link to="/security" className="sitemap-link">Security <span className="sitemap-description">- Security settings and privacy controls</span></Link></li>
          </ul>
        </div>

        <div className="sitemap-section">
          <h2>Family Management</h2>
          <ul className="sitemap-list">
            <li><Link to="/family" className="sitemap-link">Family Tree <span className="sitemap-description">- Interactive family tree visualization</span></Link></li>
          </ul>
        </div>

        <div className="sitemap-section">
          <h2>Heirloom Collection</h2>
          <ul className="sitemap-list">
            <li><Link to="/heirloom" className="sitemap-link">Heirloom Collection <span className="sitemap-description">- View and manage your heirlooms</span></Link></li>
          </ul>
        </div>

        <div className="sitemap-section">
          <h2>Information Pages</h2>
          <ul className="sitemap-list">
            <li><Link to="/about" className="sitemap-link">About <span className="sitemap-description">- About Taonga Tracker and the project</span></Link></li>
            <li><Link to="/faq" className="sitemap-link">FAQ <span className="sitemap-description">- Frequently asked questions</span></Link></li>
            <li><Link to="/terms" className="sitemap-link">Terms & Conditions <span className="sitemap-description">- Terms of use</span></Link></li>
            <li><Link to="/privacy" className="sitemap-link">Privacy Policy <span className="sitemap-description">- Privacy policy and data handling</span></Link></li>
            <li><Link to="/sitemap" className="sitemap-link">Sitemap <span className="sitemap-description">- This page</span></Link></li>
          </ul>
        </div>

        <div className="sitemap-section">
          <h2>Key Features</h2>
          <ul className="sitemap-list">
            <li><span className="sitemap-feature">Family Tree Visualization <span className="sitemap-description">- Interactive family member connections</span></span></li>
            <li><span className="sitemap-feature">Heirloom Documentation <span className="sitemap-description">- Photo and story preservation</span></span></li>
            <li><span className="sitemap-feature">Secure User Accounts <span className="sitemap-description">- Personal data protection</span></span></li>
            <li><span className="sitemap-feature">Data Export <span className="sitemap-description">- Download your family heritage data</span></span></li>
            <li><span className="sitemap-feature">GDPR Compliance <span className="sitemap-description">- Privacy controls and consent management</span></span></li>
          </ul>
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

export default SitemapPage;
