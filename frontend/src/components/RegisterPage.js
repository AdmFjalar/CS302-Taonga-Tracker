import React from "react";
import "./AuthPage.css";
import { Link } from "react-router-dom";

const RegisterPage = () => (
  <div className="auth-layout">
    <h1 className="auth-title">Taonga Trove</h1>
    <form className="auth-form">
      <label>Email</label>
      <input type="email" />

      <label>Username</label>
      <input type="text" />

      <label>Password</label>
      <input type="password" />

      <Link to="/login" className="auth-link">Already have an account?</Link>
      <Link to="/login">
        <button type="button" className="auth-button">Sign Up</button>
      </Link>
    </form>
  </div>
);

export default RegisterPage;