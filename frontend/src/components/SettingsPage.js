import React, { useEffect, useState } from "react";
import "./SettingsPage.css";
import Header from "./Header";
import Sidebar from "./SideBar";

const SettingsPage = () => {
  const [user, setUser] = useState({
    firstName: "",
    lastName: "",
    userName: "",
    email: "",
    password: "",
    region: "United States (English)",
    profileImage: "https://placehold.co/32x32"
  });

  const [unsavedChanges, setUnsavedChanges] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("userInfo");
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);

  const handleRegionChange = (e) => {
    const newRegion = e.target.value;
    const updatedUser = { ...user, region: newRegion };
    setUser(updatedUser);
    setUnsavedChanges(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const updatedUser = { ...user, profileImage: reader.result };
        setUser(updatedUser);
        setUnsavedChanges(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (field, value) => {
    const updatedUser = { ...user, [field]: value };
    setUser(updatedUser);
    setUnsavedChanges(true);
  };

  const handleSaveChanges = () => {
    localStorage.setItem("userInfo", JSON.stringify(user));
    setUnsavedChanges(false);
  };

  return (
    <div className="layout">
      <Sidebar />
      <div className="content-wrapper">
        <Header userImage={user.profileImage} />

        <div className="settings-layout">
          <main className="settings-main">
            <h1>Account Settings</h1>

            <section className="settings-section">
              <h2>Profile Picture</h2>
              <div className="settings-item">
                <div className="avatar-box">
                  <img src={user.profileImage} alt="Profile Preview" className="settings-avatar" />
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
                <strong>Last Name:</strong>
                <input type="text" value={user.lastName} onChange={e => handleChange("lastName", e.target.value)} />
              </div>
              <div className="settings-item"><strong>Username:</strong> {user.userName}</div>
              <div className="settings-item">
                <strong>Email:</strong>
                <input type="email" value={user.email} onChange={e => handleChange("email", e.target.value)} />
              </div>
              <div className="settings-item"><strong>Password:</strong> ********</div>
            </section>

            <section className="settings-section">
              <h2>Region and Language</h2>
              <div className="settings-item">
                <strong>Region:</strong>
                <select value={user.region} onChange={handleRegionChange}>
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
