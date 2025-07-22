import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { getFullImageUrl, toDateInputValue } from "../../services/utils";
import { FamilyService } from "../../services/family";
import Button from "../shared/Button";
import StandardModal from "../shared/StandardModal";
import "../../styles/shared/StandardModal.css";

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
 */
function RelationSelector({ label, options, selectedIds, onSelect, excludeIds }) {
    const [search, setSearch] = useState("");
    const filtered = options
        .filter(fm => !excludeIds.includes(fm.familyMemberId))
        .filter(fm =>
            `${fm.firstName} ${fm.lastName}`.toLowerCase().includes(search.toLowerCase())
        );

    return (
        <div className="standard-relationship-selector">
            <div className="standard-field-label">{label}</div>
            <input
                type="text"
                placeholder={`Search ${label.toLowerCase()}...`}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="standard-relationship-search"
            />
            <div className="standard-relationship-tags">
                {filtered.length === 0 && <span className="standard-field-value">No matches</span>}
                {filtered.map(fm => (
                    <label
                        key={fm.familyMemberId}
                        className={`standard-modal-related-tag ${selectedIds.includes(fm.familyMemberId) ? 'selected' : ''}`}
                    >
                        <input
                            type="checkbox"
                            checked={selectedIds.includes(fm.familyMemberId)}
                            onChange={e => onSelect(fm.familyMemberId, e.target.checked)}
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

RelationSelector.propTypes = {
    label: PropTypes.string.isRequired,
    options: PropTypes.array.isRequired,
    selectedIds: PropTypes.array.isRequired,
    onSelect: PropTypes.func.isRequired,
    excludeIds: PropTypes.array.isRequired
};

/**
 * FamilyMemberEdit component allows editing or creating a family member.
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
     */
    const handleChange = (field, value) => {
        setMember(prev => ({ ...prev, [field]: value }));
    };

    /**
     * Uploads a profile image
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
     */
    const handleRelationSelect = (field, id, checked) => {
        setMember(prev => {
            let update = { ...prev };
            if (field === "parentsIds") {
                update.childrenIds = (update.childrenIds || []).filter(cid => cid !== id);
                update.parentsIds = checked
                    ? [...(update.parentsIds || []), id]
                    : (update.parentsIds || []).filter(pid => pid !== id);
            } else if (field === "childrenIds") {
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

            if (member.familyMemberId && member.familyMemberId !== "") {
                savedMember = await FamilyService.updateMember(
                    member.familyMemberId,
                    payload
                );
            } else {
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
        <StandardModal
            isEdit={true}
            title={`${member.firstName} ${member.lastName}` || "New Family Member"}
            photo={getFullImageUrl(member.profilePictureUrl)}
            photoAlt={`${member.firstName} ${member.lastName}`}
            photoShape="circular"
            onPhotoUpload={handleImageChange}
            uploading={uploading}
            uploadError={uploadError}
            onSubmit={handleSubmit}
            actions={
                <div className="family-member-actions">
                    <Button type="submit" variant="primary" disabled={saving}>
                        {saving ? "Saving..." : "Save Member"}
                    </Button>
                    {member.familyMemberId && (
                        <Button type="button" variant="delete" onClick={handleDelete} disabled={saving}>
                            Delete Member
                        </Button>
                    )}
                    <Button type="button" variant="secondary" onClick={onCancel} disabled={saving}>
                        Cancel
                    </Button>
                </div>
            }
        >
            {/* Custom inline name inputs in header area */}
            <div className="standard-form-row name-inputs" style={{ marginBottom: '1rem' }}>
                <input
                    type="text"
                    className="standard-modal-title editable"
                    value={member.firstName}
                    onChange={e => handleChange("firstName", e.target.value)}
                    placeholder="First Name"
                    disabled={saving}
                    required
                />
                <input
                    type="text"
                    className="standard-modal-title editable"
                    value={member.lastName}
                    onChange={e => handleChange("lastName", e.target.value)}
                    placeholder="Last Name"
                    disabled={saving}
                    required
                />
            </div>
            <div className="standard-form-row" style={{ marginBottom: '1.5rem' }}>
                <input
                    type="text"
                    value={member.relationshipType}
                    onChange={e => handleChange("relationshipType", e.target.value)}
                    placeholder="Relationship Type (e.g., Father, Mother, Sister...)"
                    disabled={saving}
                    className="standard-modal-description editable"
                />
            </div>

            {/* Form fields */}
            <div className="standard-modal-details-grid">
                <div className="standard-field-row">
                    <div className="standard-field-label">Date of Birth</div>
                    <input
                        type="date"
                        value={toDateInputValue(member.dateOfBirth)}
                        onChange={e => handleChange("dateOfBirth", e.target.value)}
                        disabled={saving}
                        className="standard-field-input"
                    />
                </div>

                {member.familyMemberId && member.userId !== localStorage.getItem("userId") && (
                    <div className="standard-field-row">
                        <div className="standard-field-label">Date of Death</div>
                        <input
                            type="date"
                            value={toDateInputValue(member.dateOfDeath)}
                            onChange={e => handleChange("dateOfDeath", e.target.value)}
                            disabled={saving}
                            className="standard-field-input"
                        />
                    </div>
                )}

                <div className="standard-field-row">
                    <div className="standard-field-label">Place of Birth</div>
                    <input
                        type="text"
                        value={member.placeOfBirth || ""}
                        onChange={e => handleChange("placeOfBirth", e.target.value)}
                        disabled={saving}
                        className="standard-field-input"
                    />
                </div>

                {member.familyMemberId && member.userId !== localStorage.getItem("userId") && (
                    <div className="standard-field-row">
                        <div className="standard-field-label">Place of Death</div>
                        <input
                            type="text"
                            value={member.placeOfDeath || ""}
                            onChange={e => handleChange("placeOfDeath", e.target.value)}
                            disabled={saving}
                            className="standard-field-input"
                        />
                    </div>
                )}

                <div className="standard-field-row">
                    <div className="standard-field-label">Occupation</div>
                    <input
                        type="text"
                        value={member.occupation || ""}
                        onChange={e => handleChange("occupation", e.target.value)}
                        disabled={saving}
                        className="standard-field-input"
                    />
                </div>

                <div className="standard-field-row">
                    <div className="standard-field-label">Nationality</div>
                    <input
                        type="text"
                        value={member.nationality || ""}
                        onChange={e => handleChange("nationality", e.target.value)}
                        disabled={saving}
                        className="standard-field-input"
                    />
                </div>

                <div className="standard-field-row">
                    <div className="standard-field-label">Religion</div>
                    <input
                        type="text"
                        value={member.religion || ""}
                        onChange={e => handleChange("religion", e.target.value)}
                        disabled={saving}
                        className="standard-field-input"
                    />
                </div>

                <div className="standard-field-row">
                    <div className="standard-field-label">Marital Status</div>
                    <input
                        type="text"
                        value={member.maritalStatus || ""}
                        onChange={e => handleChange("maritalStatus", e.target.value)}
                        disabled={saving}
                        className="standard-field-input"
                    />
                </div>

                <div className="standard-field-row">
                    <div className="standard-field-label">Gender</div>
                    <input
                        type="text"
                        value={member.gender || ""}
                        onChange={e => handleChange("gender", e.target.value)}
                        disabled={saving}
                        className="standard-field-input"
                    />
                </div>
            </div>

            {/* Relationship selectors */}
            <RelationSelector
                label="Parents"
                options={relationOptions}
                selectedIds={member.parentsIds || []}
                onSelect={(id, checked) => handleRelationSelect("parentsIds", id, checked)}
                excludeIds={[member.familyMemberId]}
            />
            <RelationSelector
                label="Children"
                options={relationOptions}
                selectedIds={member.childrenIds || []}
                onSelect={(id, checked) => handleRelationSelect("childrenIds", id, checked)}
                excludeIds={[member.familyMemberId]}
            />
            <RelationSelector
                label="Spouse(s)"
                options={relationOptions}
                selectedIds={member.spouseIds || []}
                onSelect={(id, checked) => handleRelationSelect("spouseIds", id, checked)}
                excludeIds={[member.familyMemberId]}
            />
        </StandardModal>
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
