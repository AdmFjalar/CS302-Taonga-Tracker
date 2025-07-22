import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { getFullImageUrl, formatDate, formatCurrency, truncateText } from "../../services/utils";
import { authAPI, familyAPI } from "../../services/api";
import Button from "../shared/Button";
import "../../styles/shared/StandardModal.css";

const placeholderImg = "https://placehold.co/40x40";

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
 * Component to display shared users with profile pictures
 */
const SharedUsersDisplay = ({ userIds }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!userIds || userIds.length === 0) {
        setUsers([]);
        setLoading(false);
        return;
      }

      try {
        // Fetch user details for each ID
        const userPromises = userIds.map(async (userId) => {
          try {
            const userDetails = await authAPI.getUserById(userId);
            return userDetails;
          } catch (error) {
            console.error(`Error fetching user ${userId}:`, error);
            return null;
          }
        });

        const userResults = await Promise.all(userPromises);
        setUsers(userResults.filter(user => user !== null));
      } catch (error) {
        console.error("Error fetching shared users:", error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [userIds]);

  if (loading) {
    return <div className="standard-field-value">Loading shared users...</div>;
  }

  if (users.length === 0) {
    return <div className="standard-field-value">No users shared with</div>;
  }

  return (
    <div className="standard-modal-related-list">
      {users.map(user => (
        <div key={user.userId} className="standard-modal-related-tag">
          <img
            src={user.profilePictureUrl ? getFullImageUrl(user.profilePictureUrl) : placeholderImg}
            alt={user.email}
            className="standard-modal-related-photo"
          />
          <span className="standard-modal-related-name">{user.email}</span>
        </div>
      ))}
    </div>
  );
};

/**
 * Component to display family member creator with profile picture
 */
const CreatorDisplay = ({ creatorId }) => {
  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCreator = async () => {
      if (!creatorId) {
        setCreator(null);
        setLoading(false);
        return;
      }

      try {
        const familyMembers = await familyAPI.getAll();
        const foundCreator = familyMembers.find(member => member.familyMemberId === creatorId);
        setCreator(foundCreator || null);
      } catch (error) {
        console.error("Error fetching creator:", error);
        setCreator(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCreator();
  }, [creatorId]);

  if (loading) {
    return <div className="standard-field-value">Loading creator...</div>;
  }

  if (!creator) {
    return <div className="standard-field-value">No creator specified</div>;
  }

  return (
    <div className="standard-modal-related-list">
      <div className="standard-modal-related-tag">
        <img
          src={creator.profilePictureUrl ? getFullImageUrl(creator.profilePictureUrl) : placeholderImg}
          alt={`${creator.firstName} ${creator.lastName}`}
          className="standard-modal-related-photo"
        />
        <span className="standard-modal-related-name">
          {creator.firstName} {creator.lastName}
        </span>
      </div>
    </div>
  );
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
          formatter={(val) => formatCurrency(val, item.currency)}
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
      </div>
    </div>

    {/* Creator and Shared Users Section */}
    <div className="standard-modal-related-section">
      {item.creatorId && (
        <div style={{ marginBottom: "1.5rem" }}>
          <div className="standard-modal-related-title">Creator</div>
          <CreatorDisplay creatorId={item.creatorId} />
        </div>
      )}

      {item.sharedWithIds && item.sharedWithIds.length > 0 && (
        <div>
          <div className="standard-modal-related-title">Shared With</div>
          <SharedUsersDisplay userIds={item.sharedWithIds} />
        </div>
      )}
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
          <p><strong>Shared With IDs:</strong> {item.sharedWithIds?.join(", ") || "N/A"}</p>
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
    currency: PropTypes.string,
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
