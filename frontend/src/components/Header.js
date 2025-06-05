import React from "react";
import "./Header.css";

const Header = ({ userImage }) => (
  <header className="header">
    <button className="trial-button">Start Free Trial</button>
    <div className="header-icons">
      <span className="icon">💬</span>
      <span className="icon">🔔</span>
      <img
        src={userImage || "https://placehold.co/32x32"}
        alt="User Avatar"
        className="avatar"
      />
    </div>
  </header>
);
export default Header;