import React, { useEffect, useState } from "react";
import ItemEdit from "./ItemEdit";

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
        // Fetch all family members for creator selection
        const fetchFamilyMembers = async () => {
            const token = localStorage.getItem("authToken");
            const res = await fetch("http://localhost:5240/api/familymember", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                setFamilyMembers(await res.json());
            }
        };
        fetchFamilyMembers();
    }, []);

    /**
     * Handles saving a new item to the backend.
     * @param {Object} item - The item to save.
     */
    const handleSave = async (item) => {
        const token = localStorage.getItem("authToken");
        const res = await fetch("http://localhost:5240/api/vaultitem", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(item),
        });
        if (!res.ok) {
            alert("Failed to create item");
            return;
        }
        const data = await res.json();
        if (onSave) onSave(data);
        if (navigateTo) navigateTo();
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