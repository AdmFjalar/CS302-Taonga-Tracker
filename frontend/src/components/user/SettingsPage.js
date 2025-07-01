import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import LoadingScreen from "../ui/LoadingScreen";
import AuthErrorOverlay from "../ui/AuthErrorOverlay";
import StandardModal from "../shared/StandardModal";
import Button from "../shared/Button";
import "../../styles/shared/StandardModal.css";
import { getFullImageUrl } from "../../services/utils";
import { authAPI, vaultAPI } from "../../services/api";
import { tokenManager } from "../../services/security";
import { STORAGE_KEYS } from "../../services/constants";
import { isAuthError } from "../../services/authErrorUtils";

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
  const navigate = useNavigate();

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
        setError(err.message || err.toString());
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
        setSaving(true);
        const data = await vaultAPI.uploadImage(file);
        setUser((prev) => ({
          ...prev,
          profilePictureUrl: data.url,
        }));
        setUnsavedChanges(true);
      } catch (err) {
        alert("Image upload failed: " + err.message);
      } finally {
        setSaving(false);
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

      // Dispatch event to update header profile picture
      window.dispatchEvent(new CustomEvent("profileUpdated"));

      alert("Profile updated!");
    } catch (err) {
      alert("Profile update failed: " + err.message);
    }
  };

  // Show loading screen while fetching user data
  if (loading) {
    return <LoadingScreen message="Loading your settings..." />;
  }

  // Show error state
  if (error) {
    // Check if this is an authentication error message
    if (isAuthError(error)) {
      return <AuthErrorOverlay error={error} />;
    }

    return (
      <div className="error-container">
        <h2>Error Loading Settings</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <StandardModal
      title="Account Settings"
      photo={getFullImageUrl(user.profilePictureUrl)}
      photoAlt={`${user.firstName} ${user.lastName}`}
      photoShape="rectangular"
      isEdit={true}
      onPhotoUpload={handleImageChange}
      uploading={saving}
      actions={
        <div className="settings-actions">
          {unsavedChanges && (
            <Button onClick={handleSaveChanges} variant="primary" disabled={saving}>
              Save Changes
            </Button>
          )}
          <Link to="/security">
            <Button variant="secondary">Security Settings</Button>
          </Link>
        </div>
      }
    >
      <div className="standard-form-row name-inputs">
        <input
          type="text"
          className="standard-modal-title editable"
          value={user.firstName}
          onChange={(e) => handleChange("firstName", e.target.value)}
          placeholder="First Name"
          disabled={saving}
        />
        <input
          type="text"
          className="standard-modal-title editable"
          value={user.lastName}
          onChange={(e) => handleChange("lastName", e.target.value)}
          placeholder="Last Name"
          disabled={saving}
        />
      </div>
      <div className="standard-form-row">
        <input
          type="text"
          className="standard-modal-description editable"
          value={user.middleNames}
          onChange={(e) => handleChange("middleNames", e.target.value)}
          placeholder="Middle Names"
          disabled={saving}
        />
      </div>

      {/* Profile Details */}
      <div className="standard-modal-details-grid">
        <div className="standard-field-row">
          <div className="standard-field-label">Email:</div>
          <input
            className="standard-field-input"
            type="email"
            value={user.email}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="Email address"
            disabled={saving}
          />
        </div>
        <div className="standard-field-row">
          <div className="standard-field-label">Username:</div>
          <div className="standard-field-value">{user.userName}</div>
        </div>
        <div className="standard-field-row">
          <div className="standard-field-label">Region:</div>
          <select
            className="standard-field-input"
            value={user.region}
            onChange={(e) => handleChange("region", e.target.value)}
            disabled={saving}
          >
            <option value="United States (English)">United States (English)</option>
            <option value="United Kingdom (English)">United Kingdom (English)</option>
            <option value="Canada (English)">Canada (English)</option>
            <option value="Australia (English)">Australia (English)</option>
            <option value="New Zealand (English)">New Zealand (English)</option>
          </select>
        </div>
      </div>
    </StandardModal>
  );
};

export default SettingsPage;
