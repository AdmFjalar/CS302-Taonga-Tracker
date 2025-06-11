import React from "react";
import { getFullImageUrl } from "./utils";
import "./CreateItemPage.css"; // Reuse the sleek styles

const FamilyMemberView = ({ member, onBack, onEdit }) => (
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
            {member.firstName} {member.lastName}
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
                    <b>Occupation:</b>
                    <span>{member.occupation || "N/A"}</span>
                </div>
                <div className="form-row">
                    <b>Place of Birth:</b>
                    <span>{member.placeOfBirth || "N/A"}</span>
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
            </div>
        </div>
        <div className="item-edit-actions">
            <button onClick={onEdit} className="auth-button">Edit</button>
            <button onClick={onBack} className="auth-button">Back</button>
        </div>
    </div>
);

export default FamilyMemberView;