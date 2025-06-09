import React, { useState, useEffect, useRef } from "react";
import "./ItemPages.css";
import "./CreateItemPage.css";

const currentUserId = localStorage.getItem("userId") || "";
const defaultItem = {
  vaultItemId: "0",
  currentOwnerId: currentUserId,
  currentOwnerUserId: currentUserId,
  title: "",
  creatorId: null,
  previousOwnerIds: [],
  estimatedValue: null,
  creationDate: null,
  dateAcquired: null,
  creationPlace: "",
  itemType: "",
  photoUrl: "",
  description: "",
  materials: [],
  craftType: [],
  sharedWithIds: [],
};

const getFullImageUrl = (relativePath) => {
  const backendUrl = "http://localhost:5240";
  if (!relativePath) return null;
  return `${backendUrl}${relativePath}`;
};

function toDateInputValue(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

const toYMD = (d) => (!d ? null : d);

// Helper to auto-insert a space after comma
const autoSpaceComma = (value) => value.replace(/,([^ ])/g, ", $1");

export function CreateItemPage({ onSave, initialItem, navigateTo }) {
  const [item, setItem] = useState({ ...defaultItem });
  const [activeTab, setActiveTab] = useState("general");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const [materialsInput, setMaterialsInput] = useState("");
  const [craftTypeInput, setCraftTypeInput] = useState("");
  const [sharedWithInput, setSharedWithInput] = useState("");

  // User suggestion state for "Share with"
  const [userSuggestions, setUserSuggestions] = useState([]);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionBoxRef = useRef(null);

  useEffect(() => {
    if (initialItem && initialItem.vaultItemId && initialItem.vaultItemId !== "0") {
      setItem({
        ...defaultItem,
        ...initialItem,
        creationDate: toDateInputValue(initialItem.creationDate),
        dateAcquired: toDateInputValue(initialItem.dateAcquired),
      });
      setMaterialsInput((initialItem.materials || []).join(", "));
      setCraftTypeInput((initialItem.craftType || []).join(", "));
      setSharedWithInput((initialItem.sharedWithIds || []).join(", "));
    } else {
      setItem({ ...defaultItem });
      setMaterialsInput("");
      setCraftTypeInput("");
      setSharedWithInput("");
    }
  }, [initialItem]);

  const handleChange = (field, value) => {
    setItem((prev) => ({ ...prev, [field]: value }));
  };

  const handleArrayBlur = (field, value) => {
    const arrayValue = value.split(",").map((v) => v.trim()).filter(Boolean);
    setItem((prev) => ({ ...prev, [field]: arrayValue }));
  };

  // --- Share with: user search/autocomplete logic ---

  // Helper: get last email being typed
  const getLastEntry = (input) => {
    const parts = input.split(",");
    return parts[parts.length - 1].trim();
  };

  // Fetch user suggestions by email
  const fetchUserSuggestions = async (query) => {
    if (!query) {
      setUserSuggestions([]);
      return;
    }
    setSuggestionLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`http://localhost:5240/api/auth/search-users?q=${encodeURIComponent(query)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      if (res.ok) {
        const users = await res.json();
        setUserSuggestions(users);
      } else {
        setUserSuggestions([]);
      }
    } catch {
      setUserSuggestions([]);
    }
    setSuggestionLoading(false);
  };

  // Handle input change for Share with
  const handleSharedWithInputChange = (e) => {
    const value = autoSpaceComma(e.target.value);
    setSharedWithInput(value);
    const last = getLastEntry(value);
    if (last.length > 4) {
      fetchUserSuggestions(last);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      setUserSuggestions([]);
    }
  };

  // Handle suggestion click (insert email)
  const handleSuggestionClick = (email) => {
    const parts = sharedWithInput.split(",");
    parts[parts.length - 1] = ` ${email}`;
    const newValue = parts.join(",").replace(/^ /, "");
    setSharedWithInput(autoSpaceComma(newValue));
    setShowSuggestions(false);
    setUserSuggestions([]);
  };

  // Hide suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionBoxRef.current && !suggestionBoxRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    setUploadError("");

    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("User is not authenticated. Please log in.");

      const res = await fetch("http://localhost:5240/api/vaultitem/upload-image", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to upload image");

      const data = await res.json();
      setItem((prev) => ({ ...prev, photoUrl: data.url }));
      alert("Image uploaded successfully!");
    } catch (err) {
      setUploadError(err.message);
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    const updatedItem = {
      ...item,
      materials: materialsInput.split(",").map((v) => v.trim()).filter(Boolean),
      craftType: craftTypeInput.split(",").map((v) => v.trim()).filter(Boolean),
      sharedWithIds: sharedWithInput.split(",").map((v) => v.trim()).filter(Boolean),
    };
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        alert("You must be logged in to save the heirloom.");
        return;
      }
      const isNew = updatedItem.vaultItemId === "0";
      const url = isNew
          ? "http://localhost:5240/api/vaultitem"
          : `http://localhost:5240/api/vaultitem/${updatedItem.vaultItemId}`;
      const method = isNew ? "POST" : "PUT";

      const payload = {
        ...updatedItem,
        creationDate: toYMD(updatedItem.creationDate),
        dateAcquired: toYMD(updatedItem.dateAcquired),
      };

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(isNew ? "Failed to create the heirloom" : "Failed to update the heirloom");

      const data = await response.json();
      alert(isNew ? "Heirloom successfully created!" : "Heirloom successfully updated!");
      onSave(data);
      if (navigateTo) navigateTo("/home");
    } catch (error) {
      console.error("Error saving heirloom:", error.message);
      alert(error.message);
    }
  };

  const handleDelete = async () => {
    if (!item.vaultItemId || item.vaultItemId === "0") return;
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        alert("You must be logged in to delete the heirloom.");
        return;
      }
      const url = `http://localhost:5240/api/vaultitem/${item.vaultItemId}`;
      const response = await fetch(url, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to delete the heirloom");
      alert("Heirloom deleted.");
      if (navigateTo) navigateTo("/home");
    } catch (error) {
      console.error("Error deleting heirloom:", error.message);
      alert(error.message);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "general":
        return (
            <div className="form-section">
              <div className="form-row">
                <b>Title:</b>
                <input
                    value={item.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                />
              </div>
              <div className="form-row">
                <b>Description:</b>
                <textarea
                    value={item.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                />
              </div>
              <div className="form-row">
                <b>Image:</b>
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                />
                {uploading && <p>Uploading image...</p>}
                {uploadError && <p className="error-text">{uploadError}</p>}
              </div>
              {item.photoUrl && (
                  <div className="form-row">
                    <b>Current Image:</b>
                    <img
                        src={getFullImageUrl(item.photoUrl)}
                        alt="Uploaded"
                        style={{ maxWidth: "200px", border: "1px solid #000" }}
                    />
                  </div>
              )}
            </div>
        );
      case "details":
        return (
            <div className="form-section">
              <div className="form-row">
                <b>Estimated Value:</b>
                <input
                    type="number"
                    value={item.estimatedValue || ""}
                    onChange={(e) =>
                        handleChange("estimatedValue", parseFloat(e.target.value))
                    }
                />
              </div>
              <div className="form-row">
                <b>Creation Date:</b>
                <input
                    type="date"
                    value={item.creationDate || ""}
                    onChange={(e) => handleChange("creationDate", e.target.value)}
                />
              </div>
              <div className="form-row">
                <b>Date Acquired:</b>
                <input
                    type="date"
                    value={item.dateAcquired || ""}
                    onChange={(e) => handleChange("dateAcquired", e.target.value)}
                />
              </div>
              <div className="form-row">
                <b>Creation Place:</b>
                <input
                    value={item.creationPlace}
                    onChange={(e) => handleChange("creationPlace", e.target.value)}
                />
              </div>
              <div className="form-row">
                <b>Item Type:</b>
                <input
                    value={item.itemType}
                    onChange={(e) => handleChange("itemType", e.target.value)}
                />
              </div>
            </div>
        );
      case "additional":
        return (
            <div className="form-section">
              <div className="form-row">
                <b>Materials (comma-separated):</b>
                <input
                    placeholder="e.g., wood, metal"
                    value={materialsInput}
                    onChange={(e) => setMaterialsInput(autoSpaceComma(e.target.value))}
                    onBlur={(e) => handleArrayBlur("materials", e.target.value)}
                />
              </div>
              <div className="form-row">
                <b>Craft Type (comma-separated):</b>
                <input
                    placeholder="e.g., handmade, machine-crafted"
                    value={craftTypeInput}
                    onChange={(e) => setCraftTypeInput(autoSpaceComma(e.target.value))}
                    onBlur={(e) => handleArrayBlur("craftType", e.target.value)}
                />
              </div>
              <div className="form-row" style={{ position: "relative" }}>
                <b>Share with (comma-separated):</b>
                <input
                    placeholder="e.g., alice@example.com, bob@example.com"
                    value={sharedWithInput}
                    onChange={handleSharedWithInputChange}
                    onBlur={(e) => handleArrayBlur("sharedWithIds", e.target.value)}
                    autoComplete="off"
                />
                {showSuggestions && userSuggestions.length > 0 && (
                    <div
                        className="suggestion-box"
                        ref={suggestionBoxRef}
                        style={{
                          position: "absolute",
                          background: "#fff",
                          border: "1px solid #ccc",
                          zIndex: 10,
                          left: 0,
                          right: 0,
                          top: "100%",
                        }}
                    >
                      {suggestionLoading ? (
                          <div className="suggestion-item">Loading...</div>
                      ) : (
                          userSuggestions.map((user) => (
                              <div
                                  key={user.email}
                                  className="suggestion-item"
                                  style={{
                                    padding: "4px 8px",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                  }}
                                  onMouseDown={() => handleSuggestionClick(user.email)}
                              >
                                <img
                                    src={user.profilePictureUrl ? getFullImageUrl(user.profilePictureUrl) : "https://placehold.co/24x24"}
                                    alt="profile"
                                    style={{
                                      width: 24,
                                      height: 24,
                                      borderRadius: "50%",
                                      objectFit: "cover",
                                      objectPosition: "center",
                                      background: "#e3e7d3",
                                      flexShrink: 0,
                                    }}
                                />
                                <span>{user.email}</span>
                                {user.username && (
                                    <span style={{ color: "#888", marginLeft: 8 }}>
        ({user.username})
      </span>
                                )}
                              </div>
                          ))                      )}
                    </div>
                )}
              </div>
            </div>
        );
      default:
        return null;
    }
  };

  return (
      <div className="item-layout top-aligned">
        <div className="item-toolbar">
          <button onClick={handleSave} className="auth-button">
            Save Heirloom
          </button>
          {item.vaultItemId && item.vaultItemId !== "0" && (
              <button onClick={handleDelete} className="auth-button delete">
                Delete
              </button>
          )}
        </div>
        <div className="tabs">
          <div className="tab-buttons">
            <button
                className={activeTab === "general" ? "active" : ""}
                onClick={() => setActiveTab("general")}
            >
              General
            </button>
            <button
                className={activeTab === "details" ? "active" : ""}
                onClick={() => setActiveTab("details")}
            >
              Details
            </button>
            <button
                className={activeTab === "additional" ? "active" : ""}
                onClick={() => setActiveTab("additional")}
            >
              Additional
            </button>
          </div>
          {renderTabContent()}
        </div>
      </div>
  );
}

export function ViewItemPage({ item, onBack, onEdit }) {
  return (
      <div className="item-layout top-aligned">
        <div className="item-toolbar">
          <button onClick={onEdit} className="auth-button">
            Edit
          </button>
          <button onClick={onBack} className="auth-button">
            Back
          </button>
        </div>
        <div className="item-header">
          <img
              src={getFullImageUrl(item.photoUrl) || "https://placehold.co/275"}
              alt="Item Preview"
          />
          <div className="item-meta">
            <div className="form-row">
              <b>Title:</b> <span>{item.title}</span>
            </div>
            <div className="form-row">
              <b>Description:</b>{" "}
              <span>{item.description || "No description available."}</span>
            </div>
          </div>
        </div>
        <div className="details-box">
          <div className="form-row">
            <b>Estimated Value:</b> <span>{item.estimatedValue || "N/A"}</span>
          </div>
          <div className="form-row">
            <b>Creation Date:</b> <span>{item.creationDate || "N/A"}</span>
          </div>
          <div className="form-row">
            <b>Date Acquired:</b> <span>{item.dateAcquired || "N/A"}</span>
          </div>
          <div className="form-row">
            <b>Creation Place:</b> <span>{item.creationPlace || "N/A"}</span>
          </div>
          <div className="form-row">
            <b>Item Type:</b> <span>{item.itemType || "N/A"}</span>
          </div>
          <div className="form-row">
            <b>Materials:</b> <span>{item.materials?.join(", ") || "N/A"}</span>
          </div>
          <div className="form-row">
            <b>Craft Type:</b> <span>{item.craftType?.join(", ") || "N/A"}</span>
          </div>
        </div>
        <div className="metadata-tooltip">
          <span className="metadata-link">Metadata</span>
          <div className="tooltip-text">
            <p>
              <b>Vault Item ID:</b> {item.vaultItemId || "N/A"}
            </p>
            <p>
              <b>Current Owner ID:</b> {item.currentOwnerId || "N/A"}
            </p>
            <p>
              <b>Creator ID:</b> {item.creatorId || "N/A"}
            </p>
            <p>
              <b>Previous Owner IDs:</b>{" "}
              {item.previousOwnerIds && item.previousOwnerIds.length > 0
                  ? item.previousOwnerIds.join(", ")
                  : "N/A"}
            </p>
            <p>
              <b>Shared With IDs:</b>{" "}
              {item.sharedWithIds && item.sharedWithIds.length > 0
                  ? item.sharedWithIds.join(", ")
                  : "N/A"}
            </p>
          </div>
        </div>
      </div>
  );
}