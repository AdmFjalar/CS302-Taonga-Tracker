import React from "react";
import PropTypes from "prop-types";
import FamilyMemberEdit from "./FamilyMemberEdit";

/**
 * FamilyMemberAdd is a wrapper for FamilyMemberEdit, used to add a new family member.
 * Passes down all props to FamilyMemberEdit, including addContext for parent/child context.
 *
 * @component
 * @param {Object} props
 * @param {Array} props.familyMembers - All family members for relationship selection.
 * @param {Function} props.onSave - Callback after saving.
 * @param {Function} props.onCancel - Callback for cancel action.
 * @param {Object} props.addContext - Context for adding parent/child.
 * @returns {JSX.Element} The FamilyMemberEdit component configured for adding mode
 */
const FamilyMemberAdd = ({ familyMembers, onSave, onCancel, addContext }) => (
    <FamilyMemberEdit
        familyMembers={familyMembers}
        onSave={onSave}
        onCancel={onCancel}
        addContext={addContext}
    />
);

FamilyMemberAdd.propTypes = {
    familyMembers: PropTypes.array,
    onSave: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    addContext: PropTypes.object
};

export default FamilyMemberAdd;
