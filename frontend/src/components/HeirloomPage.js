// src/components/HeirloomPage.js
import React, { useState, useEffect } from "react";
import { ItemView, ItemEdit } from "./ItemPages";
import AddItem from "./AddItem";
import Sidebar from "./SideBar";
import Header from "./Header";
import { getFullImageUrl } from "./utils";
import "./HeirloomPage.css";

const HeirloomPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(false);
  const [viewIndex, setViewIndex] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("authToken");
        if (!token) throw new Error("User is not logged in");
        const res = await fetch("http://localhost:5240/api/vaultitem", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch items");
        const data = await res.json();
        setItems(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  // Called after successful POST (add)
  const handleAdd = (newItemData) => {
    setItems((prev) => [...prev, newItemData]);
    setAdding(false);
    setEditingItem(null);
    setViewIndex(null);
  };

  // Called after successful PUT (edit)
  const handleEdit = (updatedItem) => {
    setItems((prev) =>
        prev.map((item) =>
            item.vaultItemId === updatedItem.vaultItemId ? updatedItem : item
        )
    );
    setAdding(false);
    setEditingItem(null);
    setViewIndex(null);
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
                        onClick={() => {
                          setAdding(true);
                          setEditingItem(null);
                        }}
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
                                onClick={() => setViewIndex(index)}
                            >
                              <img
                                  src={getFullImageUrl(item.photoUrl)}
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

            {/* Use AddItem for adding */}
            {adding && !editingItem && (
                <AddItem
                    navigateTo={() => {
                      setAdding(false);
                      setEditingItem(null);
                      setViewIndex(null);
                    }}
                    onSave={handleAdd}
                />
            )}

            {/* Use ItemEdit for editing */}
            {adding && editingItem && (
                <ItemEdit
                    onSave={handleEdit}
                    initialItem={editingItem}
                    navigateTo={() => {
                      setAdding(false);
                      setEditingItem(null);
                      setViewIndex(null);
                    }}
                />
            )}

            {viewIndex !== null && !adding && items[viewIndex] && (
                <ItemView
                    item={items[viewIndex]}
                    onBack={() => setViewIndex(null)}
                    onEdit={() => {
                      setEditingItem(items[viewIndex]);
                      setAdding(true);
                    }}
                />
            )}
          </div>
        </div>
      </div>
  );
};

export default HeirloomPage;