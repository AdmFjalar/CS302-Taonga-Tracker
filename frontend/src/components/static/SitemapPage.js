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
            <li><Link to="/">Home</Link> - Welcome page and overview</li>
            <li><Link to="/login">Login</Link> - Sign in to your account</li>
            <li><Link to="/register">Register</Link> - Create a new account</li>
          </ul>
        </div>

        <div className="sitemap-section">
          <h2>User Dashboard</h2>
          <ul className="sitemap-list">
            <li><Link to="/home">Dashboard</Link> - Main user dashboard with statistics</li>
            <li><Link to="/settings">Settings</Link> - Account settings and preferences</li>
            <li><Link to="/security">Security</Link> - Security settings and privacy controls</li>
          </ul>
        </div>

        <div className="sitemap-section">
          <h2>Family Management</h2>
          <ul className="sitemap-list">
            <li><Link to="/family">Family Tree</Link> - Interactive family tree visualization</li>
          </ul>
        </div>

        <div className="sitemap-section">
          <h2>Heirloom Collection</h2>
          <ul className="sitemap-list">
            <li><Link to="/heirloom">Heirloom Collection</Link> - View and manage your heirlooms</li>
          </ul>
        </div>

        <div className="sitemap-section">
          <h2>Information Pages</h2>
          <ul className="sitemap-list">
            <li><Link to="/about">About</Link> - About Taonga Tracker and the project</li>
            <li><Link to="/faq">FAQ</Link> - Frequently asked questions</li>
            <li><Link to="/terms">Terms & Conditions</Link> - Terms of use</li>
            <li><Link to="/privacy">Privacy Policy</Link> - Privacy policy and data handling</li>
            <li><Link to="/sitemap">Sitemap</Link> - This page</li>
          </ul>
        </div>

        <div className="sitemap-section">
          <h2>Key Features</h2>
          <ul className="sitemap-list">
            <li>Family Tree Visualization - Interactive family member connections</li>
            <li>Heirloom Documentation - Photo and story preservation</li>
            <li>Secure User Accounts - Personal data protection</li>
            <li>Data Export - Download your family heritage data</li>
            <li>GDPR Compliance - Privacy controls and consent management</li>
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
