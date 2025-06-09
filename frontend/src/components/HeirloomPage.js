import React, { useState, useEffect } from "react";
import { CreateItemPage, ViewItemPage } from "./ItemPages";
import Sidebar from "./SideBar";
import Header from "./Header";
import "./HeirloomPage.css";

export default function HeirloomPage() {
  const [items, setItems] = useState([]); // Holds the list of items fetched from the backend
  const [loading, setLoading] = useState(true); // Adds loading indicator for initial fetch
  const [error, setError] = useState(null); // To handle any fetch errors
  const [adding, setAdding] = useState(false);
  const [viewIndex, setViewIndex] = useState(null);

  // Fetch items from the backend when the component mounts
  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("authToken");

        if (!token) {
          throw new Error("User is not logged in");
        }

        const res = await fetch("http://localhost:5240/api/vaultitem", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch items");
        }

        const data = await res.json();
        setItems(data); // Update the state with the fetched items
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  const handleAdd = (newItemData) => {
    const newItem = {
      vaultItemId: newItemData.vaultItemId, // Required
      currentOwnerId: newItemData.currentOwnerId, // Required
      title: newItemData.title, // Required
      currentOwnerUserId: newItemData.currentOwnerUserId, // Required
      creatorId: newItemData.creatorId || null,
      previousOwnerIds: newItemData.previousOwnerIds || null,
      estimatedValue: newItemData.estimatedValue || null,
      creationDate: newItemData.creationDate || null,
      dateAcquired: newItemData.dateAcquired || null,
      creationPlace: newItemData.creationPlace || null,
      itemType: newItemData.itemType || null,
      photoUrl: newItemData.photoUrl || null,
      description: newItemData.description || null,
      materials: newItemData.materials || null,
      craftType: newItemData.craftType || null,
      sharedWithIds: newItemData.sharedWithIds || null,
    };

    setItems([...items, newItem]);
  };

  if (loading) {
    return <div className="heirloom-container">Loading heirlooms...</div>;
  }

  if (error) {
    return (
      <div className="heirloom-container">
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="layout">
      <Sidebar />
      <div className="content-wrapper">
        <Header />

        <div className="heirloom-container">
          {!adding && viewIndex === null && (
            <>
              <div className="add-heirloom-header">
                <button
                  onClick={() => setAdding(true)}
                  className="heirloom-button"
                >
                  Add Heirloom
                </button>
              </div>

              <div className="heirloom-grid">
                {items.length === 0 ? (
                  <p>No heirlooms found. Click "Add Heirloom" to create one.</p>
                ) : (
                  items.map((item, index) => (
                    <div
                      key={index}
                      className="heirloom-card"
                      onClick={() => setViewIndex(index)} // Make card clickable
                    >
                      <img
                        src={item.photoUrl || "https://placehold.co/300x300"}
                        alt={item.title || "Heirloom"}
                        className="heirloom-img"
                      />
                      <div className="heirloom-card-content">
                        <h2>{item.title}</h2>
                        <p>{item.description || "No description available"}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {adding && (
            <CreateItemPage
              onSave={handleAdd}
              initialItem={null}
            />
          )}

          {viewIndex !== null && !adding && items[viewIndex] && (
            <ViewItemPage
              item={items[viewIndex]}
              onBack={() => setViewIndex(null)} // Set viewIndex back to null
              onEdit={() => setAdding(true)} // Trigger edit mode
            />
          )}
        </div>
      </div>
    </div>
  );
}