import React, { useState, useEffect } from "react";
import { getFullImageUrl, toDateInputValue } from "./utils";
import "./FamilyTreeMenu.css";
import "./FamilyMemberEdit.css";

const defaultMember = {
    familyMemberId: "",
    userId: "",
    firstName: "",
    middleNames: [],
    lastName: "",
    dateOfBirth: null,
    dateOfDeath: null,
    gender: "",
    occupation: "",
    placeOfBirth: "",
    placeOfDeath: null,
    nationality: "",
    religion: "",
    maritalStatus: "",
    relationshipType: "",
    parentsIds: [],
    childrenIds: [],
    spouseIds: [],
    siblingIds: [],
    profilePictureUrl: null,
};

const placeholderImg = "https://placehold.co/40x40";

// RelationSelector: shows a searchable, selectable list with profile pictures
function RelationSelector({ label, options, selectedIds, onSelect, excludeIds }) {
    const [search, setSearch] = useState("");
    const filtered = options
        .filter(fm => !excludeIds.includes(fm.familyMemberId))
        .filter(fm =>
            `${fm.firstName} ${fm.lastName}`.toLowerCase().includes(search.toLowerCase())
        );

    return (
        <div className="form-row" style={{ flexDirection: "column", alignItems: "flex-start", width: "100%" }}>
            <b style={{ marginBottom: 4 }}>{label}:</b>
            <input
                type="text"
                placeholder={`Search ${label.toLowerCase()}...`}
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
                            background: selectedIds.includes(fm.familyMemberId) ? "#bcb88a33" : "#fff",
                            border: "1px solid #bcb88a",
                            borderRadius: 8,
                            padding: "2px 8px 2px 2px",
                            cursor: "pointer",
                            minWidth: 0,
                        }}
                    >
                        <input
                            type="checkbox"
                            checked={selectedIds.includes(fm.familyMemberId)}
                            onChange={e => onSelect(fm.familyMemberId, e.target.checked)}
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

const FamilyMemberEdit = ({ initialMember, familyMembers = [], onSave, onCancel, addContext }) => {
    const [member, setMember] = useState(initialMember ? { ...defaultMember, ...initialMember } : defaultMember);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState("");

    useEffect(() => {
        if (initialMember) {
            setMember({ ...defaultMember, ...initialMember });
        } else if (addContext && !initialMember) {
            // Prefill parent or child relationship for new member
            if (addContext.type === "parent") {
                setMember(prev => ({
                    ...prev,
                    childrenIds: [addContext.member.familyMemberId]
                }));
            } else if (addContext.type === "child") {
                setMember(prev => ({
                    ...prev,
                    parentsIds: [addContext.member.familyMemberId]
                }));
            }
        }
    }, [initialMember, addContext]);

    const handleChange = (field, value) => {
        setMember(prev => ({ ...prev, [field]: value }));
    };

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        setUploadError("");
        const formData = new FormData();
        formData.append("file", file);
        try {
            const token = localStorage.getItem("authToken");
            const res = await fetch("http://localhost:5240/api/familymember/upload-image", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            if (!res.ok) throw new Error("Image upload failed");
            const data = await res.json();
            setMember(prev => ({ ...prev, profilePictureUrl: data.url }));
        } catch (err) {
            setUploadError(err.message);
        } finally {
            setUploading(false);
        }
    };

    // Mutually exclusive parent/child selection, and spouse selection
    const handleRelationSelect = (field, id, checked) => {
        setMember(prev => {
            let update = { ...prev };
            if (field === "parentsIds") {
                // Remove from childrenIds if present
                update.childrenIds = (update.childrenIds || []).filter(cid => cid !== id);
                update.parentsIds = checked
                    ? [...(update.parentsIds || []), id]
                    : (update.parentsIds || []).filter(pid => pid !== id);
            } else if (field === "childrenIds") {
                // Remove from parentsIds if present
                update.parentsIds = (update.parentsIds || []).filter(pid => pid !== id);
                update.childrenIds = checked
                    ? [...(update.childrenIds || []), id]
                    : (update.childrenIds || []).filter(cid => cid !== id);
            } else if (field === "spouseIds") {
                update.spouseIds = checked
                    ? [...(update.spouseIds || []), id]
                    : (update.spouseIds || []).filter(sid => sid !== id);
            }
            return update;
        });
    };

    const handleRelationCheckbox = (field, id) => e => {
        const checked = e.target.checked;
        setMember(prev => {
            const ids = new Set(prev[field]);
            if (checked) {
                ids.add(id);
            } else {
                ids.delete(id);
            }
            return { ...prev, [field]: Array.from(ids) };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("authToken");
        const isEdit = member.familyMemberId && member.familyMemberId !== "";
        const url = isEdit
            ? `http://localhost:5240/api/familymember/${member.familyMemberId}`
            : "http://localhost:5240/api/familymember";
        const method = isEdit ? "PUT" : "POST";

        const payload = {
            ...member,
            parentsIds: member.parentsIds || [],
            childrenIds: member.childrenIds || [],
            spouseIds: member.spouseIds || [],
        };

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error("Failed to save family member");
            if (onSave) onSave(await res.json());
        } catch (err) {
            setUploadError(err.message);
        }
    };

    // Filter out self from all relation options
    const relationOptions = familyMembers.filter(fm => fm.familyMemberId !== member.familyMemberId);

    return (
        <div className="familymemberedit-layout familymemberedit-sleek">
            <form onSubmit={handleSubmit}>
                <div className="familymemberedit-top">
                    <div className="familymemberedit-image">
                        <label style={{ cursor: "pointer" }} title="Click to upload a new image">
                            <img
                                src={getFullImageUrl(member.profilePictureUrl)}
                                alt="Profile"
                                className="familymemberedit-img-preview"
                            />
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                disabled={uploading}
                                style={{ display: "none" }}
                            />
                        </label>
                        {uploading && <p className="familymemberedit-uploading">Uploading image...</p>}
                        {uploadError && <p className="error-text">{uploadError}</p>}
                    </div>
                    <div className="familymemberedit-mainfields">
                        <div className="form-row">
                            <input
                                type="text"
                                className="familymemberedit-title"
                                value={member.firstName}
                                onChange={e => handleChange("firstName", e.target.value)}
                                placeholder="First Name"
                                required
                            />
                            <input
                                type="text"
                                className="familymemberedit-title"
                                value={member.lastName}
                                onChange={e => handleChange("lastName", e.target.value)}
                                placeholder="Last Name"
                                required
                            />
                        </div>
                        <div className="form-row">
                            <input
                                type="text"
                                value={member.relationshipType}
                                onChange={e => handleChange("relationshipType", e.target.value)}
                                placeholder="Relationship Type"
                            />
                        </div>
                    </div>
                </div>
                <div className="familymemberedit-mainfields">
                    <div className="form-row">
                        <b>Date of Birth:</b>
                        <input
                            type="date"
                            value={toDateInputValue(member.dateOfBirth)}
                            onChange={e => handleChange("dateOfBirth", e.target.value)}
                        />
                    </div>
                    <div className="form-row">
                        <b>Date of Death:</b>
                        <input
                            type="date"
                            value={toDateInputValue(member.dateOfDeath)}
                            onChange={e => handleChange("dateOfDeath", e.target.value)}
                        />
                    </div>
                    <div className="form-row">
                        <b>Occupation:</b>
                        <input
                            type="text"
                            value={member.occupation}
                            onChange={e => handleChange("occupation", e.target.value)}
                        />
                    </div>
                    <div className="form-row">
                        <b>Place of Birth:</b>
                        <input
                            type="text"
                            value={member.placeOfBirth}
                            onChange={e => handleChange("placeOfBirth", e.target.value)}
                        />
                    </div>
                    <div className="form-row">
                        <b>Place of Death:</b>
                        <input
                            type="text"
                            value={member.placeOfDeath || ""}
                            onChange={e => handleChange("placeOfDeath", e.target.value)}
                        />
                    </div>
                    <div className="form-row">
                        <b>Nationality:</b>
                        <input
                            type="text"
                            value={member.nationality}
                            onChange={e => handleChange("nationality", e.target.value)}
                        />
                    </div>
                    <div className="form-row">
                        <b>Religion:</b>
                        <input
                            type="text"
                            value={member.religion}
                            onChange={e => handleChange("religion", e.target.value)}
                        />
                    </div>
                    <div className="form-row">
                        <b>Marital Status:</b>
                        <input
                            type="text"
                            value={member.maritalStatus}
                            onChange={e => handleChange("maritalStatus", e.target.value)}
                        />
                    </div>
                    <div className="form-row">
                        <b>Gender:</b>
                        <input
                            type="text"
                            value={member.gender}
                            onChange={e => handleChange("gender", e.target.value)}
                        />
                    </div>
                </div>
                <div className="familymemberedit-mainfields">
                    <RelationSelector
                        label="Parents"
                        options={relationOptions}
                        selectedIds={member.parentsIds || []}
                        onSelect={(id, checked) => handleRelationSelect("parentsIds", id, checked)}
                        excludeIds={member.childrenIds || []}
                    />
                    <RelationSelector
                        label="Children"
                        options={relationOptions}
                        selectedIds={member.childrenIds || []}
                        onSelect={(id, checked) => handleRelationSelect("childrenIds", id, checked)}
                        excludeIds={member.parentsIds || []}
                    />
                    <RelationSelector
                        label="Spouses"
                        options={relationOptions}
                        selectedIds={member.spouseIds || []}
                        onSelect={(id, checked) => handleRelationSelect("spouseIds", id, checked)}
                        excludeIds={[]}
                    />
                </div>
                <div className="familymemberedit-actions">
                    <button type="submit" className="auth-button">Save</button>
                    {member.familyMemberId && member.userId !== localStorage.getItem("userId") && (
                        <button
                            type="button"
                            className="auth-button delete"
                            onClick={async () => {
                                if (!window.confirm("Are you sure you want to delete this family member?")) return;
                                const token = localStorage.getItem("authToken");
                                const res = await fetch(`http://localhost:5240/api/familymember/${member.familyMemberId}`, {
                                    method: "DELETE",
                                    headers: { Authorization: `Bearer ${token}` },
                                });
                                if (res.ok) {
                                    if (onSave) onSave();
                                } else {
                                    alert("Failed to delete family member.");
                                }
                            }}
                        >
                            Delete
                        </button>
                    )}
                    <button type="button" className="auth-button" onClick={onCancel}>Cancel</button>
                </div>
            </form>
        </div>
    );
};

export default FamilyMemberEdit;