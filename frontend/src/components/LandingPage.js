import React from "react";
import { Link } from "react-router-dom";
import "../styles/LandingPage.css";

const LandingPage = () => {
  return (
    <div className="landing-layout">

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