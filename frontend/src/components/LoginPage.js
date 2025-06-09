import React from "react";
import "./AuthPage.css";
import { Link, useNavigate } from "react-router-dom";

const LoginPage = () => {
  const navigate = useNavigate();

  const handleLogin = async () => {
  try {
    const payload = {
      emailOrUserName: document.getElementById("username").value,
      password: document.getElementById("password").value,
    };

    const res = await fetch("http://localhost:5240/api/Auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error("Login failed");
    }

    const data = await res.json();
    localStorage.setItem("authToken", data.token);
    navigate("/home");
  } catch (err) {
    alert(err.message);
  }

};
  return (
    <div className="auth-layout">
      <h1 className="auth-title">Taonga Trove</h1>
      <form className="auth-form">
        <label htmlFor="username">Username</label>
        <input id="username" type="text" />

        <label htmlFor="password">Password</label>
        <input id="password" type="password" />

        <Link to="/register" className="auth-link">Sign Up?</Link>

        <button type="button" className="auth-button" onClick={handleLogin}>
          Sign In
        </button>
      </form>
    </div>
  );
};

export default LoginPage;