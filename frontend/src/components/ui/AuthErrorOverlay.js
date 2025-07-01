import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { tokenManager } from "../../services/security";
import { STORAGE_KEYS } from "../../services/constants";
import { getAuthErrorMessage } from "../../services/authErrorUtils";
import "../../styles/ui/AuthErrorOverlay.css";

/**
 * AuthErrorOverlay component - displays when authentication errors occur
 * Automatically redirects to landing page after a delay
 */
const AuthErrorOverlay = ({ error }) => {
  const navigate = useNavigate();
  const message = getAuthErrorMessage(error);

  useEffect(() => {
    // Clear all stored authentication data
    tokenManager.clearToken();
    localStorage.removeItem(STORAGE_KEYS.USER_ID);
    sessionStorage.clear();

    // Dispatch logout events to update header state
    window.dispatchEvent(new CustomEvent("userLogout"));

    // Redirect after 3 seconds
    const timer = setTimeout(() => {
      navigate("/", { replace: true });
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="auth-error-overlay">
      <div className="auth-error-content">
        <h2>Session Expired</h2>
        <p>{message}</p>
        <div className="auth-error-spinner"></div>
      </div>
    </div>
  );
};

export default AuthErrorOverlay;
