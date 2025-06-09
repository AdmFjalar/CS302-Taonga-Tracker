import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Header.css";

const getFullImageUrl = (relativePath) => {
    const backendUrl = "http://localhost:5240";
    if (!relativePath) return "https://placehold.co/32x32";
    return `${backendUrl}${relativePath}`;
};

const Header = () => {
    const [profilePictureUrl, setProfilePictureUrl] = useState("");
    const navigate = useNavigate();

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
            } catch {}
        };
        fetchUser();
    }, []);

    return (
        <header className="header">
            <button className="trial-button">Start Free Trial</button>
            <div className="header-icons">
                <span className="icon">💬</span>
                <span className="icon">🔔</span>
                <img
                    src={getFullImageUrl(profilePictureUrl)}
                    alt="User Avatar"
                    className="avatar"
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate("/settings")}
                />
            </div>
        </header>
    );
};

export default Header;