import React from "react";
import PropTypes from "prop-types";
import { getFullImageUrl, formatDate } from "../../services/utils";
import Button from "../shared/Button";
import "../../styles/shared/StandardModal.css";

/**
 * Displays a related family member with photo and name
 */
const RelatedMemberTag = ({ member, onViewMember }) => {
  if (!member) return null;

  return (
    <div
      className="standard-modal-related-tag"
      onClick={() => onViewMember(member)}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === "Enter" || e.key === " ") onViewMember(member);
      }}
    >
      <img
        src={getFullImageUrl(member.profilePictureUrl)}
        alt={`${member.firstName} ${member.lastName}`}
        className="standard-modal-related-photo"
      />
      <span className="standard-modal-related-name">
        {member.firstName} {member.lastName}
      </span>
    </div>
  );
};

RelatedMemberTag.propTypes = {
  member: PropTypes.shape({
    firstName: PropTypes.string.isRequired,
    lastName: PropTypes.string.isRequired,
    profilePictureUrl: PropTypes.string
  }),
  onViewMember: PropTypes.func.isRequired
};

/**
 * Renders a list of related family members
 */
const RelatedMembers = ({ ids, familyMembers, onViewMember }) => {
  if (!ids || ids.length === 0) return <span>N/A</span>;

  return (
    <div className="standard-modal-related-list">
      {ids.map(id => {
        const member = familyMembers.find(f => f.familyMemberId === id);
        return member ? <RelatedMemberTag key={id} member={member} onViewMember={onViewMember} /> : null;
      })}
    </div>
  );
};

RelatedMembers.propTypes = {
  ids: PropTypes.arrayOf(PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number
  ])),
  familyMembers: PropTypes.array.isRequired,
  onViewMember: PropTypes.func.isRequired
};

/**
 * Field row for displaying family member details
 */
const DetailField = ({ label, children }) => (
  <div className="standard-field-row vertical">
    <div className="standard-field-label">{label}</div>
    <div className="standard-field-value">{children}</div>
  </div>
);

DetailField.propTypes = {
  label: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired
};

/**
 * Displays a read-only view of a family member's details.
 */
const FamilyMemberView = ({ member, familyMembers = [], onBack, onEdit, onViewMember }) => {
  // Format the relationship to the reference user for display
  const relationshipDisplay = () => {
    if (member.calculatedRelationship) {
      return member.calculatedRelationship;
    } else if (member.relationship) {
      return member.relationship;
    } else if (member.relationshipType) {
      return member.relationshipType;
    }
    return "No relationship specified.";
  };

  const handleViewMember = onViewMember || (() => {});

  return (
    <div className="standard-modal-container">
      {/* Header Section */}
      <div className="standard-modal-header">
        <div className="standard-modal-photo-container rectangular">
          <img
            src={getFullImageUrl(member.profilePictureUrl)}
            alt={`${member.firstName} ${member.lastName}`}
            className="standard-modal-photo"
          />
        </div>

        <div className="standard-modal-primary-info">
          <div className="standard-modal-title-container">
            <h2 className="standard-modal-title">
              {member.firstName} {member.middleNames?.join(" ")} {member.lastName}
            </h2>
          </div>
          <div className="standard-modal-subtitle">
            {relationshipDisplay()}
          </div>
          {member.bio && (
            <div className="standard-modal-description">
              {member.bio}
            </div>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="standard-modal-content">
        <div className="standard-modal-details-grid">
          <DetailField label="Date of Birth">
            {member.dateOfBirth ? formatDate(member.dateOfBirth) : "Not specified"}
          </DetailField>

          <DetailField label="Date of Death">
            {member.dateOfDeath ? formatDate(member.dateOfDeath) : "N/A"}
          </DetailField>

          <DetailField label="Place of Birth">
            {member.placeOfBirth || "Not specified"}
          </DetailField>

          <DetailField label="Place of Death">
            {member.placeOfDeath || "N/A"}
          </DetailField>

          <DetailField label="Occupation">
            {member.occupation || "Not specified"}
          </DetailField>

          <DetailField label="Nationality">
            {member.nationality || "Not specified"}
          </DetailField>

          <DetailField label="Religion">
            {member.religion || "Not specified"}
          </DetailField>

          <DetailField label="Marital Status">
            {member.maritalStatus || "Not specified"}
          </DetailField>

          <DetailField label="Gender">
            {member.gender || "Not specified"}
          </DetailField>
        </div>
      </div>

      {/* Family Relationships Section */}
      <div className="standard-modal-related-section">
        <h3 className="standard-modal-related-title">Family Relationships</h3>
        <div className="standard-modal-details-grid">
          <DetailField label="Parents">
            <RelatedMembers
              ids={member.parentIds || member.parentsIds}
              familyMembers={familyMembers}
              onViewMember={handleViewMember}
            />
          </DetailField>

          <DetailField label="Children">
            <RelatedMembers
              ids={member.childrenIds}
              familyMembers={familyMembers}
              onViewMember={handleViewMember}
            />
          </DetailField>

          <DetailField label="Spouses">
            <RelatedMembers
              ids={member.spouseIds}
              familyMembers={familyMembers}
              onViewMember={handleViewMember}
            />
          </DetailField>

          <DetailField label="Siblings">
            <RelatedMembers
              ids={member.siblingIds}
              familyMembers={familyMembers}
              onViewMember={handleViewMember}
            />
          </DetailField>
        </div>
      </div>

      {/* Actions Section */}
      <div className="standard-modal-actions">
        <Button onClick={onBack} variant="secondary">
          Back
        </Button>
        <Button onClick={() => onEdit(member)} variant="primary">
          Edit
        </Button>
      </div>
    </div>
  );
};

FamilyMemberView.propTypes = {
  member: PropTypes.shape({
    familyMemberId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    firstName: PropTypes.string.isRequired,
    middleNames: PropTypes.arrayOf(PropTypes.string),
    lastName: PropTypes.string.isRequired,
    dateOfBirth: PropTypes.string,
    dateOfDeath: PropTypes.string,
    gender: PropTypes.string,
    occupation: PropTypes.string,
    placeOfBirth: PropTypes.string,
    placeOfDeath: PropTypes.string,
    nationality: PropTypes.string,
    religion: PropTypes.string,
    maritalStatus: PropTypes.string,
    relationshipType: PropTypes.string,
    calculatedRelationship: PropTypes.string,
    relationship: PropTypes.string,
    parentsIds: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
    parentIds: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
    childrenIds: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
    spouseIds: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
    siblingIds: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
    profilePictureUrl: PropTypes.string
  }).isRequired,
  familyMembers: PropTypes.array,
  onBack: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onViewMember: PropTypes.func
};

export default FamilyMemberView;
