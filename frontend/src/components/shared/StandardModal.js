import React from "react";
import PropTypes from "prop-types";
import Button from "./Button";
import "../../styles/shared/StandardModal.css";

/**
 * Standardized modal container for viewing and editing content.
 * Provides consistent layout with photo upload, form handling, and action buttons.
 *
 * @param {Object} props - Component props
 * @param {boolean} [props.isEdit=false] - Whether modal is in edit mode
 * @param {string} props.title - Modal title
 * @param {string} [props.subtitle] - Optional subtitle
 * @param {string} props.photo - Photo URL to display
 * @param {string} props.photoAlt - Alt text for photo
 * @param {string} [props.photoShape='circular'] - Photo shape: 'circular' or 'rectangular'
 * @param {function} [props.onPhotoUpload] - Photo upload handler for edit mode
 * @param {boolean} [props.uploading=false] - Upload loading state
 * @param {string} [props.uploadError] - Upload error message
 * @param {React.ReactNode} props.children - Modal content
 * @param {React.ReactNode} props.actions - Action buttons
 * @param {function} [props.onSubmit] - Form submit handler
 * @param {string} [props.className=''] - Additional CSS classes
 * @returns {JSX.Element} Standard modal component
 */
const StandardModal = ({
  isEdit = false,
  title,
  subtitle,
  photo,
  photoAlt,
  photoShape = "circular",
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
      {/* Header with photo and title */}
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
        </div>

        <div className="standard-modal-title-section">
          <h2 className="standard-modal-title">{title}</h2>
          {subtitle && <p className="standard-modal-subtitle">{subtitle}</p>}
          {uploading && <p className="upload-status">Uploading image...</p>}
          {uploadError && <p className="upload-error">{uploadError}</p>}
        </div>
      </div>

      {/* Main content */}
      <div className="standard-modal-content">
        {children}
      </div>

      {/* Action buttons */}
      {actions && (
        <div className="standard-modal-actions">
          {actions}
        </div>
      )}
    </div>
  );

  // Wrap in form if edit mode with submit handler
  if (isEdit && onSubmit) {
    return (
      <div className="standard-modal-overlay">
        <form onSubmit={handleSubmit} className="standard-modal">
          {content}
        </form>
      </div>
    );
  }

  return (
    <div className="standard-modal-overlay">
      <div className="standard-modal">
        {content}
      </div>
    </div>
  );
};

StandardModal.propTypes = {
  isEdit: PropTypes.bool,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  photo: PropTypes.string.isRequired,
  photoAlt: PropTypes.string.isRequired,
  photoShape: PropTypes.oneOf(['circular', 'rectangular']),
  onPhotoUpload: PropTypes.func,
  uploading: PropTypes.bool,
  uploadError: PropTypes.string,
  children: PropTypes.node.isRequired,
  actions: PropTypes.node,
  onSubmit: PropTypes.func,
  className: PropTypes.string
};

export default StandardModal;
