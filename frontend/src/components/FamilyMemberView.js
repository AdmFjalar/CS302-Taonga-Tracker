import React from "react";
import { getFullImageUrl } from "./utils";
import "./CreateItemPage.css";

const renderRelated = (ids, familyMembers) => {
    if (!ids || ids.length === 0) return <span>N/A</span>;
    return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {ids.map(id => {
                const fm = familyMembers.find(f => f.familyMemberId === id);
                if (!fm) return null;
                return (
                    <div key={id} style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        background: "#fff",
                        border: "1px solid #bcb88a",
                        borderRadius: 8,
                        padding: "2px 8px 2px 2px",
                        minWidth: 0,
                    }}>
                        <img
                            src={getFullImageUrl(fm.profilePictureUrl)}
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
                    </div>
                );
            })}
        </div>
    );
};

const FamilyMemberView = ({ member, familyMembers = [], onBack, onEdit }) => (
    <div className="item-layout item-edit-sleek">
        <div className="item-edit-top">
            <div className="item-edit-image">
                <img
                    src={getFullImageUrl(member.profilePictureUrl)}
                    alt="Profile"
                    className="item-edit-img-preview"
                />
            </div>
            <div className="item-edit-mainfields">
                <div className="form-row">
                    <span className="item-edit-title" style={{ border: "none", background: "none" }}>
                        {member.firstName} {member.middleNames?.join(" ")} {member.lastName}
                    </span>
                </div>
                <div className="form-row">
                    <div className="item-edit-description" style={{ background: "#f6f9f3", border: "none" }}>
                        {member.relationshipType || "No relationship specified."}
                    </div>
                </div>
            </div>
        </div>
        <div className="item-edit-bottom">
            <div className="item-edit-grid">
                <div className="form-row">
                    <b>Date of Birth:</b>
                    <span>{member.dateOfBirth?.slice(0, 10) || "N/A"}</span>
                </div>
                <div className="form-row">
                    <b>Date of Death:</b>
                    <span>{member.dateOfDeath?.slice(0, 10) || "N/A"}</span>
                </div>
                <div className="form-row">
                    <b>Gender:</b>
                    <span>{member.gender || "N/A"}</span>
                </div>
                <div className="form-row">
                    <b>Occupation:</b>
                    <span>{member.occupation || "N/A"}</span>
                </div>
                <div className="form-row">
                    <b>Place of Birth:</b>
                    <span>{member.placeOfBirth || "N/A"}</span>
                </div>
                <div className="form-row">
                    <b>Place of Death:</b>
                    <span>{member.placeOfDeath || "N/A"}</span>
                </div>
                <div className="form-row">
                    <b>Nationality:</b>
                    <span>{member.nationality || "N/A"}</span>
                </div>
                <div className="form-row">
                    <b>Religion:</b>
                    <span>{member.religion || "N/A"}</span>
                </div>
                <div className="form-row">
                    <b>Marital Status:</b>
                    <span>{member.maritalStatus || "N/A"}</span>
                </div>
                <div className="form-row">
                    <b>Parents:</b>
                    {renderRelated(member.parentsIds, familyMembers)}
                </div>
                <div className="form-row">
                    <b>Children:</b>
                    {renderRelated(member.childrenIds, familyMembers)}
                </div>
                <div className="form-row">
                    <b>Spouses:</b>
                    {renderRelated(member.spouseIds, familyMembers)}
                </div>
                <div className="form-row">
                    <b>Siblings:</b>
                    {renderRelated(member.siblingIds, familyMembers)}
                </div>
                <div className="form-row">
                    <b>User ID:</b>
                    <span>{member.userId || "N/A"}</span>
                </div>
                <div className="form-row">
                    <b>Family Member ID:</b>
                    <span>{member.familyMemberId || "N/A"}</span>
                </div>
            </div>
        </div>
        <div className="item-edit-actions">
            <button onClick={onEdit} className="auth-button">Edit</button>
            <button onClick={onBack} className="auth-button">Back</button>
        </div>
    </div>
);

export default FamilyMemberView;