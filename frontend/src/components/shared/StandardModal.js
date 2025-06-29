import React from "react";
import PropTypes from "prop-types";
import Button from "./Button";
import "../../styles/shared/StandardModal.css";

/**
 * Standardized modal container for both viewing and editing family members and heirlooms
 * Provides consistent layout, background, width, and containment across all modals
 */
const StandardModal = ({
  isEdit = false,
  title,
  subtitle,
  photo,
  photoAlt,
  photoShape = "circular", // "circular" for family members, "rectangular" for heirlooms
  onPhotoUpload,
  uploading = false,
  uploadError,
  children,
  actions,
  onSubmit,
  className = ""
}) => {
  const handleSubmit = (e) => {
    if (onSubmit) {
      e.preventDefault();
      onSubmit(e);
    }
  };

  const content = (
    <div className={`standard-modal-container ${className}`}>
      {/* Header section with photo and primary info */}
      <div className="standard-modal-header">
        <div className={`standard-modal-photo-container ${photoShape}`}>
          {isEdit && onPhotoUpload ? (
            <label className="standard-modal-photo-upload" title="Click to upload a new image">
              <img
                src={photo}
                alt={photoAlt}
                className="standard-modal-photo"
              />
              <input
                type="file"
                accept="image/*"
                onChange={onPhotoUpload}
                disabled={uploading}
                style={{ display: "none" }}
              />
            </label>
          ) : (
            <img
              src={photo}
              alt={photoAlt}
              className="standard-modal-photo"
            />
          )}
          {uploading && <p className="standard-modal-uploading">Uploading...</p>}
          {uploadError && <p className="standard-modal-error">{uploadError}</p>}
        </div>

        <div className="standard-modal-primary-info">
          {title && (
            <div className="standard-modal-title-container">
              {title}
            </div>
          )}
          {subtitle && (
            <div className="standard-modal-subtitle">
              {subtitle}
            </div>
          )}
        </div>
      </div>

      {/* Content section - flexible for different field layouts */}
      <div className="standard-modal-content">
        {children}
      </div>

      {/* Actions section */}
      {actions && (
        <div className="standard-modal-actions">
          {actions}
        </div>
      )}
    </div>
  );

  // Wrap in form if it's an edit modal with onSubmit
  if (isEdit && onSubmit) {
    return (
      <form onSubmit={handleSubmit}>
        {content}
      </form>
    );
  }

  return content;
};

StandardModal.propTypes = {
  isEdit: PropTypes.bool,
  title: PropTypes.node,
  subtitle: PropTypes.node,
  photo: PropTypes.string.isRequired,
  photoAlt: PropTypes.string.isRequired,
  photoShape: PropTypes.oneOf(["circular", "rectangular"]),
  onPhotoUpload: PropTypes.func,
  uploading: PropTypes.bool,
  uploadError: PropTypes.string,
  children: PropTypes.node.isRequired,
  actions: PropTypes.node,
  onSubmit: PropTypes.func,
  className: PropTypes.string
};

export default StandardModal;
