import React from "react";
import "./SideBar.css";
import { useNavigate, NavLink } from "react-router-dom";

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
          <NavLink
            to="/"
            className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
          >
            Home Page
          </NavLink>
          <NavLink
            to="/heirlooms"
            className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
          >
            Heirlooms
          </NavLink>
          <NavLink
            to="/family"
            className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
          >
            Family Tree
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
          >
            Settings
          </NavLink>
        </nav>
      </div>
      <button className="signout-button" onClick={handleSignOut}>Sign Out</button>
    </aside>
  );
};

export default Sidebar;


