import React from "react";
import PropTypes from "prop-types";
import { getFullImageUrl, formatDate, formatCurrency, truncateText } from "../../services/utils";
import "../../styles/heirloom/CreateItemPage.css"; // Fixed CSS reference from CreateItemPage.css to ItemPages.css
import "../../styles/heirloom/ItemPages.css"

/**
 * A field row for displaying item details
 * @param {Object} props
 * @param {string} props.label - Label for the field
 * @param {string|number} props.value - Value to display
 * @param {Function} [props.formatter] - Optional formatter function
 * @returns {JSX.Element}
 */
const ItemDetailField = ({ label, value, formatter = (val) => val || "N/A" }) => (
  <div className="form-row">
    <b>{label}:</b>
    <span>{formatter(value)}</span>
  </div>
);

ItemDetailField.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  formatter: PropTypes.func
};

/**
 * ItemView component displays a read-only view of a vault item/heirloom.
 * @param {Object} props
 * @param {Object} props.item - The item to display
 * @param {Function} props.onBack - Callback for back button
 * @param {Function} props.onEdit - Callback for edit button
 * @returns {JSX.Element}
 */
const ItemView = ({ item, onBack, onEdit }) => (
  <div className="item-layout item-edit-sleek">
    {/* Top Section: Image, Title, Description */}
    <div className="item-edit-top">
      <div className="item-edit-image">
        <img
          src={getFullImageUrl(item.photoUrl)}
          alt={item.title || "Item Preview"}
          className="item-edit-img-preview"
        />
      </div>
      <div className="item-edit-mainfields">
        <div className="form-row">
          <span className="item-edit-title" style={{ border: "none", background: "none" }}>
            {item.title || "Untitled Item"}
          </span>
        </div>
        <div className="form-row">
          <div className="item-edit-description" style={{ background: "#f6f9f3", border: "none" }}>
            {truncateText(item.description, 500) || "No description available."}
          </div>
        </div>
      </div>
    </div>

    {/* Bottom Section: Details */}
    <div className="item-edit-bottom">
      <div className="item-edit-grid">
        <ItemDetailField
          label="Estimated Value"
          value={item.estimatedValue}
          formatter={(val) => formatCurrency(val)}
        />
        <ItemDetailField
          label="Creation Date"
          value={item.creationDate}
          formatter={(val) => formatDate(val)}
        />
        <ItemDetailField
          label="Date Acquired"
          value={item.dateAcquired}
          formatter={(val) => formatDate(val)}
        />
        <ItemDetailField label="Creation Place" value={item.creationPlace} />
        <ItemDetailField label="Item Type" value={item.itemType} />
        <ItemDetailField
          label="Materials"
          value={item.materials?.join(", ")}
        />
        <ItemDetailField
          label="Craft Type"
          value={item.craftType?.join(", ")}
        />
        <ItemDetailField
          label="Shared With"
          value={item.sharedWithIds?.join(", ")}
        />
      </div>
    </div>

    {/* Metadata Tooltip */}
    <div className="metadata-tooltip">
      <span className="metadata-link">Metadata</span>
      <div className="tooltip-text">
        <p><b>Vault Item ID:</b> {item.vaultItemId || "N/A"}</p>
        <p><b>Current Owner ID:</b> {item.currentOwnerId || "N/A"}</p>
        <p><b>Creator ID:</b> {item.creatorId || "N/A"}</p>
        <p>
          <b>Previous Owner IDs:</b>
          {item.previousOwnerIds?.length ? item.previousOwnerIds.join(", ") : "N/A"}
        </p>
        <p>
          <b>Shared With IDs:</b>
          {item.sharedWithIds?.length ? item.sharedWithIds.join(", ") : "N/A"}
        </p>
      </div>
    </div>

    {/* Action Buttons */}
    <div className="item-edit-actions">
      <button onClick={onEdit} className="auth-button">Edit</button>
      <button onClick={onBack} className="auth-button">Back</button>
    </div>
  </div>
);

ItemView.propTypes = {
  item: PropTypes.shape({
    vaultItemId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    title: PropTypes.string,
    description: PropTypes.string,
    photoUrl: PropTypes.string,
    estimatedValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    creationDate: PropTypes.string,
    dateAcquired: PropTypes.string,
    creationPlace: PropTypes.string,
    itemType: PropTypes.string,
    materials: PropTypes.arrayOf(PropTypes.string),
    craftType: PropTypes.arrayOf(PropTypes.string),
    sharedWithIds: PropTypes.arrayOf(PropTypes.string),
    currentOwnerId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    creatorId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    previousOwnerIds: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  onBack: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired
};

export default ItemView;