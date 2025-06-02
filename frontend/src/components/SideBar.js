import React from "react";
import "./SideBar.css";
import { useNavigate, Link } from "react-router-dom";

const Sidebar = () => {
  const navigate = useNavigate();

  const handleSignOut = () => {
    console.log("Clicked Sign Out");
    navigate("/login");
  };

  return (
    <aside className="sidebar">
      <div>
        <h1 className="sidebar-title">Taonga Trove</h1>
        <nav className="sidebar-nav">
          <Link to="/" className="nav-link-active">Home Page</Link>
          <Link to="/" className="nav-link-active">Heirlooms</Link>
          <Link to="/" className="nav-link-active">Family Tree</Link>
          <Link to="/" className="nav-link-active">Settings</Link>
        </nav>
      </div>
      <button className="signout-button" onClick={handleSignOut}>Sign Out</button>
    </aside>
  );
};

export default Sidebar;
