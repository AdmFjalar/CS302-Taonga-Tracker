import React, { useEffect, useState } from "react";
import ItemEdit from "./ItemEdit";
import { familyAPI, vaultAPI } from "../../services/api";

/**
 * AddItem component for creating a new heirloom/vault item.
 * Fetches family members for creator selection and handles item save.
 * @param {Object} props
 * @param {Function} props.navigateTo - Callback to navigate after save/cancel.
 * @param {Function} props.onSave - Callback after successful save.
 */
const AddItem = ({ navigateTo, onSave }) => {
    const [familyMembers, setFamilyMembers] = useState([]);

    useEffect(() => {
        // Fetch all family members for creator selection using the family API service
        const fetchFamilyMembers = async () => {
            try {
                const data = await familyAPI.getAll();
                setFamilyMembers(data);
            } catch (error) {
                console.error("Error fetching family members:", error);
            }
        };
        fetchFamilyMembers();
    }, []);

    /**
     * Handles saving a new item to the backend using the vault API service
     * @param {Object} item - The item to save.
     */
    const handleSave = async (item) => {
        try {
            const data = await vaultAPI.create(item);
            if (onSave) onSave(data);
            if (navigateTo) navigateTo();
        } catch (error) {
            alert("Failed to create item: " + error.message);
        }
    };

    return (
        <ItemEdit
            onSave={handleSave}
            navigateTo={navigateTo}
            familyMembers={familyMembers}
        />
    );
};

export default AddItem;