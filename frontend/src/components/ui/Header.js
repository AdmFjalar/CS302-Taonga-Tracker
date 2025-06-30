import React, { useEffect, useState } from "react";
import { Link, useNavigate, NavLink } from "react-router-dom";
import { getFullImageUrl } from "../../services/utils";
import { authAPI } from "../../services/api";
import { STORAGE_KEYS } from "../../services/constants";
import { tokenManager } from "../../services/security";
import { securityLogger } from "../../services/securityMonitoring";
import "../../styles/ui/Header.css";

/**
 * Navigation items configuration (moved from sidebar)
 */
const NAV_ITEMS = [
  { path: "/heirloom", label: "Heirlooms" },
  { path: "/family", label: "Family Tree" }
];

/**
 * Consolidated Header component that displays:
 * - Sign in/Sign up buttons when unauthenticated
 * - Navigation links and user avatar with dropdown menu when authenticated
 * Uses AuthHeader styling for consistent appearance.
 * @component
 */
const Header = () => {
    const [profilePictureUrl, setProfilePictureUrl] = useState("");
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [dropdownAnimating, setDropdownAnimating] = useState(false);
    const navigate = useNavigate();

    // Check authentication status and fetch user profile on mount
    useEffect(() => {
        const checkAuthAndFetchUser = async () => {
            // Skip authentication check if we're in the process of logging out
            if (isLoggingOut) {
                setIsAuthenticated(false);
                setIsLoading(false);
                return;
            }

            try {
                // Check if user has auth token
                const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

                if (token) {
                    // Try to fetch user profile to verify token validity
                    const data = await authAPI.getCurrentUser();
                    setProfilePictureUrl(data.profilePictureUrl || "");
                    setIsAuthenticated(true);
                } else {
                    setIsAuthenticated(false);
                }
            } catch (error) {
                // If fetch fails, user is not authenticated
                console.log("User not authenticated or token invalid:", error);
                setIsAuthenticated(false);
                // Clear invalid token
                localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuthAndFetchUser();

        // Listen for login events to update state immediately
        const handleLogin = () => {
            checkAuthAndFetchUser();
        };

        // Listen for profile picture updates
        const handleProfileUpdate = () => {
            checkAuthAndFetchUser();
        };

        // Listen for logout events to update state immediately
        const handleStorageChange = (e) => {
            if (e.key === STORAGE_KEYS.AUTH_TOKEN) {
                if (e.newValue) {
                    // Token added - user logged in
                    checkAuthAndFetchUser();
                } else {
                    // Token removed - user logged out
                    setIsLoggingOut(true);
                    setIsAuthenticated(false);
                    setIsLoading(false);
                }
            }
        };

        window.addEventListener("storage", handleStorageChange);
        window.addEventListener("userLogin", handleLogin);
        window.addEventListener("profileUpdated", handleProfileUpdate);

        // Custom event listener for same-tab logout
        const handleLogout = () => {
            setIsLoggingOut(true);
            setIsAuthenticated(false);
            setIsLoading(false);
        };

        window.addEventListener("userLogout", handleLogout);

        return () => {
            window.removeEventListener("storage", handleStorageChange);
            window.removeEventListener("userLogin", handleLogin);
            window.removeEventListener("profileUpdated", handleProfileUpdate);
            window.removeEventListener("userLogout", handleLogout);
        };
    }, [isLoggingOut]);

    /**
     * Handles sign out with a proper loading screen and controlled navigation
     */
    const handleSignOut = async () => {
        try {
            // Dispatch sign out start event to show loading screen
            window.dispatchEvent(new CustomEvent('userSigningOut'));

            // Log the logout event for security monitoring
            securityLogger.logSecurityEvent('user_logout', {
                method: 'header_dropdown',
                timestamp: new Date().toISOString()
            }, 'low');

            // Wait a brief moment to ensure loading screen is shown
            await new Promise(resolve => setTimeout(resolve, 200));

            // Use secure token management to clear all auth data
            tokenManager.clearToken();

            // Clear any additional session data
            sessionStorage.clear();

            // Brief processing time
            await new Promise(resolve => setTimeout(resolve, 300));

            // Dispatch sign out complete event to hide loading screen and navigate
            window.dispatchEvent(new CustomEvent('userSignOutComplete'));

            // Navigate to landing page after a brief delay
            setTimeout(() => {
                navigate("/", { replace: true });
            }, 50);

        } catch (error) {
            console.error('Error during sign out:', error);
            // Fallback: force clear everything and navigate
            localStorage.clear();
            sessionStorage.clear();
            window.dispatchEvent(new CustomEvent('userSignOutComplete'));
            window.location.href = "/";
        }
    };

    /**
     * Handles navigation to settings page.
     */
    const handleSettingsClick = () => {
        setShowDropdown(false);
        navigate("/settings");
    };

    /**
     * Handles showing the dropdown with animation protection
     */
    const handleShowDropdown = () => {
        setShowDropdown(true);
        setDropdownAnimating(true);
        // Allow animation to complete before enabling hover events
        setTimeout(() => {
            setDropdownAnimating(false);
        }, 250); // Slightly longer than the 200ms animation
    };

    /**
     * Handles hiding the dropdown
     */
    const handleHideDropdown = () => {
        // Don't hide if still animating
        if (!dropdownAnimating) {
            setShowDropdown(false);
        }
    };

    // Show loading state briefly (but not during logout)
    if (isLoading && !isLoggingOut) {
        return (
            <header className="landing-header">
                <h1 className="logo">
                    <Link to="/">Taonga Tracker</Link>
                </h1>
            </header>
        );
    }

    return (
        <header className="landing-header">
            <h1 className="logo">
                <Link to={isAuthenticated ? "/home" : "/"}>Taonga Tracker</Link>
            </h1>

            {isAuthenticated && !isLoggingOut ? (
                // Show authenticated user interface with navigation and dropdown
                <div className="header-content">
                    <nav className="header-nav" aria-label="Main navigation">
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

                    <div className="header-icons">
                        <div
                            className="avatar-dropdown"
                            onMouseEnter={handleShowDropdown}
                            onMouseLeave={handleHideDropdown}
                        >
                            <img
                                src={getFullImageUrl(profilePictureUrl)}
                                alt="User Avatar"
                                className="avatar"
                                style={{ cursor: "pointer" }}
                            />

                            {showDropdown && (
                                <div
                                    className="dropdown-menu"
                                    onMouseEnter={handleShowDropdown}
                                    onMouseLeave={handleHideDropdown}
                                >
                                    <button
                                        className="dropdown-item settings-item"
                                        onClick={handleSettingsClick}
                                    >
                                        <span className="dropdown-icon">⚙️</span>
                                        Settings
                                    </button>
                                    <button
                                        className="dropdown-item sign-out-item"
                                        onClick={handleSignOut}
                                    >
                                        <span className="dropdown-icon">🚪</span>
                                        Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                // Show authentication buttons for unauthenticated users
                <div className="auth-links">
                    <Link to="/login" className="signin-link">
                        Sign in
                    </Link>
                    <Link to="/register" className="signup-button">
                        Sign up
                    </Link>
                </div>
            )}
        </header>
    );
};

export default Header;

