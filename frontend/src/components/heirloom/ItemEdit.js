import React, { useState, useEffect, useRef } from "react";
import { getFullImageUrl, toDateInputValue, autoSpaceComma } from "../../services/utils";
import { familyAPI, vaultAPI, authAPI } from "../../services/api";
import Button from "../shared/Button";
import "../../styles/shared/StandardModal.css";

const placeholderImg = "https://placehold.co/40x40";

const defaultItem = {
    vaultItemId: "0",
    currentOwnerId: localStorage.getItem("userId") || "",
    currentOwnerUserId: localStorage.getItem("userId") || "",
    title: "",
    creatorId: null,
    previousOwnerIds: [],
    estimatedValue: null,
    currency: "NZD", // Default currency
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

/**
 * ItemEdit component for creating or editing a vault item (heirloom).
 * Handles form state, image upload, and user suggestions for sharing.
 */

function CreatorSelector({ familyMembers, selectedId, onSelect }) {
    const [search, setSearch] = useState("");
    const filtered = familyMembers
        ? familyMembers.filter(fm =>
            `${fm.firstName} ${fm.lastName}`.toLowerCase().includes(search.toLowerCase())
        )
        : [];

    return (
        <div className="standard-field-row vertical">
            <div className="standard-field-label">Creator:</div>
            <input
                type="text"
                className="standard-field-input"
                placeholder="Search creator..."
                value={search}
                onChange={e => setSearch(e.target.value)}
            />
            <div className="standard-modal-related-list">
                {filtered.length === 0 && <span className="standard-field-value">No matches</span>}
                {filtered.map(fm => (
                    <label
                        key={fm.familyMemberId}
                        className={`standard-modal-related-tag ${selectedId === fm.familyMemberId ? 'selected' : ''}`}
                    >
                        <input
                            type="radio"
                            checked={selectedId === fm.familyMemberId}
                            onChange={() => onSelect(fm.familyMemberId)}
                            className="standard-modal-radio-input"
                        />
                        <img
                            src={fm.profilePictureUrl ? getFullImageUrl(fm.profilePictureUrl) : placeholderImg}
                            alt={`${fm.firstName} ${fm.lastName}`}
                            className="standard-modal-related-photo"
                        />
                        <span className="standard-modal-related-name">
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
    const [emailToIdMap, setEmailToIdMap] = useState(new Map());
    const [localFamilyMembers, setLocalFamilyMembers] = useState(familyMembers);

    // Fetch family members if not provided
    useEffect(() => {
        if ((!familyMembers || familyMembers.length === 0) && localFamilyMembers.length === 0) {
            const fetchFamilyMembers = async () => {
                try {
                    const data = await familyAPI.getAll();
                    setLocalFamilyMembers(data);
                } catch (error) {
                    console.error("Error fetching family members:", error);
                }
            };
            fetchFamilyMembers();
        } else if (familyMembers.length > 0) {
            setLocalFamilyMembers(familyMembers);
        }
    }, [familyMembers, localFamilyMembers.length]);

    // Initialize form with item data
    useEffect(() => {
        if (initialItem) {
            setItem({ ...defaultItem, ...initialItem });
            setMaterialsInput((initialItem.materials || []).join(", "));
            setCraftTypeInput((initialItem.craftType || []).join(", "));
            setSharedWithInput((initialItem.sharedWithIds || []).join(", "));
        }
    }, [initialItem]);

    // Handle form field changes
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

    // User suggestions for sharing
    const fetchUserSuggestions = async (query) => {
        if (!query) {
            setUserSuggestions([]);
            return;
        }
        setSuggestionLoading(true);
        try {
            const users = await authAPI.searchUsers(query);
            setUserSuggestions(users);
        } catch (error) {
            console.error("Error searching users:", error);
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

    const handleSuggestionClick = (email, userId) => {
        const parts = sharedWithInput.split(",");
        parts[parts.length - 1] = ` ${email}`;
        const newValue = parts.join(",").replace(/^ /, "");
        setSharedWithInput(autoSpaceComma(newValue));
        setEmailToIdMap(prev => new Map(prev).set(email, userId));
        setShowSuggestions(false);
        setUserSuggestions([]);
    };

    // Handle clicking outside suggestions
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (suggestionBoxRef.current && !suggestionBoxRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Image upload
    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        setUploadError("");
        try {
            const data = await vaultAPI.uploadImage(file);
            setItem((prev) => ({ ...prev, photoUrl: data.url }));
        } catch (err) {
            setUploadError(err.message || "Image upload failed");
        } finally {
            setUploading(false);
        }
    };

    const handleCreatorSelect = (familyMemberId) => {
        setItem(prev => ({ ...prev, creatorId: familyMemberId }));
    };

    // Form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Convert emails to user IDs for sharedWithIds
        const emailList = sharedWithInput.split(",").map((v) => v.trim()).filter(Boolean);
        const sharedUserIds = [];

        for (const email of emailList) {
            if (emailToIdMap.has(email)) {
                sharedUserIds.push(emailToIdMap.get(email));
            } else {
                try {
                    const users = await authAPI.searchUsers(email);
                    const user = users.find(u => u.email === email);
                    if (user) {
                        sharedUserIds.push(user.userId);
                    } else {
                        console.warn(`User not found for email: ${email}`);
                    }
                } catch (error) {
                    console.error(`Error finding user for email ${email}:`, error);
                }
            }
        }

        const updatedItem = {
            ...item,
            estimatedValue: item.estimatedValue ? Number(item.estimatedValue) : null,
            materials: materialsInput.split(",").map((v) => v.trim()).filter(Boolean),
            craftType: craftTypeInput.split(",").map((v) => v.trim()).filter(Boolean),
            sharedWithIds: sharedUserIds,
        };

        // Update or create item
        if (item.vaultItemId && item.vaultItemId !== "0") {
            try {
                const data = await vaultAPI.update(item.vaultItemId, updatedItem);
                if (onSave) onSave(data);
                window.location.reload();
                if (navigateTo) navigateTo();
            } catch (err) {
                alert("Error updating item: " + err.message);
            }
        } else {
            onSave(updatedItem);
        }
    };

    const handleDelete = async () => {
        if (!item.vaultItemId || item.vaultItemId === "0") return;
        if (!window.confirm("Are you sure you want to delete this item?")) return;
        try {
            await vaultAPI.delete(item.vaultItemId);
            alert("Heirloom deleted.");
            window.location.reload();
            if (navigateTo) navigateTo("/home");
        } catch (error) {
            alert(error.message);
        }
    };

    return (
        <div className="standard-modal-container">
            <form onSubmit={handleSubmit}>
                {/* Header Section */}
                <div className="standard-modal-header">
                    <div className="standard-modal-photo-container rectangular">
                        <label className="standard-modal-photo-upload" title="Click to upload a new image">
                            <img
                                src={getFullImageUrl(item.photoUrl)}
                                alt="Heirloom"
                                className="standard-modal-photo"
                            />
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                disabled={uploading}
                                className="standard-modal-file-input"
                            />
                        </label>
                        {uploading && <p className="standard-modal-upload-status">Uploading image...</p>}
                        {uploadError && <p className="standard-modal-error-text">{uploadError}</p>}
                    </div>
                    <div className="standard-modal-primary-info">
                        <div className="standard-form-row-inline">
                            <label className="standard-modal-form-label" htmlFor="title-input">
                                Title
                            </label>
                            <input
                                id="title-input"
                                type="text"
                                className="standard-modal-title editable"
                                value={item.title}
                                onChange={e => handleChange("title", e.target.value)}
                                placeholder="Enter title"
                                required
                            />
                            <small className="standard-modal-field-hint">* Required field</small>
                        </div>
                        <div className="standard-form-row">
                            <textarea
                                className="standard-modal-description editable"
                                value={item.description}
                                onChange={e => handleChange("description", e.target.value)}
                                placeholder="Enter description"
                                rows={3}
                            />
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className="standard-modal-content">
                    <div className="standard-modal-details-grid">
                        <div className="standard-field-row">
                            <div className="standard-field-label">Estimated Value:</div>
                            <div className="standard-modal-input-pair">
                                <input
                                    className="standard-field-input"
                                    type="number"
                                    value={item.estimatedValue || ""}
                                    onChange={e => handleChange("estimatedValue", e.target.value)}
                                    min={0}
                                    step={0.01}
                                    placeholder="e.g. 1000"
                                />
                                <select
                                    className="standard-field-input"
                                    value={item.currency || "NZD"}
                                    onChange={e => handleChange("currency", e.target.value)}
                                >
                                    <option value="USD">🇺🇸 USD</option>
                                    <option value="EUR">🇪🇺 EUR</option>
                                    <option value="GBP">🇬🇧 GBP</option>
                                    <option value="JPY">🇯🇵 JPY</option>
                                    <option value="CAD">🇨🇦 CAD</option>
                                    <option value="AUD">🇦🇺 AUD</option>
                                    <option value="CHF">🇨🇭 CHF</option>
                                    <option value="CNY">🇨🇳 CNY</option>
                                    <option value="SEK">🇸🇪 SEK</option>
                                    <option value="NOK">🇳🇴 NOK</option>
                                    <option value="MXN">🇲🇽 MXN</option>
                                    <option value="INR">🇮🇳 INR</option>
                                    <option value="BRL">🇧🇷 BRL</option>
                                    <option value="KRW">🇰🇷 KRW</option>
                                    <option value="SGD">🇸🇬 SGD</option>
                                    <option value="NZD">🇳🇿 NZD</option>
                                </select>
                            </div>
                        </div>
                        <div className="standard-field-row">
                            <div className="standard-field-label">Creation Date:</div>
                            <input
                                className="standard-field-input"
                                type="date"
                                value={toDateInputValue(item.creationDate)}
                                onChange={e => handleChange("creationDate", e.target.value)}
                            />
                        </div>
                        <div className="standard-field-row">
                            <div className="standard-field-label">Date Acquired:</div>
                            <input
                                className="standard-field-input"
                                type="date"
                                value={toDateInputValue(item.dateAcquired)}
                                onChange={e => handleChange("dateAcquired", e.target.value)}
                            />
                        </div>
                        <div className="standard-field-row">
                            <div className="standard-field-label">Creation Place:</div>
                            <input
                                className="standard-field-input"
                                type="text"
                                value={item.creationPlace}
                                onChange={e => handleChange("creationPlace", e.target.value)}
                            />
                        </div>
                        <div className="standard-field-row">
                            <div className="standard-field-label">Item Type:</div>
                            <input
                                className="standard-field-input"
                                type="text"
                                value={item.itemType}
                                onChange={e => handleChange("itemType", e.target.value)}
                            />
                        </div>
                        <div className="standard-field-row">
                            <div className="standard-field-label">Materials:</div>
                            <input
                                className="standard-field-input"
                                type="text"
                                value={materialsInput}
                                onChange={e => setMaterialsInput(e.target.value)}
                                onBlur={e => handleArrayBlur("materials", e.target.value)}
                                placeholder="e.g. Gold, Silver"
                            />
                        </div>
                        <div className="standard-field-row">
                            <div className="standard-field-label">Craft Type:</div>
                            <input
                                className="standard-field-input"
                                type="text"
                                value={craftTypeInput}
                                onChange={e => setCraftTypeInput(e.target.value)}
                                onBlur={e => handleArrayBlur("craftType", e.target.value)}
                                placeholder="e.g. Engraving, Weaving"
                            />
                        </div>
                        <div className="standard-field-row">
                            <div className="standard-field-label">Share With (emails):</div>
                            <div className="standard-modal-autocomplete-container">
                                <input
                                    className="standard-field-input"
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
                                        className="standard-modal-suggestion-dropdown"
                                    >
                                        {suggestionLoading ? (
                                            <div className="standard-modal-suggestion-loading">Loading...</div>
                                        ) : (
                                            userSuggestions.map(user => (
                                                <div
                                                    key={user.email}
                                                    className="standard-modal-suggestion-item"
                                                    onMouseDown={() => handleSuggestionClick(user.email, user.userId)}
                                                >
                                                    {user.email}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        <CreatorSelector
                            familyMembers={localFamilyMembers || []}
                            selectedId={item.creatorId}
                            onSelect={handleCreatorSelect}
                        />
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="standard-modal-actions">
                    <Button type="submit" variant="primary">
                        Save Heirloom
                    </Button>
                    {item.vaultItemId && item.vaultItemId !== "0" && (
                        <Button type="button" variant="delete" onClick={handleDelete}>
                            Delete
                        </Button>
                    )}
                    <Button type="button" variant="secondary" onClick={navigateTo}>
                        Cancel
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default ItemEdit;
