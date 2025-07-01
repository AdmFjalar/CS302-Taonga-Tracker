import React, { useState } from "react";
import "../../styles/auth/AuthPage.css";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "../../services/api";
import { STORAGE_KEYS } from "../../services/constants";
import { tokenManager, validator, rateLimiter } from "../../services/security";
import { gdprManager } from "../../services/gdpr";

/**
 * LoginPage component handles user authentication.
 * @component
 * @returns {JSX.Element} The login form
 */
const LoginPage = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ emailOrUserName: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Updates form field values when user types
   * @param {Object} e - Input change event
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
    if (error) setError(null); // Clear error when user types
  };

  /**
   * Handle form submission and user login
   * @param {Object} e - Form submit event
   */
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Rate limiting check
      if (!rateLimiter.isAllowed('login', 5, 300000)) { // 5 attempts per 5 minutes
        throw new Error("Too many login attempts. Please try again in 5 minutes.");
      }

      // Validate form
      if (!credentials.emailOrUserName || !credentials.password) {
        throw new Error("Please enter both username/email and password");
      }

      // Sanitize inputs
      const sanitizedCredentials = {
        emailOrUserName: validator.sanitizeInput(credentials.emailOrUserName.trim()),
        password: credentials.password // Don't sanitize password as it may contain special chars
      };

      // Call authentication API
      const data = await authAPI.login(
        sanitizedCredentials.emailOrUserName,
        sanitizedCredentials.password
      );

      // Use secure token management
      tokenManager.setToken(data.token, data.expiresIn || 3600);
      localStorage.setItem(STORAGE_KEYS.USER_ID, data.userId);

      window.dispatchEvent(new CustomEvent('userLogin'));

      // Record GDPR processing activity
      gdprManager.recordProcessingActivity(
        'User login',
        'Contract',
        { userId: data.userId, loginTime: new Date().toISOString() }
      );

      // Give the header component time to update before navigation
      setTimeout(() => {
        navigate("/home");
      }, 100);
    } catch (error) {
      setError(error.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <form className="auth-form" onSubmit={handleLogin}>
        <h1 className="auth-title">Sign In</h1>
        <label htmlFor="emailOrUserName">Username or Email</label>
        <input
          id="emailOrUserName"
          name="emailOrUserName"
          type="text"
          value={credentials.emailOrUserName}
          onChange={handleChange}
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          minLength={8}
          maxLength={64}
          value={credentials.password}
          onChange={handleChange}
          required
        />

        {error && <div className="auth-error">{error}</div>}

        <span className="auth-action-container">
          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
          <Link to="/register" className="auth-link">Don't have an account?</Link>
        </span>
      </form>
    </div>
  );
};

export default LoginPage;