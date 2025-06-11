import React from "react";
import FamilyMemberEdit from "./FamilyMemberEdit";

const FamilyMemberAdd = ({ familyMembers, onSave, onCancel }) => (
    <FamilyMemberEdit
        familyMembers={familyMembers}
        onSave={onSave}
        onCancel={onCancel}
    />
);

export default FamilyMemberAdd;