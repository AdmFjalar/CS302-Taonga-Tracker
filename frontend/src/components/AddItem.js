// src/components/AddItem.js
import React from "react";
import ItemEdit from "./ItemEdit";

const AddItem = ({ navigateTo, onSave }) => {
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

    return <ItemEdit onSave={handleSave} navigateTo={navigateTo} />;
};

export default AddItem;