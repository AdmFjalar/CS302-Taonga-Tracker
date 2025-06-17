import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import HomePage from "./components/user/HomePage";
import LoginPage from "./components/auth/LoginPage";
import RegisterPage from "./components/auth/RegisterPage";
import HeirloomPage from "./components/heirloom/HeirloomPage";
import SettingsPage from "./components/user/SettingsPage";
import Sidebar from "./components/ui/SideBar";
import Header from "./components/ui/Header";
import FamilyTreePage from "./components/family/FamilyTreePage";
import "./App.css";

/**
 * Main application component.
 * Renders authentication pages without sidebar/header,
 * and main app pages with sidebar/header.
 *
 * @returns {JSX.Element} The app component
 */
function App() {
    const location = useLocation();
    const isAuthPage = ["/", "/login", "/register"].includes(location.pathname);

    if (isAuthPage) {
        // Authentication pages: no sidebar/header
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
                    <Route path="/heirloom" element={<HeirloomPage />} />
                    <Route path="/family" element={<FamilyTreePage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                </Routes>
            </div>
        </div>
    );
}

export default App;