import React from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { STORAGE_KEYS } from "../../services/constants";
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
 * Renders the app title, navigation links, and sign out button.
 *
 * @component
 * @returns {JSX.Element} The sidebar navigation component
 */
const Sidebar = () => {
  const navigate = useNavigate();

  /**
   * Handles sign out by clearing local storage and redirecting to landing page
   */
  const handleSignOut = () => {
    // Clear auth token and any other stored data
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_ID);

    // Redirect to landing page
    navigate("/");
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-content">
        <h1 className="sidebar-title">Taonga Trove</h1>
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
      <button
        className="signout-button"
        onClick={handleSignOut}
        aria-label="Sign out of your account"
      >
        Sign Out
      </button>
    </aside>
  );
};

export default Sidebar;
