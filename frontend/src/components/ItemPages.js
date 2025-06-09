import React, { useState, useEffect } from "react";
import "./ItemPages.css";
import "./CreateItemPage.css";

// Define the default structure for a new item, aligning with VaultItemDto
const currentUserId = localStorage.getItem("userId") || ""; // Default to logged-in user's ID
const defaultItem = {
  vaultItemId: "0", // Default new item ID
  currentOwnerId: currentUserId, // Current user ID
  currentOwnerUserId: currentUserId, // Current user ID
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

// CreateItemPage Component
export function CreateItemPage({ onSave, initialItem }) {
  const [item, setItem] = useState(initialItem || defaultItem);
  const [activeTab, setActiveTab] = useState("general");

  useEffect(() => {
    if (initialItem) {
      setItem(initialItem); // Populate fields if editing an existing item
    } else {
      setItem((prev) => ({
        ...prev,
        currentOwnerId: currentUserId,
        currentOwnerUserId: currentUserId,
        vaultItemId: "0", // Ensure item ID defaults to 0
      }));
    }
  }, [initialItem]);

  const handleChange = (field, value) => {
    setItem((prev) => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field, value) => {
    const arrayValue = value.split(",").map((v) => v.trim());
    setItem((prev) => ({ ...prev, [field]: arrayValue }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:5240/api/Heirlooms/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setItem((prev) => ({ ...prev, photoUrl: data.imageUrl }));
    } catch (err) {
      alert("Image upload failed");
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("authToken");

      if (!token) {
        alert("You must be logged in to create an heirloom.");
        return;
      }

      const response = await fetch("http://localhost:5240/api/vaultitem", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(item),
      });

      if (!response.ok) {
        throw new Error("Failed to save the heirloom");
      }

      const data = await response.json();
      alert("Heirloom successfully created!");
      onSave(data);
    } catch (error) {
      console.error("Error creating heirloom:", error.message);
      alert("Failed to save the heirloom. Please try again.");
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
                    value={item.materials.join(", ")}
                    onChange={(e) => handleArrayChange("materials", e.target.value)}
                />
              </div>
              <div className="form-row">
                <b>Craft Type (comma-separated):</b>
                <input
                    placeholder="e.g., handmade, machine-crafted"
                    value={item.craftType.join(", ")}
                    onChange={(e) => handleArrayChange("craftType", e.target.value)}
                />
              </div>
              <div className="form-row">
                <b>Creator ID:</b>
                <input
                    value={item.creatorId || ""}
                    onChange={(e) => handleChange("creatorId", e.target.value)}
                />
              </div>
              <div className="form-row">
                <b>Shared With IDs (comma-separated):</b>
                <input
                    placeholder="e.g., user1, user2"
                    value={item.sharedWithIds.join(", ")}
                    onChange={(e) =>
                        handleArrayChange("sharedWithIds", e.target.value)
                    }
                />
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
        </div>

        <div className="item-header">
          <img
              src={item.photoUrl || "https://placehold.co/275"}
              alt="Item Preview"
          />
          <div className="form-row">
            <b>Upload Image:</b>
            <input type="file" accept="image/*" onChange={handleImageUpload} />
          </div>
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

// ViewItemPage Component
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
          src={item.photoUrl || "https://placehold.co/275"}
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

      {/* Details Box */}
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

      {/* Metadata Tooltip */}
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