import React from "react";
import { Link } from "react-router-dom";
import "../styles/LandingPage.css";

const LandingPage = () => {
  return (
    <div className="landing-layout">

      <main className="landing-main">
        <h2 className="headline">A better way to remember where you've come from.</h2>
        <p className="subhead">Preserve your heritage for future generations.</p>

        <div className="features-bar">
          <span className="feature-pill">Family tree</span>
          <span className="feature-pill">Heirloom archive</span>
          <span className="feature-pill">Secure storage</span>
          <Link to="/register" className="signup-button">Create an account for free</Link>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;