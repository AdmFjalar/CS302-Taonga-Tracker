import React, { useState, useEffect, useRef } from "react";
import { getFullImageUrl, toDateInputValue, autoSpaceComma } from "./utils";
import "./CreateItemPage.css";

const defaultItem = {
    vaultItemId: "0",
    currentOwnerId: localStorage.getItem("userId") || "",
    currentOwnerUserId: localStorage.getItem("userId") || "",
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

const ItemEdit = ({ onSave, initialItem, navigateTo }) => {
    const [item, setItem] = useState(initialItem || defaultItem);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState("");
    const [materialsInput, setMaterialsInput] = useState("");
    const [craftTypeInput, setCraftTypeInput] = useState("");
    const [sharedWithInput, setSharedWithInput] = useState("");
    const [userSuggestions, setUserSuggestions] = useState([]);
    const [suggestionLoading, setSuggestionLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const suggestionBoxRef = useRef(null);

    useEffect(() => {
        if (initialItem) {
            setItem({ ...defaultItem, ...initialItem });
            setMaterialsInput((initialItem.materials || []).join(", "));
            setCraftTypeInput((initialItem.craftType || []).join(", "));
            setSharedWithInput((initialItem.sharedWithIds || []).join(", "));
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
    const getLastEntry = (input) => {
        const parts = input.split(",");
        return parts[parts.length - 1].trim();
    };

    const fetchUserSuggestions = async (query) => {
        if (!query) {
            setUserSuggestions([]);
            return;
        }
        setSuggestionLoading(true);
        try {
            const token = localStorage.getItem("authToken");
            const res = await fetch(`http://localhost:5240/api/auth/search-users?q=${encodeURIComponent(query)}`, {
                headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
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

    const handleSuggestionClick = (email) => {
        const parts = sharedWithInput.split(",");
        parts[parts.length - 1] = ` ${email}`;
        const newValue = parts.join(",").replace(/^ /, "");
        setSharedWithInput(autoSpaceComma(newValue));
        setShowSuggestions(false);
        setUserSuggestions([]);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (suggestionBoxRef.current && !suggestionBoxRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        setUploadError("");
        const formData = new FormData();
        formData.append("file", file);
        try {
            const token = localStorage.getItem("authToken");
            const res = await fetch("http://localhost:5240/api/vaultitem/upload-image", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            if (!res.ok) throw new Error("Image upload failed");
            const data = await res.json();
            setItem((prev) => ({ ...prev, photoUrl: data.url }));
        } catch (err) {
            setUploadError(err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const updatedItem = {
            ...item,
            estimatedValue: item.estimatedValue ? Number(item.estimatedValue) : null,
            materials: materialsInput.split(",").map((v) => v.trim()).filter(Boolean),
            craftType: craftTypeInput.split(",").map((v) => v.trim()).filter(Boolean),
            sharedWithIds: sharedWithInput.split(",").map((v) => v.trim()).filter(Boolean),
        };

        // If editing (existing item), send PUT request
        if (item.vaultItemId && item.vaultItemId !== "0") {
            try {
                const token = localStorage.getItem("authToken");
                const res = await fetch(`http://localhost:5240/api/vaultitem/${item.vaultItemId}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(updatedItem),
                });
                if (!res.ok) {
                    alert("Failed to update item");
                    return;
                }
                const data = await res.json();
                if (onSave) onSave(data);
                window.location.reload();
                if (navigateTo) navigateTo();
            } catch (err) {
                alert("Error updating item: " + err.message);
            }
        } else {
            // Creating new item (handled by AddItem)
            onSave(updatedItem);
        }
    };

    const handleDelete = async () => {
        if (!item.vaultItemId || item.vaultItemId === "0") return;
        if (!window.confirm("Are you sure you want to delete this item?")) return;
        try {
            const token = localStorage.getItem("authToken");
            const url = `http://localhost:5240/api/vaultitem/${item.vaultItemId}`;
            const response = await fetch(url, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error("Failed to delete the heirloom");
            alert("Heirloom deleted.");
            window.location.reload();
            if (navigateTo) navigateTo("/home");
        } catch (error) {
            alert(error.message);
        }
    };

    return (
        <div className="item-layout item-edit-sleek">
            <form onSubmit={handleSubmit}>
                {/* Top Section: Image, Title, Description */}
                <div className="item-edit-top">
                    <div className="item-edit-image">
                        <label style={{ cursor: "pointer" }} title="Click to upload a new image">
                            <img
                                src={getFullImageUrl(item.photoUrl)}
                                alt="Preview"
                                className="item-edit-img-preview"
                            />
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                disabled={uploading}
                                style={{ display: "none" }}
                            />
                        </label>
                        {uploading && <p className="item-edit-uploading">Uploading image...</p>}
                        {uploadError && <p className="error-text">{uploadError}</p>}
                    </div>
                    <div className="item-edit-mainfields">
                        <div className="form-row">
                            <input
                                type="text"
                                className="item-edit-title"
                                value={item.title}
                                onChange={(e) => handleChange("title", e.target.value)}
                                placeholder="Title"
                                required
                            />
                        </div>
                        <div className="form-row">
                            <textarea
                                className="item-edit-description"
                                value={item.description}
                                onChange={(e) => handleChange("description", e.target.value)}
                                placeholder="Description"
                                rows={6}
                            />
                        </div>
                    </div>
                </div>

                {/* Bottom Section: Details */}
                <div className="item-edit-bottom">
                    <div className="item-edit-grid">
                        <div className="form-row">
                            <b>Estimated Value:</b>
                            <input
                                type="number"
                                value={item.estimatedValue || ""}
                                onChange={(e) => handleChange("estimatedValue", e.target.value)}
                                placeholder="e.g. 1000"
                            />
                        </div>
                        <div className="form-row">
                            <b>Creation Date:</b>
                            <input
                                type="date"
                                value={toDateInputValue(item.creationDate)}
                                onChange={(e) => handleChange("creationDate", e.target.value)}
                            />
                        </div>
                        <div className="form-row">
                            <b>Date Acquired:</b>
                            <input
                                type="date"
                                value={toDateInputValue(item.dateAcquired)}
                                onChange={(e) => handleChange("dateAcquired", e.target.value)}
                            />
                        </div>
                        <div className="form-row">
                            <b>Creation Place:</b>
                            <input
                                type="text"
                                value={item.creationPlace}
                                onChange={(e) => handleChange("creationPlace", e.target.value)}
                                placeholder="e.g. Paris"
                            />
                        </div>
                        <div className="form-row">
                            <b>Item Type:</b>
                            <input
                                type="text"
                                value={item.itemType}
                                onChange={(e) => handleChange("itemType", e.target.value)}
                                placeholder="e.g. Painting"
                            />
                        </div>
                        <div className="form-row">
                            <b>Materials:</b>
                            <input
                                value={materialsInput}
                                onChange={(e) => setMaterialsInput(autoSpaceComma(e.target.value))}
                                onBlur={(e) => handleArrayBlur("materials", e.target.value)}
                                placeholder="e.g. wood, metal"
                            />
                        </div>
                        <div className="form-row">
                            <b>Craft Type:</b>
                            <input
                                value={craftTypeInput}
                                onChange={(e) => setCraftTypeInput(autoSpaceComma(e.target.value))}
                                onBlur={(e) => handleArrayBlur("craftType", e.target.value)}
                                placeholder="e.g. handmade, machine-crafted"
                            />
                        </div>
                        <div className="form-row" style={{ position: "relative" }}>
                            <b>Share with:</b>
                            <input
                                value={sharedWithInput}
                                onChange={handleSharedWithInputChange}
                                onBlur={(e) => handleArrayBlur("sharedWithIds", e.target.value)}
                                autoComplete="off"
                                placeholder="e.g. alice@example.com, bob@example.com"
                            />
                            {showSuggestions && userSuggestions.length > 0 && (
                                <div className="suggestion-box" ref={suggestionBoxRef} style={{
                                    position: "absolute",
                                    background: "#fff",
                                    border: "1px solid #ccc",
                                    zIndex: 10,
                                    left: 0,
                                    right: 0,
                                    top: "100%",
                                }}>
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
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="item-edit-actions">
                    <button type="submit" className="auth-button">Save Heirloom</button>
                    {item.vaultItemId && item.vaultItemId !== "0" && (
                        <button type="button" className="auth-button delete" onClick={handleDelete}>Delete</button>
                    )}
                    <button type="button" className="auth-button" onClick={navigateTo}>Cancel</button>
                </div>
            </form>
        </div>
    );
};

export default ItemEdit;