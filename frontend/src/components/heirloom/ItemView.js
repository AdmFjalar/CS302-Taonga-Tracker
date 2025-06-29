import React from "react";
import PropTypes from "prop-types";
import { getFullImageUrl, formatDate, formatCurrency, truncateText } from "../../services/utils";
import Button from "../shared/Button";
import "../../styles/shared/StandardModal.css";

/**
 * A field row for displaying item details
 */
const ItemDetailField = ({ label, value, formatter = (val) => val || "N/A" }) => (
  <div className="standard-field-row vertical">
    <div className="standard-field-label">{label}</div>
    <div className="standard-field-value">{formatter(value)}</div>
  </div>
);

ItemDetailField.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  formatter: PropTypes.func
};

/**
 * ItemView component displays a read-only view of a vault item/heirloom.
 */
const ItemView = ({ item, onBack, onEdit }) => (
  <div className="standard-modal-container">
    {/* Header Section */}
    <div className="standard-modal-header">
      <div className="standard-modal-photo-container rectangular">
        <img
          src={getFullImageUrl(item.photoUrl)}
          alt={item.title || "Item Preview"}
          className="standard-modal-photo"
        />
      </div>

      <div className="standard-modal-primary-info">
        <div className="standard-modal-title-container">
          <h2 className="standard-modal-title">
            {item.title || "Untitled Item"}
          </h2>
        </div>
        <div className="standard-modal-subtitle">
          {item.itemType || "Heirloom"}
        </div>
        {item.description && (
          <div className="standard-modal-description">
            {truncateText(item.description, 500)}
          </div>
        )}
      </div>
    </div>

    {/* Content Section */}
    <div className="standard-modal-content">
      <div className="standard-modal-details-grid">
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

    {/* Metadata section with collapsible details */}
    <div className="standard-metadata-section">
      <details>
        <summary className="standard-metadata-toggle">
          Metadata
        </summary>
        <div className="standard-metadata-content">
          <p><strong>Vault Item ID:</strong> {item.vaultItemId || "N/A"}</p>
          <p><strong>Current Owner ID:</strong> {item.currentOwnerId || "N/A"}</p>
          <p><strong>Creator ID:</strong> {item.creatorId || "N/A"}</p>
          <p><strong>Previous Owner IDs:</strong> {item.previousOwnerIds?.join(", ") || "N/A"}</p>
        </div>
      </details>
    </div>

    {/* Actions Section */}
    <div className="standard-modal-actions">
      <Button onClick={onBack} variant="secondary">
        Back
      </Button>
      <Button onClick={() => onEdit(item)} variant="primary">
        Edit
      </Button>
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
    previousOwnerIds: PropTypes.arrayOf(PropTypes.string)
  }).isRequired,
  onBack: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired
};

export default ItemView;
