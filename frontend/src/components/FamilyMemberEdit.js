import React, { useState, useEffect } from "react";
import { getFullImageUrl } from "./utils";
import "./CreateItemPage.css";

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

const FamilyMemberEdit = ({ initialMember, familyMembers = [], onSave, onCancel }) => {
    const [member, setMember] = useState(initialMember ? { ...defaultMember, ...initialMember } : defaultMember);

    useEffect(() => {
        if (initialMember) {
            setMember({ ...defaultMember, ...initialMember });
        }
    }, [initialMember]);

    // Checkbox handler for parents/children
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

    const handleChange = (field, value) => {
        setMember(prev => ({ ...prev, [field]: value }));
    };

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
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
            setMember(prev => ({ ...prev, profilePictureUrl: data.url }));
        } catch (err) {
            alert("Image upload failed: " + err.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("authToken");
        const isEdit = member.familyMemberId && member.familyMemberId !== "";
        const url = isEdit
            ? `http://localhost:5240/api/familymember/${member.familyMemberId}`
            : "http://localhost:5240/api/familymember";
        const method = isEdit ? "PUT" : "POST";

        // Prepare payload, ensure parentsIds/childrenIds are included
        const payload = {
            ...member,
            parentsIds: member.parentsIds || [],
            childrenIds: member.childrenIds || [],
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
            alert("Save failed: " + err.message);
        }
    };

    return (
        <div className="item-layout item-edit-sleek">
            <form onSubmit={handleSubmit}>
                <div className="item-edit-top">
                    <div className="item-edit-image">
                        <label style={{ cursor: "pointer" }} title="Click to upload a new image">
                            <img
                                src={getFullImageUrl(member.profilePictureUrl)}
                                alt="Profile Preview"
                                className="item-edit-img-preview"
                            />
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                style={{ display: "none" }}
                            />
                        </label>
                    </div>
                    <div className="item-edit-mainfields">
                        <div className="form-row">
                            <b>First Name:</b>
                            <input
                                type="text"
                                value={member.firstName}
                                onChange={e => handleChange("firstName", e.target.value)}
                                placeholder="First Name"
                            />
                        </div>
                        <div className="form-row">
                            <b>Last Name:</b>
                            <input
                                type="text"
                                value={member.lastName}
                                onChange={e => handleChange("lastName", e.target.value)}
                                placeholder="Last Name"
                            />
                        </div>
                        {/* Parents */}
                        <div className="form-row">
                            <b>Parents:</b>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.7rem" }}>
                                {familyMembers
                                    .filter(m => m.familyMemberId !== member.familyMemberId)
                                    .map(m => (
                                        <label key={m.familyMemberId} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                            <input
                                                type="checkbox"
                                                checked={member.parentsIds?.includes(m.familyMemberId)}
                                                onChange={handleRelationCheckbox("parentsIds", m.familyMemberId)}
                                            />
                                            {m.firstName} {m.lastName}
                                        </label>
                                    ))}
                            </div>
                        </div>
                        {/* Children */}
                        <div className="form-row">
                            <b>Children:</b>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.7rem" }}>
                                {familyMembers
                                    .filter(m => m.familyMemberId !== member.familyMemberId)
                                    .map(m => (
                                        <label key={m.familyMemberId} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                            <input
                                                type="checkbox"
                                                checked={member.childrenIds?.includes(m.familyMemberId)}
                                                onChange={handleRelationCheckbox("childrenIds", m.familyMemberId)}
                                            />
                                            {m.firstName} {m.lastName}
                                        </label>
                                    ))}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="item-edit-actions">
                    <button type="submit" className="auth-button">Save</button>
                    <button type="button" className="auth-button" onClick={onCancel}>Cancel</button>
                </div>
            </form>
        </div>
    );
};

export default FamilyMemberEdit;