import React, { useState, useEffect, useRef } from "react";
import { getFullImageUrl, toDateInputValue, autoSpaceComma } from "./utils";
import "./CreateItemPage.css";

const placeholderImg = "https://placehold.co/40x40";

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

function CreatorSelector({ familyMembers, selectedId, onSelect }) {
    const [search, setSearch] = useState("");
    const filtered = familyMembers
        ? familyMembers.filter(fm =>
            `${fm.firstName} ${fm.lastName}`.toLowerCase().includes(search.toLowerCase())
        )
        : [];

    return (
        <div className="form-row" style={{ flexDirection: "column", alignItems: "flex-start", width: "100%" }}>
            <b style={{ marginBottom: 4 }}>Creator:</b>
            <input
                type="text"
                placeholder="Search creator..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ marginBottom: 8, width: "100%", maxWidth: 320 }}
            />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {filtered.length === 0 && <span style={{ color: "#888" }}>No matches</span>}
                {filtered.map(fm => (
                    <label
                        key={fm.familyMemberId}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            background: selectedId === fm.familyMemberId ? "#bcb88a33" : "#fff",
                            border: "1px solid #bcb88a",
                            borderRadius: 8,
                            padding: "2px 8px 2px 2px",
                            cursor: "pointer",
                            minWidth: 0,
                        }}
                    >
                        <input
                            type="radio"
                            checked={selectedId === fm.familyMemberId}
                            onChange={() => onSelect(fm.familyMemberId)}
                            style={{ marginRight: 4 }}
                        />
                        <img
                            src={fm.profilePictureUrl ? getFullImageUrl(fm.profilePictureUrl) : placeholderImg}
                            alt={`${fm.firstName} ${fm.lastName}`}
                            style={{
                                width: 32,
                                height: 32,
                                borderRadius: "50%",
                                objectFit: "cover",
                                border: "1px solid #bcb88a",
                                background: "#fffbe9",
                            }}
                        />
                        <span style={{ fontSize: 15, fontWeight: 500, whiteSpace: "nowrap" }}>
                            {fm.firstName} {fm.lastName}
                        </span>
                    </label>
                ))}
            </div>
        </div>
    );
}

const ItemEdit = ({ onSave, initialItem, navigateTo, familyMembers = [] }) => {
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

    const [localFamilyMembers, setLocalFamilyMembers] = useState(familyMembers);

    useEffect(() => {
        if (!familyMembers || familyMembers.length === 0) {
            const fetchFamilyMembers = async () => {
                const token = localStorage.getItem("authToken");
                const res = await fetch("http://localhost:5240/api/familymember", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    setLocalFamilyMembers(await res.json());
                }
            };
            fetchFamilyMembers();
        } else {
            setLocalFamilyMembers(familyMembers);
        }
    }, [familyMembers]);

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
                setUserSuggestions(await res.json());
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

    const handleCreatorSelect = (familyMemberId) => {
        setItem(prev => ({ ...prev, creatorId: familyMemberId }));
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
                                alt="Heirloom"
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
                                onChange={e => handleChange("title", e.target.value)}
                                placeholder="Heirloom Title"
                                required
                            />
                        </div>
                        <div className="form-row">
                            <textarea
                                className="item-edit-description"
                                value={item.description}
                                onChange={e => handleChange("description", e.target.value)}
                                placeholder="Description"
                                rows={3}
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
                                onChange={e => handleChange("estimatedValue", e.target.value)}
                                min={0}
                                step={0.01}
                                placeholder="e.g. 1000"
                            />
                        </div>
                        <div className="form-row">
                            <b>Creation Date:</b>
                            <input
                                type="date"
                                value={toDateInputValue(item.creationDate)}
                                onChange={e => handleChange("creationDate", e.target.value)}
                            />
                        </div>
                        <div className="form-row">
                            <b>Date Acquired:</b>
                            <input
                                type="date"
                                value={toDateInputValue(item.dateAcquired)}
                                onChange={e => handleChange("dateAcquired", e.target.value)}
                            />
                        </div>
                        <div className="form-row">
                            <b>Creation Place:</b>
                            <input
                                type="text"
                                value={item.creationPlace}
                                onChange={e => handleChange("creationPlace", e.target.value)}
                            />
                        </div>
                        <div className="form-row">
                            <b>Item Type:</b>
                            <input
                                type="text"
                                value={item.itemType}
                                onChange={e => handleChange("itemType", e.target.value)}
                            />
                        </div>
                        <div className="form-row">
                            <b>Materials:</b>
                            <input
                                type="text"
                                value={materialsInput}
                                onChange={e => setMaterialsInput(e.target.value)}
                                onBlur={e => handleArrayBlur("materials", e.target.value)}
                                placeholder="e.g. Gold, Silver"
                            />
                        </div>
                        <div className="form-row">
                            <b>Craft Type:</b>
                            <input
                                type="text"
                                value={craftTypeInput}
                                onChange={e => setCraftTypeInput(e.target.value)}
                                onBlur={e => handleArrayBlur("craftType", e.target.value)}
                                placeholder="e.g. Engraving, Weaving"
                            />
                        </div>
                        <div className="form-row" style={{ position: "relative" }}>
                            <b>Share With (emails):</b>
                            <input
                                type="text"
                                value={sharedWithInput}
                                onChange={handleSharedWithInputChange}
                                onBlur={e => handleArrayBlur("sharedWithIds", e.target.value)}
                                placeholder="Type email and comma to add"
                                autoComplete="off"
                            />
                            {showSuggestions && userSuggestions.length > 0 && (
                                <div
                                    ref={suggestionBoxRef}
                                    style={{
                                        position: "absolute",
                                        top: "100%",
                                        left: 0,
                                        background: "#fff",
                                        border: "1px solid #bcb88a",
                                        borderRadius: 6,
                                        zIndex: 10,
                                        width: "100%",
                                        maxHeight: 120,
                                        overflowY: "auto",
                                    }}
                                >
                                    {suggestionLoading ? (
                                        <div style={{ padding: 8 }}>Loading...</div>
                                    ) : (
                                        userSuggestions.map(user => (
                                            <div
                                                key={user.email}
                                                style={{
                                                    padding: 8,
                                                    cursor: "pointer",
                                                    borderBottom: "1px solid #eee",
                                                }}
                                                onMouseDown={() => handleSuggestionClick(user.email)}
                                            >
                                                {user.email}
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                        <CreatorSelector
                            familyMembers={localFamilyMembers || []}
                            selectedId={item.creatorId}
                            onSelect={handleCreatorSelect}
                        />
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