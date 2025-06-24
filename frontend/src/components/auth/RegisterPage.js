import React, { useState } from "react";
import "../../styles/auth/AuthPage.css";
import { useNavigate, Link } from "react-router-dom";
import { authAPI } from "../../services/api";

/**
 * RegisterPage component handles new user registration.
 * @component
 * @returns {JSX.Element} The registration form
 */
const RegisterPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    userName: "",
    email: "",
    password: "",
    firstName: "",
    lastName: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Updates form field values when user types
   * @param {Object} e - Input change event
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null); // Clear error when user types
  };

  /**
   * Validates the registration form
   * @returns {boolean} True if form is valid, false otherwise
   */
  const validateForm = () => {
    if (!formData.userName) {
      setError("Username is required");
      return false;
    }
    if (!formData.email) {
      setError("Email is required");
      return false;
    }
    if (!formData.password) {
      setError("Password is required");
      return false;
    }
    if (!formData.firstName) {
      setError("First name is required");
      return false;
    }
    if (!formData.lastName) {
      setError("Last name is required");
      return false;
    }
    return true;
  };

  /**
   * Handle form submission and user registration
   * @param {Object} e - Form submit event
   */
  const handleRegister = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      // Call registration API
      await authAPI.register(formData);

      // Redirect to login page on success
      navigate("/login");
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <h1 className="auth-title">Sign Up</h1>

      <form className="auth-form" onSubmit={handleRegister}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          disabled={loading}
          autoComplete="email"
        />

        <label htmlFor="userName">Username</label>
        <input
          id="userName"
          name="userName"
          type="text"
          value={formData.userName}
          onChange={handleChange}
          disabled={loading}
          autoComplete="username"
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          disabled={loading}
          autoComplete="new-password"
        />

        <label htmlFor="firstName">First Name</label>
        <input
          id="firstName"
          name="firstName"
          type="text"
          value={formData.firstName}
          onChange={handleChange}
          disabled={loading}
          autoComplete="given-name"
        />

        <label htmlFor="lastName">Last Name</label>
        <input
          id="lastName"
          name="lastName"
          type="text"
          value={formData.lastName}
          onChange={handleChange}
          disabled={loading}
          autoComplete="family-name"
        />

        {error && <div className="auth-error">{error}</div>}

        <Link to="/login" className="auth-link">Already have an account?</Link>
        <button
          type="submit"
          className="auth-button"
          disabled={loading}
        >
          {loading ? "Creating Account..." : "Sign Up"}
        </button>
      </form>
    </div>
  );
};

export default RegisterPage;
