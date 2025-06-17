import React from "react";
import PropTypes from "prop-types";
import { getFullImageUrl, formatDate } from "../../services/utils";
import Button from "../shared/Button";
import "../../styles/family/FamilyMemberView.css";

/**
 * Displays a related family member with photo and name
 * Now clickable to view that family member's details
 *
 * @param {Object} props - Component props
 * @param {Object} props.member - The family member data
 * @param {Function} props.onViewMember - Callback when clicking on the member
 * @returns {JSX.Element|null} The related member display or null if member not found
 */
const RelatedMemberTag = ({ member, onViewMember }) => {
  if (!member) return null;

  return (
    <div
      className="related-member-tag"
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
        className="related-member-photo"
      />
      <span className="related-member-name">
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
 * Renders a list of related family members (e.g., parents, children, spouses, siblings).
 *
 * @param {Object} props - Component props
 * @param {Array} props.ids - Array of related member IDs
 * @param {Array} props.familyMembers - All family members
 * @param {Function} props.onViewMember - Callback when clicking on a member
 * @returns {JSX.Element} The list of related family members
 */
const RelatedMembers = ({ ids, familyMembers, onViewMember }) => {
  if (!ids || ids.length === 0) return <span>N/A</span>;

  return (
    <div className="related-members-list">
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
 *
 * @param {Object} props - Component props
 * @param {string} props.label - Field label
 * @param {ReactNode} props.children - Field content
 * @returns {JSX.Element} Detail field component
 */
const DetailField = ({ label, children }) => (
  <div className="detail-field">
    <b>{label}:</b>
    <div className="detail-value">{children}</div>
  </div>
);

DetailField.propTypes = {
  label: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired
};

/**
 * Displays a read-only view of a family member's details.
 *
 * @param {Object} props - Component props
 * @param {Object} props.member - The family member to display
 * @param {Array} props.familyMembers - All family members (for relationship rendering)
 * @param {Function} props.onBack - Callback for closing the view
 * @param {Function} props.onEdit - Callback for editing the member
 * @param {Function} props.onViewMember - Callback for viewing another member
 * @returns {JSX.Element} The family member view
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

  // Use the passed onViewMember or default to no-op function
  const handleViewMember = onViewMember || (() => {});

  return (
    <div className="family-member-view">
      <div className="member-header">
        <div className="member-photo-container">
          <img
            src={getFullImageUrl(member.profilePictureUrl)}
            alt={`${member.firstName} ${member.lastName}`}
            className="member-photo"
          />
        </div>

        <div className="member-primary-info">
          <h2 className="member-name">
            {member.firstName} {member.middleNames?.join(" ")} {member.lastName}
          </h2>
          <div className="member-relationship">
            {relationshipDisplay()}
          </div>
        </div>
      </div>

      <div className="member-details">
        <div className="details-grid">
          <DetailField label="Date of Birth">
            {formatDate(member.dateOfBirth)}
          </DetailField>

          <DetailField label="Date of Death">
            {formatDate(member.dateOfDeath)}
          </DetailField>

          <DetailField label="Gender">
            {member.gender || "N/A"}
          </DetailField>

          <DetailField label="Occupation">
            {member.occupation || "N/A"}
          </DetailField>

          <DetailField label="Place of Birth">
            {member.placeOfBirth || "N/A"}
          </DetailField>

          <DetailField label="Place of Death">
            {member.placeOfDeath || "N/A"}
          </DetailField>

          <DetailField label="Nationality">
            {member.nationality || "N/A"}
          </DetailField>

          <DetailField label="Religion">
            {member.religion || "N/A"}
          </DetailField>

          <DetailField label="Marital Status">
            {member.maritalStatus || "N/A"}
          </DetailField>
        </div>

        <div className="relationships-section">
          <h3>Family Relationships</h3>

          <DetailField label="Parents">
            <RelatedMembers ids={member.parentsIds} familyMembers={familyMembers} onViewMember={handleViewMember} />
          </DetailField>

          <DetailField label="Children">
            <RelatedMembers ids={member.childrenIds} familyMembers={familyMembers} onViewMember={handleViewMember} />
          </DetailField>

          <DetailField label="Spouses">
            <RelatedMembers ids={member.spouseIds} familyMembers={familyMembers} onViewMember={handleViewMember} />
          </DetailField>

          <DetailField label="Siblings">
            <RelatedMembers ids={member.siblingIds} familyMembers={familyMembers} onViewMember={handleViewMember} />
          </DetailField>

          {/* Extended family sections */}
          {member.parentInLawIds && member.parentInLawIds.length > 0 && (
            <DetailField label="Parents-In-Law">
              <RelatedMembers ids={member.parentInLawIds} familyMembers={familyMembers} onViewMember={handleViewMember} />
            </DetailField>
          )}

          {member.siblingInLawIds && member.siblingInLawIds.length > 0 && (
            <DetailField label="Siblings-In-Law">
              <RelatedMembers ids={member.siblingInLawIds} familyMembers={familyMembers} onViewMember={handleViewMember} />
            </DetailField>
          )}

          {member.childInLawIds && member.childInLawIds.length > 0 && (
            <DetailField label="Children-In-Law">
              <RelatedMembers ids={member.childInLawIds} familyMembers={familyMembers} onViewMember={handleViewMember} />
            </DetailField>
          )}
        </div>

        <div className="system-info">
          <h4>System Information</h4>
          <DetailField label="User ID">
            {member.userId || "N/A"}
          </DetailField>

          <DetailField label="Family Member ID">
            {member.familyMemberId || "N/A"}
          </DetailField>
        </div>
      </div>

      <div className="member-actions">
        <Button onClick={onEdit}>Edit</Button>
        <Button variant="secondary" onClick={onBack}>Back</Button>
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
    childrenIds: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
    spouseIds: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
    siblingIds: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
    parentInLawIds: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
    siblingInLawIds: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
    childInLawIds: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
    profilePictureUrl: PropTypes.string
  }).isRequired,
  familyMembers: PropTypes.array,
  onBack: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onViewMember: PropTypes.func
};

export default FamilyMemberView;

