import React, { useState, useEffect } from "react";
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
  const [passwordErrors, setPasswordErrors] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });
  const [formValid, setFormValid] = useState(false);

  // Effect to check form validity whenever password errors change
  useEffect(() => {
    const isPasswordValid = Object.values(passwordErrors).every(Boolean);
    setFormValid(
      formData.userName &&
      formData.email &&
      formData.firstName &&
      formData.lastName &&
      formData.password &&
      isPasswordValid
    );
  }, [formData, passwordErrors]);

  /**
   * Updates form field values when user types
   * @param {Object} e - Input change event
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Validate password on change
    if (name === "password") {
      validatePassword(value);
    }

    if (error) setError(null); // Clear error when user types
  };

  /**
   * Validates the password against requirements
   * @param {string} password - The password to validate
   * @returns {boolean} True if password meets all requirements
   */
  const validatePassword = (password) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password)
    };

    setPasswordErrors(requirements);

    return Object.values(requirements).every(Boolean);
  };

  /**
   * Handle form submission and user registration
   * @param {Object} e - Form submit event
   */
  const handleRegister = async (e) => {
    e.preventDefault();

    // Force validation on submit
    const isPasswordValid = validatePassword(formData.password);

    // Field validation
    if (!formData.userName) {
      setError("Username is required");
      return;
    }
    if (!formData.email) {
      setError("Email is required");
      return;
    }
    if (!formData.password) {
      setError("Password is required");
      return;
    }
    if (!formData.firstName) {
      setError("First name is required");
      return;
    }
    if (!formData.lastName) {
      setError("Last name is required");
      return;
    }

    // Final password validation check - make sure all password requirements are met
    if (!Object.values(passwordErrors).every(Boolean)) {
      setError("Your password must include: 8+ characters, uppercase & lowercase letters, numbers, and special characters");
      return;
    }

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
      <form className="auth-form" onSubmit={handleRegister}>
        <h1 className="auth-title">Sign Up</h1>
        <span>
          <label htmlFor="email">Email</label>
          <small className="required-field-hint">* Required field</small>
        </span>
        <input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          disabled={loading}
          autoComplete="email"
          required
        />

        <span>
          <label htmlFor="userName">Username</label>
          <small className="required-field-hint">* Required field</small>
        </span>
        <input
          id="userName"
          name="userName"
          type="text"
          value={formData.userName}
          onChange={handleChange}
          disabled={loading}
          autoComplete="username"
          required
        />

        <span>
          <label htmlFor="firstName">First Name</label>
          <small className="required-field-hint">* Required field</small>
        </span>
          <input
            id="firstName"
            name="firstName"
            type="text"
            value={formData.firstName}
            onChange={handleChange}
            disabled={loading}
            autoComplete="given-name"
            required
        />
        <span>
          <label htmlFor="lastName">Last Name</label>
          <small className="required-field-hint">* Required field</small>
        </span>
          <input
            id="lastName"
            name="lastName"
            type="text"
            value={formData.lastName}
            onChange={handleChange}
            disabled={loading}
            autoComplete="family-name"
            required
        />

        <span>
          <label htmlFor="password">Password</label>
          <small className="required-field-hint">* Required field</small>
        </span>
          <input
          id="password"
          name="password"
          type="password"
          minLength={8}
          maxLength={64}
          value={formData.password}
          onChange={handleChange}
          disabled={loading}
          autoComplete="new-password"
          required
        />

        <div className="password-requirements">
          <p>Password must include:</p>
          <ul>
            <li className={passwordErrors.length ? "met" : ""}>At least 8 characters</li>
            <li className={passwordErrors.uppercase ? "met" : ""}>At least one uppercase letter</li>
            <li className={passwordErrors.lowercase ? "met" : ""}>At least one lowercase letter</li>
            <li className={passwordErrors.number ? "met" : ""}>At least one number</li>
            <li className={passwordErrors.special ? "met" : ""}>At least one special character</li>
          </ul>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <span className="auth-action-container">
          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
          <Link to="/login" className="auth-link">Already have an account?</Link>
        </span>
      </form>
    </div>
  );
};

export default RegisterPage;
