import React, { useEffect, useState } from "react";
import "./SettingsPage.css";
import Header from "./Header";
import Sidebar from "./SideBar";

const getFullImageUrl = (relativePath) => {
  const backendUrl = "http://localhost:5240";
  if (!relativePath) return "https://placehold.co/32x32";
  return `${backendUrl}${relativePath}`;
};

const SettingsPage = () => {
  const [user, setUser] = useState({
    firstName: "",
    middleNames: "",
    lastName: "",
    userName: "",
    email: "",
    profilePictureUrl: "",
    region: "United States (English)",
  });
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const res = await fetch("http://localhost:5240/api/Auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUser((prev) => ({
            ...prev,
            ...data,
            profilePictureUrl: data.profilePictureUrl || "",
          }));
        }
      } catch {}
    };
    fetchUser();
  }, []);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      try {
        const token = localStorage.getItem("authToken");
        const res = await fetch("http://localhost:5240/api/vaultitem/upload-image", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        if (!res.ok) throw new Error("Failed to upload image");
        const data = await res.json();
        setUser((prev) => ({
          ...prev,
          profilePictureUrl: data.url,
        }));
        setUnsavedChanges(true);
      } catch (err) {
        alert("Image upload failed: " + err.message);
      }
    }
  };

  const handleChange = (field, value) => {
    setUser((prev) => ({ ...prev, [field]: value }));
    setUnsavedChanges(true);
  };

  const handleSaveChanges = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const payload = {
        firstName: user.firstName,
        middleNames: user.middleNames,
        lastName: user.lastName,
        email: user.email,
        profilePictureUrl: user.profilePictureUrl,
      };
      const res = await fetch("http://localhost:5240/api/Auth/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      setUnsavedChanges(false);
      alert("Profile updated!");
    } catch (err) {
      alert("Profile update failed: " + err.message);
    }
  };

  return (
      <div className="layout">
        <Sidebar />
        <div className="content-wrapper">
          <Header userImage={getFullImageUrl(user.profilePictureUrl)} />
          <div className="settings-layout">
            <main className="settings-main">
              <h1>Account Settings</h1>
              <section className="settings-section">
                <h2>Profile Picture</h2>
                <div className="settings-item">
                  <div className="avatar-box">
                    <img
                        src={getFullImageUrl(user.profilePictureUrl)}
                        alt="Profile Preview"
                        className="settings-avatar"
                    />
                  </div>
                  <input type="file" accept="image/*" onChange={handleImageChange} />
                </div>
              </section>
              <section className="settings-section">
                <h2>Account Information</h2>
                <div className="settings-item">
                  <strong>First Name:</strong>
                  <input type="text" value={user.firstName} onChange={e => handleChange("firstName", e.target.value)} />
                </div>
                <div className="settings-item">
                  <strong>Middle Names:</strong>
                  <input type="text" value={user.middleNames} onChange={e => handleChange("middleNames", e.target.value)} />
                </div>
                <div className="settings-item">
                  <strong>Last Name:</strong>
                  <input type="text" value={user.lastName} onChange={e => handleChange("lastName", e.target.value)} />
                </div>
                <div className="settings-item"><strong>Username:</strong> {user.userName}</div>
                <div className="settings-item">
                  <strong>Email:</strong>
                  <input type="email" value={user.email} onChange={e => handleChange("email", e.target.value)} />
                </div>
              </section>
              <section className="settings-section">
                <h2>Region and Language</h2>
                <div className="settings-item">
                  <strong>Region:</strong>
                  <select value={user.region} onChange={e => handleChange("region", e.target.value)}>
                    <option>United States (English)</option>
                    <option>United Kingdom (English)</option>
                    <option>Canada (English)</option>
                    <option>New Zealand (English)</option>
                    <option>Australia (English)</option>
                    <option>Norway (English)</option>
                    <option>Sweden (English)</option>
                  </select>
                </div>
              </section>
              {unsavedChanges && (
                  <div className="save-button-container">
                    <button className="auth-button" onClick={handleSaveChanges}>Save Changes</button>
                  </div>
              )}
            </main>
          </div>
        </div>
      </div>
  );
};

export default SettingsPage;