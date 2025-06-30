import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import LoadingScreen from "../ui/LoadingScreen";
import Button from "../shared/Button";
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  useEffect(() => {
    // Fetch user data on component mount
    const fetchUser = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await authAPI.getCurrentUser();
        setUser((prev) => ({
          ...prev,
          ...data,
          profilePictureUrl: data.profilePictureUrl || "",
          userId: data.id || "",
        }));
      } catch (err) {
        setError("Failed to load user settings");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        setUploading(true);
        setUploadError(null);
        const data = await vaultAPI.uploadImage(file);
        setUser((prev) => ({
          ...prev,
          profilePictureUrl: data.url,
        }));
        setUnsavedChanges(true);
      } catch (err) {
        setUploadError("Image upload failed: " + err.message);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleChange = (field, value) => {
    setUser((prev) => ({ ...prev, [field]: value }));
    setUnsavedChanges(true);
  };

  const handleSaveChanges = async () => {
    try {
      setSaving(true);
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
    } finally {
      setSaving(false);
    }
  };

  // Show loading screen while fetching user data
  if (loading) {
    return <LoadingScreen message="Loading your settings..." />;
  }

  // Show error state
  if (error) {
    return (
      <div className="error-container">
        <h2>Error Loading Settings</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  const actions = [
    ...(unsavedChanges ? [
      <Button
        key="save"
        variant="primary"
        onClick={handleSaveChanges}
        disabled={saving}
      >
        {saving ? "Saving..." : "Save Changes"}
      </Button>
    ] : [])
  ];

  return (
    <div className="standard-modal-container settings-modal">
      {/* Header section with photo and title */}
      <div className="standard-modal-header">
        <div className="standard-modal-photo-container rectangular">
          {uploading ? (
            <label className="standard-modal-photo-upload" title="Click to upload a new image">
              <img
                src={getFullImageUrl(user.profilePictureUrl)}
                alt="Profile Picture"
                className="standard-modal-photo"
              />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={uploading}
                style={{ display: "none" }}
              />
            </label>
          ) : (
            <label className="standard-modal-photo-upload" title="Click to upload a new image">
              <img
                src={getFullImageUrl(user.profilePictureUrl)}
                alt="Profile Picture"
                className="standard-modal-photo"
              />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: "none" }}
              />
            </label>
          )}
          {uploading && <p className="standard-modal-uploading">Uploading...</p>}
          {uploadError && <p className="standard-modal-error">{uploadError}</p>}
        </div>

        <div className="standard-modal-primary-info">
          <div className="standard-modal-title-container">
            <h2 className="standard-modal-title">
              {`${user.firstName} ${user.lastName}`.trim() || user.userName || "User Profile"}
            </h2>
          </div>

          {/* Username and Email - clickable to copy */}
          <div className="standard-modal-subtitle-info">
            <h5
              className="copyable-field"
              onClick={() => navigator.clipboard.writeText(user.userName)}
              title="Click to copy username"
            >
              {user.userName}
            </h5>
            <h5
              className="copyable-field"
              onClick={() => navigator.clipboard.writeText(user.email)}
              title="Click to copy email"
            >
              {user.email}
            </h5>
          </div>
        </div>
      </div>

      {/* Content section */}
      <div className="standard-modal-content">
        {/* Profile Details Section */}
        <div className="standard-modal-section">
          <h3 className="standard-section-title">Profile Details</h3>
          <div className="standard-modal-details-grid">
            <div className="standard-field-row">
              <div className="standard-field-label">First Name</div>
              <input
                type="text"
                className="standard-field-input"
                value={user.firstName}
                onChange={e => handleChange("firstName", e.target.value)}
                placeholder="First Name"
              />
            </div>

            <div className="standard-field-row">
              <div className="standard-field-label">Middle Names</div>
              <input
                type="text"
                className="standard-field-input"
                value={user.middleNames}
                onChange={e => handleChange("middleNames", e.target.value)}
                placeholder="Middle Names"
              />
            </div>

            <div className="standard-field-row">
              <div className="standard-field-label">Last Name</div>
              <input
                type="text"
                className="standard-field-input"
                value={user.lastName}
                onChange={e => handleChange("lastName", e.target.value)}
                placeholder="Last Name"
              />
            </div>
          </div>
        </div>

        {/* Account Details Section */}
        <div className="standard-modal-section">
          <h3 className="standard-section-title">Account Details</h3>
          <div className="standard-modal-details-grid">
            <div className="standard-field-row">
              <div className="standard-field-label">Username</div>
              <div className="standard-field-value readonly">{user.userName}</div>
            </div>

            <div className="standard-field-row">
              <div className="standard-field-label">Email</div>
              <input
                type="email"
                className="standard-field-input"
                value={user.email}
                onChange={e => handleChange("email", e.target.value)}
                placeholder="Email"
              />
            </div>

            <div className="standard-field-row">
              <div className="standard-field-label">User ID</div>
              <div className="standard-field-value readonly">{user.userId}</div>
            </div>
          </div>
        </div>

        {/* Preferences Section */}
        <div className="standard-modal-section">
          <h3 className="standard-section-title">Preferences</h3>
          <div className="standard-modal-details-grid">
            <div className="standard-field-row">
              <div className="standard-field-label">Region</div>
              <select
                className="standard-field-input"
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
          </div>
        </div>

        {/* Security Settings Navigation */}
        <div className="standard-modal-section">
          <h3 className="standard-section-title">Security & Privacy</h3>
          <div className="standard-modal-details-grid">
            <div className="standard-field-row">
              <Link to="/security">
                <Button variant="outline">
                  Security Settings
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Actions section */}
      {actions && (
        <div className="standard-modal-actions">
          {actions}
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
