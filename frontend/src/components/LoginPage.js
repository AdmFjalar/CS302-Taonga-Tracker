import React from "react";
import "./AuthPage.css";
import { Link } from "react-router-dom";

const LoginPage = () => (
  <div className="auth-layout">
    <h1 className="auth-title">Taonga Trove</h1>
    <form className="auth-form">
      <label>Username</label>
      <input type="text" />
      <label>Password</label>
      <input type="password" />
      <Link to="/register" className="auth-link">Sign Up?</Link>
      <Link to="/">
        <button type="button" className="auth-button">Sign In</button>
      </Link>
    </form>
  </div>
);

export default LoginPage;
