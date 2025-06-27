import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/ui/AuthHeader.css';

/**
 * AuthHeader component - Header used on landing page and public pages
 * 
 * @param {Object} props Component props
 * @param {boolean} props.showAuthButtons Whether to show the sign in/sign up buttons (default: true)
 * @returns {JSX.Element} The AuthHeader component
 */
const AuthHeader = ({ showAuthButtons = true }) => {
  return (
    <header className="landing-header">
      <h1 className="logo"><Link to={"/"}>Taonga Tracker</Link></h1>
      {showAuthButtons && (
        <div className="auth-links">
          <Link to="/login" className="signin-link">Sign in</Link>
          <Link to="/register" className="signup-button">Sign up</Link>
        </div>
      )}
    </header>
  );
};

export default AuthHeader;
