import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { getFullImageUrl, toDateInputValue } from "../../services/utils";
import { FamilyService } from "../../services/family";
import Button from "../shared/Button";
import "../../styles/family/FamilyMemberEdit.css";

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

/**
 * A component to select related family members with profile pictures
 *
 * @component
 * @param {Object} props
 * @param {string} props.label - Label for the relationship field
 * @param {Array} props.options - Available family members to select from
 * @param {Array} props.selectedIds - Currently selected IDs
 * @param {Function} props.onSelect - Handler when a selection changes
 * @param {Array} props.excludeIds - IDs to exclude from options
 * @returns {JSX.Element}
 */
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

RelationSelector.propTypes = {
    label: PropTypes.string.isRequired,
    options: PropTypes.array.isRequired,
    selectedIds: PropTypes.array.isRequired,
    onSelect: PropTypes.func.isRequired,
    excludeIds: PropTypes.array.isRequired
};

/**
 * FamilyMemberEdit component allows editing or creating a family member.
 * Handles form state, image upload, and relationship selection.
 *
 * @component
 * @param {Object} props
 * @param {Object} [props.initialMember] - The member to edit (if any)
 * @param {Array} props.familyMembers - All family members for relationship selection
 * @param {Function} props.onSave - Callback after saving
 * @param {Function} props.onCancel - Callback for cancel action
 * @param {Object} [props.addContext] - Context for adding parent/child
 * @returns {JSX.Element}
 */
const FamilyMemberEdit = ({ initialMember, familyMembers = [], onSave, onCancel, addContext }) => {
    const [member, setMember] = useState(initialMember ? { ...defaultMember, ...initialMember } : defaultMember);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState("");
    const [saving, setSaving] = useState(false);

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

    /**
     * Updates a form field value
     * @param {string} field - Field name to update
     * @param {any} value - New field value
     */
    const handleChange = (field, value) => {
        setMember(prev => ({ ...prev, [field]: value }));
    };

    /**
     * Uploads a profile image
     * @param {Event} e - File input change event
     */
    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        setUploadError("");

        try {
            const data = await FamilyService.uploadImage(file);
            setMember(prev => ({ ...prev, profilePictureUrl: data.url }));
        } catch (err) {
            setUploadError(err.message || "Image upload failed");
        } finally {
            setUploading(false);
        }
    };

    /**
     * Handles mutually exclusive relationship selection (parent/child)
     * @param {string} field - Relationship field name
     * @param {string|number} id - ID of the related member
     * @param {boolean} checked - Whether relation is selected
     */
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

    /**
     * Saves the member - creates new or updates existing
     * @param {Event} e - Form submit event
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setUploadError("");

        const payload = {
            ...member,
            parentsIds: member.parentsIds || [],
            childrenIds: member.childrenIds || [],
            spouseIds: member.spouseIds || [],
        };

        try {
            let savedMember;

            // Update existing member
            if (member.familyMemberId && member.familyMemberId !== "") {
                savedMember = await FamilyService.updateMember(
                    member.familyMemberId,
                    payload
                );
            }
            // Create new member
            else {
                savedMember = await FamilyService.createMember(payload);
            }

            if (onSave) onSave(savedMember);
        } catch (err) {
            setUploadError(err.message || "Failed to save member");
        } finally {
            setSaving(false);
        }
    };

    /**
     * Handles member deletion after confirmation
     */
    const handleDelete = async () => {
        if (!member.familyMemberId) return;

        if (!window.confirm("Are you sure you want to delete this family member?")) {
            return;
        }

        try {
            await FamilyService.deleteMember(member.familyMemberId);
            if (onSave) onSave();
        } catch (err) {
            setUploadError(err.message || "Failed to delete member");
        }
    };

    // Filter out self from all relation options
    const relationOptions = familyMembers.filter(fm =>
        fm.familyMemberId !== member.familyMemberId
    );

    return (
        <div className="familymemberedit-layout familymemberedit-sleek">
            <form onSubmit={handleSubmit}>
                {/* Top section: image and main fields */}
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
                                disabled={uploading || saving}
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
                                disabled={saving}
                                required
                            />
                            <input
                                type="text"
                                className="familymemberedit-title"
                                value={member.lastName}
                                onChange={e => handleChange("lastName", e.target.value)}
                                placeholder="Last Name"
                                disabled={saving}
                                required
                            />
                        </div>
                        <div className="form-row">
                            <input
                                type="text"
                                value={member.relationshipType}
                                onChange={e => handleChange("relationshipType", e.target.value)}
                                placeholder="Relationship Type"
                                disabled={saving}
                            />
                        </div>
                    </div>
                </div>

                {/* Main fields: details */}
                <div className="familymemberedit-mainfields">
                    <div className="form-row">
                        <b>Date of Birth:</b>
                        <input
                            type="date"
                            value={toDateInputValue(member.dateOfBirth)}
                            onChange={e => handleChange("dateOfBirth", e.target.value)}
                            disabled={saving}
                        />
                    </div>
                    <div className="form-row">
                        <b>Date of Death:</b>
                        <input
                            type="date"
                            value={toDateInputValue(member.dateOfDeath)}
                            onChange={e => handleChange("dateOfDeath", e.target.value)}
                            disabled={saving}
                        />
                    </div>
                    <div className="form-row">
                        <b>Occupation:</b>
                        <input
                            type="text"
                            value={member.occupation || ""}
                            onChange={e => handleChange("occupation", e.target.value)}
                            disabled={saving}
                        />
                    </div>
                    <div className="form-row">
                        <b>Place of Birth:</b>
                        <input
                            type="text"
                            value={member.placeOfBirth || ""}
                            onChange={e => handleChange("placeOfBirth", e.target.value)}
                            disabled={saving}
                        />
                    </div>
                    <div className="form-row">
                        <b>Place of Death:</b>
                        <input
                            type="text"
                            value={member.placeOfDeath || ""}
                            onChange={e => handleChange("placeOfDeath", e.target.value)}
                            disabled={saving}
                        />
                    </div>
                    <div className="form-row">
                        <b>Nationality:</b>
                        <input
                            type="text"
                            value={member.nationality || ""}
                            onChange={e => handleChange("nationality", e.target.value)}
                            disabled={saving}
                        />
                    </div>
                    <div className="form-row">
                        <b>Religion:</b>
                        <input
                            type="text"
                            value={member.religion || ""}
                            onChange={e => handleChange("religion", e.target.value)}
                            disabled={saving}
                        />
                    </div>
                    <div className="form-row">
                        <b>Marital Status:</b>
                        <input
                            type="text"
                            value={member.maritalStatus || ""}
                            onChange={e => handleChange("maritalStatus", e.target.value)}
                            disabled={saving}
                        />
                    </div>
                    <div className="form-row">
                        <b>Gender:</b>
                        <input
                            type="text"
                            value={member.gender || ""}
                            onChange={e => handleChange("gender", e.target.value)}
                            disabled={saving}
                        />
                    </div>
                </div>

                {/* Relationship selectors */}
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

                {/* Action buttons */}
                <div className="familymemberedit-actions">
                    <Button
                        type="submit"
                        isLoading={saving}
                        loadingText="Saving..."
                    >
                        Save
                    </Button>

                    {member.familyMemberId && member.userId !== localStorage.getItem("userId") && (
                        <Button
                            variant="delete"
                            onClick={handleDelete}
                            disabled={saving}
                        >
                            Delete
                        </Button>
                    )}

                    <Button
                        variant="secondary"
                        onClick={onCancel}
                        disabled={saving}
                    >
                        Cancel
                    </Button>
                </div>
            </form>
        </div>
    );
};

FamilyMemberEdit.propTypes = {
    initialMember: PropTypes.object,
    familyMembers: PropTypes.array,
    onSave: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    addContext: PropTypes.object
};

export default FamilyMemberEdit;
