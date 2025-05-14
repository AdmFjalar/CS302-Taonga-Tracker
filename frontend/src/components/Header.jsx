import React from "react";
import { Button } from "@/components/ui/button";
import "./Header.css"; 

const Header = () => (
  <header className="header">
    <Button className="trial-button">
      Start Free Trial
    </Button>
    <div className="header-icons">
      <span className="icon">💬</span>
      <span className="icon">🔔</span>
      <img
        src="https://placehold.co/32x32"
        alt="User Avatar"
        className="avatar"
      />
    </div>
  </header>
);

export default Header;