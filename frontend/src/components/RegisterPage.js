import React, { useState } from "react";
import "./AuthPage.css";
import { useNavigate, Link } from "react-router-dom";

const RegisterPage = () => {
  const [form, setForm] = useState({
    userName: "",
    email: "",
    password: "",
    firstName: "",
    lastName: ""
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

const handleRegister = async () => {
  try {
    const payload = { ...form };
  
    const res = await fetch("http://localhost:5240/api/Auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error("Registration failed");
    }

    navigate("/login");
  } catch (err) {
    alert(err.message);
  }
};

  return (
    <div className="auth-layout">
      <h1 className="auth-title">Taonga Trove</h1>
      <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
        <label>Email</label>
        <input name="email" type="email" value={form.email} onChange={handleChange} />

        <label>Username</label>
        <input name="userName" type="text" value={form.userName} onChange={handleChange} />

        <label>Password</label>
        <input name="password" type="password" value={form.password} onChange={handleChange} />

        <label>First Name</label>
        <input name="firstName" type="text" value={form.firstName} onChange={handleChange} />

        <label>Last Name</label>
        <input name="lastName" type="text" value={form.lastName} onChange={handleChange} />

        <Link to="/login" className="auth-link">Already have an account?</Link>
        <button type="button" className="auth-button" onClick={handleRegister}>
          Sign Up
        </button>
      </form>
    </div>
  );
};

export default RegisterPage;
