import React from "react";
import FamilyMemberEdit from "./FamilyMemberEdit";

const FamilyMemberAdd = ({ familyMembers, onSave, onCancel, addContext }) => (
    <FamilyMemberEdit
        familyMembers={familyMembers}
        onSave={onSave}
        onCancel={onCancel}
        addContext={addContext}
    />
);

export default FamilyMemberAdd;