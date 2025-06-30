import React, { useState, useEffect } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import HomePage from "./components/user/HomePage";
import LoginPage from "./components/auth/LoginPage";
import RegisterPage from "./components/auth/RegisterPage";
import HeirloomPage from "./components/heirloom/HeirloomPage";
import SettingsPage from "./components/user/SettingsPage";
import SecuritySettings from "./components/user/SecuritySettings";
import Header from "./components/ui/Header";
import Footer from "./components/ui/Footer";
import CookieConsent from "./components/ui/CookieConsent";
import SignOutScreen from "./components/ui/SignOutScreen";
import FamilyTreePage from "./components/family/FamilyTreePage";
import AboutPage from "./components/static/AboutPage";
import TermsPage from "./components/static/TermsPage";
import FAQPage from "./components/static/FAQPage";
import PrivacyPage from "./components/static/PrivacyPage";
import SitemapPage from "./components/static/SitemapPage";
import { STORAGE_KEYS } from "./services/constants";
import "./App.css";

/**
 * Main application component that handles routing and layout structure.
 * Provides different layouts based on authentication state and page requirements.
 *
 * @returns {JSX.Element} The main application component
 */
function App() {
    const location = useLocation();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isSigningOut, setIsSigningOut] = useState(false);

    // Monitor authentication state on route changes
    useEffect(() => {
        const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        setIsLoggedIn(!!token);
    }, [location.pathname]);

    // Handle sign out process with loading screen
    useEffect(() => {
        const handleSignOut = () => setIsSigningOut(true);
        const handleSignOutComplete = () => {
            setIsSigningOut(false);
            setIsLoggedIn(false);
        };

        window.addEventListener('userSigningOut', handleSignOut);
        window.addEventListener('userSignOutComplete', handleSignOutComplete);

        return () => {
            window.removeEventListener('userSigningOut', handleSignOut);
            window.removeEventListener('userSignOutComplete', handleSignOutComplete);
        };
    }, []);

    if (isSigningOut) {
        return <SignOutScreen />;
    }

    // Define page categories for layout determination
    const alwaysAuthPages = ["/login", "/register"];
    const conditionalPages = ["/about", "/terms", "/faq"];

    const isAlwaysAuthPage = alwaysAuthPages.includes(location.pathname);
    const isConditionalAuthPage = conditionalPages.includes(location.pathname);
    const isRootPath = location.pathname === "/";

    // Determine layout: auth layout for unauthenticated users on specific pages
    const showAuthLayout = isAlwaysAuthPage ||
                          (isConditionalAuthPage && !isLoggedIn) ||
                          (isRootPath && !isLoggedIn);

    if (showAuthLayout) {
        return (
            <div className="auth-page-container">
                <Header />
                <div className="auth-content">
                    <Routes>
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route path="/about" element={<AboutPage />} />
                        <Route path="/terms" element={<TermsPage />} />
                        <Route path="/faq" element={<FAQPage />} />
                        <Route path="/privacy" element={<PrivacyPage />} />
                        <Route path="/sitemap" element={<SitemapPage />} />
                    </Routes>
                </div>
                <Footer />
                <CookieConsent />
            </div>
        );
    }

    // Main authenticated user layout
    return (
        <div className="layout">
            <Header />
            <div className="content-wrapper">
                <Routes>
                    <Route path="/" element={<Navigate to="/home" replace />} />
                    <Route path="/home" element={<HomePage />} />
                    <Route path="/heirloom" element={<HeirloomPage />} />
                    <Route path="/family" element={<FamilyTreePage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/security" element={<SecuritySettings />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/terms" element={<TermsPage />} />
                    <Route path="/faq" element={<FAQPage />} />
                    <Route path="/privacy" element={<PrivacyPage />} />
                    <Route path="/sitemap" element={<SitemapPage />} />
                </Routes>
                <Footer />
            </div>
            <CookieConsent />
        </div>
    );
}

export default App;