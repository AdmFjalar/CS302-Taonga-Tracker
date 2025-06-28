import React from "react";
import { NavLink } from "react-router-dom";
import "../../styles/ui/SideBar.css";

/**
 * Navigation items configuration for the sidebar
 */
const NAV_ITEMS = [
  { path: "/home", label: "Home Page" },
  { path: "/heirloom", label: "Heirlooms" },
  { path: "/family", label: "Family Tree" },
  { path: "/settings", label: "Settings" }
];

/**
 * Sidebar component providing main navigation for the application.
 * Renders the app title and navigation links.
 * Sign out functionality moved to header dropdown.
 *
 * @component
 * @returns {JSX.Element} The sidebar navigation component
 */
const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-content">
        <nav className="sidebar-nav" aria-label="Main navigation">
          {NAV_ITEMS.map(({ path, label }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
