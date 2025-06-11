import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import HomePage from "./components/HomePage";
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";
import HeirloomPage from "./components/HeirloomPage";
import SettingsPage from "./components/SettingsPage";
import Sidebar from "./components/SideBar";
import Header from "./components/Header";
import FamilyTreePage from "./components/FamilyTreePage"; // Import the FamilyTreePage
import "./App.css";

/**
 * Main application component.
 * Renders authentication pages without sidebar/header,
 * and main app pages with sidebar/header.
 */
function App() {
    const location = useLocation();
    const isAuthPage = ["/", "/login", "/register"].includes(location.pathname);

    if (isAuthPage) {
        // Auth pages: no sidebar/header
        return (
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
            </Routes>
        );
    }

    // Main app layout: sidebar and header rendered once
    return (
        <div className="layout">
            <Sidebar />
            <div className="content-wrapper">
                <Header />
                <Routes>
                    <Route path="/home" element={<HomePage />} />
                    <Route path="/heirlooms" element={<HeirloomPage />} />
                    <Route path="/family" element={<FamilyTreePage />} /> {/* Add this line */}
                    <Route path="/settings" element={<SettingsPage />} />
                </Routes>
            </div>
        </div>
    );
}

export default App;