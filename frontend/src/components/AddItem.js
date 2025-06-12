import React, { useEffect, useState } from "react";
import ItemEdit from "./ItemEdit";

const AddItem = ({ navigateTo, onSave }) => {
    const [familyMembers, setFamilyMembers] = useState([]);

    useEffect(() => {
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