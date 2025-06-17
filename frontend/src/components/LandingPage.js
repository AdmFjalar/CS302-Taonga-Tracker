import React from "react";
import { Link } from "react-router-dom";
import "../styles/LandingPage.css";

const LandingPage = () => {
  return (
    <div className="landing-layout">
      <header className="landing-header">
        <h1 className="logo">Taonga Trove</h1>
        <div className="auth-links">
          <Link to="/login" className="signin-link">Sign in</Link>
          <Link to="/register" className="signup-button">Sign up</Link>
        </div>
      </header>

      <main className="landing-main">
        <h2 className="headline">A better way to track heirlooms</h2>
        <p className="subhead">Take pride in your heritage</p>

        <div className="features-bar">
          <span className="feature-pill">Family tree</span>
          <span className="feature-pill">Heirloom archive</span>
          <span className="feature-pill">Secure storage</span>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;