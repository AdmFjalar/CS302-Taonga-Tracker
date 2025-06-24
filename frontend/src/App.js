import React, { useState, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import HomePage from "./components/user/HomePage";
import LoginPage from "./components/auth/LoginPage";
import RegisterPage from "./components/auth/RegisterPage";
import HeirloomPage from "./components/heirloom/HeirloomPage";
import SettingsPage from "./components/user/SettingsPage";
import Sidebar from "./components/ui/SideBar";
import Header from "./components/ui/Header";
import Footer from "./components/ui/Footer";
import AuthHeader from "./components/ui/AuthHeader";
import FamilyTreePage from "./components/family/FamilyTreePage";
import AboutPage from "./components/static/AboutPage";
import TermsPage from "./components/static/TermsPage";
import FAQPage from "./components/static/FAQPage";
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
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // Check if user is logged in
    useEffect(() => {
        const token = localStorage.getItem('token');
        setIsLoggedIn(!!token);
    }, []);

    // Pages that always show auth layout regardless of login status
    const alwaysAuthPages = ["/", "/login", "/register"];

    // Pages that show auth layout when not logged in, but main layout when logged in
    const conditionalPages = ["/about", "/terms", "/faq"];

    const isAlwaysAuthPage = alwaysAuthPages.includes(location.pathname);
    const isConditionalAuthPage = conditionalPages.includes(location.pathname);
    const isLoginOrRegister = ["/login", "/register"].includes(location.pathname);

    // For login/register pages, or for conditional pages when not logged in
    const showAuthLayout = isAlwaysAuthPage || (isConditionalAuthPage && !isLoggedIn);

    // Only show auth header on certain pages
    const showAuthHeader = showAuthLayout;

    if (showAuthLayout) {
        // Authentication pages layout
        return (
            <div className="auth-page-container">
                {showAuthHeader && (
                    <AuthHeader showAuthButtons={!isLoginOrRegister} />
                )}
                <div className="auth-content">
                    <Routes>
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route path="/about" element={<AboutPage />} />
                        <Route path="/terms" element={<TermsPage />} />
                        <Route path="/faq" element={<FAQPage />} />
                    </Routes>
                </div>
                <Footer />
            </div>
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
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/terms" element={<TermsPage />} />
                    <Route path="/faq" element={<FAQPage />} />
                </Routes>
                <Footer />
            </div>
        </div>
    );
}

export default App;