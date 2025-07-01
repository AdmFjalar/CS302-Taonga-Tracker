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
  { path: "/home", label: "Home" }, // Added Home link
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

        const handleLogin = async () => {
            console.log("Login event received, updating header state...");
            setIsLoggingOut(false);
            await new Promise(resolve => setTimeout(resolve, 50));
            await checkAuthAndFetchUser();
        };

        const handleProfileUpdate = async () => {
            await checkAuthAndFetchUser();
        };

        const handleStorageChange = (e) => {
            if (e.key === STORAGE_KEYS.AUTH_TOKEN) {
                if (e.newValue) {
                    checkAuthAndFetchUser();
                } else {
                    setIsLoggingOut(true);
                    setIsAuthenticated(false);
                    setIsLoading(false);
                }
            }
        };

        const handleLogout = () => {
            console.log("Logout event received, updating header state...");
            setIsLoggingOut(true);
            setIsAuthenticated(false);
            setIsLoading(false);
        };

        window.addEventListener("storage", handleStorageChange);
        window.addEventListener("userLogin", handleLogin);
        window.addEventListener("profileUpdated", handleProfileUpdate);
        window.addEventListener("userLogout", handleLogout);

        return () => {
            window.removeEventListener("storage", handleStorageChange);
            window.removeEventListener("userLogin", handleLogin);
            window.removeEventListener("profileUpdated", handleProfileUpdate);
            window.removeEventListener("userLogout", handleLogout);
        };
    }, []);

    /**
     * Handles sign out with a proper loading screen and controlled navigation
     */
    const handleSignOut = async () => {
        try {
            window.dispatchEvent(new CustomEvent('userSigningOut'));

            securityLogger.logSecurityEvent('user_logout', {
                method: 'header_dropdown',
                timestamp: new Date().toISOString()
            }, 'low');

            await new Promise(resolve => setTimeout(resolve, 200));

            tokenManager.clearToken();

            sessionStorage.clear();

            await new Promise(resolve => setTimeout(resolve, 300));

            window.dispatchEvent(new CustomEvent('userSignOutComplete'));

            setTimeout(() => {
                navigate("/", { replace: true });
            }, 50);

        } catch (error) {
            console.error('Error during sign out:', error);
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
                // Show authentication buttons and About Us dropdown for unauthenticated users
                <div className="auth-links">
                    <div className="about-dropdown" tabIndex={0}>
                        <span className="about-link">About Us ▾</span>
                        <div className="about-dropdown-menu">
                            <Link to="/about" className="dropdown-item">About Page</Link>
                            <Link to="/heirloom" className="dropdown-item">Heirlooms</Link>
                            <Link to="/family" className="dropdown-item">Family Tree</Link>
                            <Link to="/login" className="dropdown-item">Sign in</Link>
                            <Link to="/register" className="dropdown-item">Sign up</Link>
                        </div>
                    </div>
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
