import React, { useEffect, useState } from "react";
import "../../styles/user/SettingsPage.css";
import { getFullImageUrl } from "../../services/utils";
import { authAPI, vaultAPI } from "../../services/api";

/**
 * SettingsPage component - user profile and account settings
 */
const SettingsPage = () => {
  const [user, setUser] = useState({
    firstName: "",
    middleNames: "",
    lastName: "",
    userName: "",
    email: "",
    profilePictureUrl: "",
    region: "United States (English)",
    userId: "",
  });
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  useEffect(() => {
    // Fetch user data on component mount
    const fetchUser = async () => {
      try {
        const data = await authAPI.getCurrentUser();
        setUser((prev) => ({
          ...prev,
          ...data,
          profilePictureUrl: data.profilePictureUrl || "",
          userId: data.id || "",
        }));
      } catch {}
    };
    fetchUser();
  }, []);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const data = await vaultAPI.uploadImage(file);
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
      const payload = {
        firstName: user.firstName,
        middleNames: user.middleNames,
        lastName: user.lastName,
        email: user.email,
        profilePictureUrl: user.profilePictureUrl,
        region: user.region,
      };
      await authAPI.updateCurrentUser(payload);
      setUnsavedChanges(false);
      alert("Profile updated!");
    } catch (err) {
      alert("Profile update failed: " + err.message);
    }
  };

  // Direct render without nested layout divs
  return (
    <div className="settings-container">
      <h1 className="settings-title">Account Settings</h1>

      <section className="settings-section-sleek">
        <h2>Profile Details</h2>
        <div className="settings-profile-row">
          <label className="settings-avatar-label" title="Click to upload a new image">
            <div className="settings-avatar-large">
              <img
                src={getFullImageUrl(user.profilePictureUrl)}
                alt="Profile Preview"
              />
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: "none" }}
            />
          </label>
          <div className="settings-profile-fields">
            <div className="form-row">
              <b>First Name:</b>
              <input
                type="text"
                value={user.firstName}
                onChange={e => handleChange("firstName", e.target.value)}
                placeholder="First Name"
              />
            </div>
            <div className="form-row">
              <b>Middle Names:</b>
              <input
                type="text"
                value={user.middleNames}
                onChange={e => handleChange("middleNames", e.target.value)}
                placeholder="Middle Names"
              />
            </div>
            <div className="form-row">
              <b>Last Name:</b>
              <input
                type="text"
                value={user.lastName}
                onChange={e => handleChange("lastName", e.target.value)}
                placeholder="Last Name"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="settings-section-sleek">
        <h2>Account Details</h2>
        <div className="form-row">
          <b>Username:</b>
          <span className="settings-readonly">{user.userName}</span>
        </div>
        <div className="form-row">
          <b>Email:</b>
          <input
            type="email"
            value={user.email}
            onChange={e => handleChange("email", e.target.value)}
            placeholder="Email"
          />
        </div>
        <div className="form-row">
          <b>User ID:</b>
          <span className="settings-readonly">{user.userId}</span>
        </div>
      </section>

      <section className="settings-section-sleek">
        <h2>Preferences</h2>
        <div className="form-row">
          <b>Region:</b>
          <select
            value={user.region}
            onChange={e => handleChange("region", e.target.value)}
          >
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
        <div className="settings-actions">
          <button className="auth-button" onClick={handleSaveChanges}>
            Save Changes
          </button>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
