import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getFullImageUrl } from "../../services/utils";
import { authAPI } from "../../services/api";
import "../../styles/ui/Header.css";

/**
 * Header component displaying the trial button, icons, and user avatar.
 * Clicking the avatar navigates to the settings page.
 * @component
 */
const Header = () => {
    const [profilePictureUrl, setProfilePictureUrl] = useState("");
    const navigate = useNavigate();

    // Fetch user profile picture on mount
    useEffect(() => {
        const fetchUser = async () => {
            try {
                // Using authAPI service instead of direct fetch
                const data = await authAPI.getCurrentUser();
                setProfilePictureUrl(data.profilePictureUrl || "");
            } catch (error) {
                // Silently fail if fetch fails
                console.log("Failed to fetch user profile:", error);
            }
        };
        fetchUser();
    }, []);

    /**
     * Handles avatar click to navigate to the settings page.
     */
    const handleAvatarClick = () => {
        navigate("/settings");
    };

    return (
        <header className="header">
            <h1 className="logo"><Link to="/home">Taonga Tracker</Link></h1>
            <div className="header-icons">
                {/*<span className="icon" aria-label="Messages">💬</span>*/}
                {/*<span className="icon" aria-label="Notifications">🔔</span>*/}
                <img
                    src={getFullImageUrl(profilePictureUrl)}
                    alt="User Avatar"
                    className="avatar"
                    onClick={handleAvatarClick}
                    style={{ cursor: "pointer" }}
                />
            </div>
        </header>
    );
};

export default Header;