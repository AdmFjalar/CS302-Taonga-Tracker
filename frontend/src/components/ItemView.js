import React from "react";
import { getFullImageUrl } from "./utils";
import "./CreateItemPage.css";

const ItemView = ({ item, onBack, onEdit }) => (
    <div className="item-layout item-edit-sleek">
        {/* Top Section: Image, Title, Description */}
        <div className="item-edit-top">
            <div className="item-edit-image">
                <img
                    src={getFullImageUrl(item.photoUrl)}
                    alt="Item Preview"
                    className="item-edit-img-preview"
                />
            </div>
            <div className="item-edit-mainfields">
                <div className="form-row">
                    <span className="item-edit-title" style={{ border: "none", background: "none" }}>
                        {item.title}
                    </span>
                </div>
                <div className="form-row">
                    <div className="item-edit-description" style={{ background: "#f6f9f3", border: "none" }}>
                        {item.description || "No description available."}
                    </div>
                </div>
            </div>
        </div>

        {/* Bottom Section: Details */}
        <div className="item-edit-bottom">
            <div className="item-edit-grid">
                <div className="form-row">
                    <b>Estimated Value:</b>
                    <span>{item.estimatedValue || "N/A"}</span>
                </div>
                <div className="form-row">
                    <b>Creation Date:</b>
                    <span>{item.creationDate || "N/A"}</span>
                </div>
                <div className="form-row">
                    <b>Date Acquired:</b>
                    <span>{item.dateAcquired || "N/A"}</span>
                </div>
                <div className="form-row">
                    <b>Creation Place:</b>
                    <span>{item.creationPlace || "N/A"}</span>
                </div>
                <div className="form-row">
                    <b>Item Type:</b>
                    <span>{item.itemType || "N/A"}</span>
                </div>
                <div className="form-row">
                    <b>Materials:</b>
                    <span>{item.materials?.join(", ") || "N/A"}</span>
                </div>
                <div className="form-row">
                    <b>Craft Type:</b>
                    <span>{item.craftType?.join(", ") || "N/A"}</span>
                </div>
                <div className="form-row">
                    <b>Shared With:</b>
                    <span>{item.sharedWithIds?.join(", ") || "N/A"}</span>
                </div>
            </div>
        </div>

        {/* Action Buttons */}
        <div className="item-edit-actions">
            <button onClick={onEdit} className="auth-button">Edit</button>
            <button onClick={onBack} className="auth-button">Back</button>
        </div>

        {/* Metadata Tooltip */}
        <div className="metadata-tooltip">
            <span className="metadata-link">Metadata</span>
            <div className="tooltip-text">
                <p><b>Vault Item ID:</b> {item.vaultItemId || "N/A"}</p>
                <p><b>Current Owner ID:</b> {item.currentOwnerId || "N/A"}</p>
                <p><b>Creator ID:</b> {item.creatorId || "N/A"}</p>
                <p><b>Previous Owner IDs:</b> {item.previousOwnerIds?.length ? item.previousOwnerIds.join(", ") : "N/A"}</p>
                <p><b>Shared With IDs:</b> {item.sharedWithIds?.length ? item.sharedWithIds.join(", ") : "N/A"}</p>
            </div>
        </div>
    </div>
);

export default ItemView;