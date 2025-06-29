import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/static/StaticPage.css';

/**
 * SitemapPage component displaying all available pages and navigation links
 * @returns {JSX.Element} The sitemap page
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
          <h2>Family Tree</h2>
          <ul className="sitemap-list">
            <li><Link to="/family">Family Tree</Link> - Interactive family tree visualization</li>
          </ul>
        </div>

        <div className="sitemap-section">
          <h2>Heirloom Collection</h2>
          <ul className="sitemap-list">
            <li><Link to="/heirloom">Heirloom Vault</Link> - View and manage your family heirlooms</li>
          </ul>
        </div>

        <div className="sitemap-section">
          <h2>User Settings</h2>
          <ul className="sitemap-list">
            <li><Link to="/settings">Account Settings</Link> - Manage your profile and preferences</li>
          </ul>
        </div>

        <div className="sitemap-section">
          <h2>Information Pages</h2>
          <ul className="sitemap-list">
            <li><Link to="/about">About Us</Link> - Learn about Taonga Tracker</li>
            <li><Link to="/faq">FAQ</Link> - Frequently asked questions</li>
            <li><Link to="/terms">Terms & Conditions</Link> - Terms of service</li>
            <li><Link to="/privacy">Privacy Policy</Link> - How we protect your data</li>
            <li><Link to="/sitemap">Sitemap</Link> - This page</li>
          </ul>
        </div>

        <div className="sitemap-note">
          <p><em>Note: Some pages require you to be logged in to access them.</em></p>
        </div>
      </div>
    </div>
  );
};

export default SitemapPage;
