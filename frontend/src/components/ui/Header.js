import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFullImageUrl } from "../../services/utils";
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
                const token = localStorage.getItem("authToken");
                if (!token) return;
                const res = await fetch("http://localhost:5240/api/Auth/me", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setProfilePictureUrl(data.profilePictureUrl || "");
                }
            } catch {
                // Silently fail if fetch fails
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
            <button className="trial-button">Start Free Trial</button>
            <div className="header-icons">
                <span className="icon" aria-label="Messages">💬</span>
                <span className="icon" aria-label="Notifications">🔔</span>
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