import React, { useState, useEffect } from "react";
import { ItemView, ItemEdit } from "./ItemPages";
import { getFullImageUrl } from "./utils";
import "./HomePage.css";

/**
 * Finds the oldest heirloom in the list.
 * @param {Array} items - List of items.
 * @returns {object|null} The oldest item or null.
 */
const findOldestHeirloom = (items) => {
  const withDate = items.filter(
      (item) => item.creationDate && !isNaN(new Date(item.creationDate))
  );
  if (withDate.length === 0) return null;
  return withDate.reduce((oldest, item) =>
      new Date(item.creationDate) < new Date(oldest.creationDate) ? item : oldest
  );
};

/**
 * Finds the most valuable heirloom in the list.
 * @param {Array} items - List of items.
 * @returns {object|null} The most valuable item or null.
 */
const findMostValuableHeirloom = (items) =>
    items.reduce((mostValuable, item) =>
        !mostValuable || (item.estimatedValue || 0) > (mostValuable.estimatedValue || 0)
            ? item
            : mostValuable, null
    );

/**
 * Home page component showing highlights and allowing item viewing.
 * @component
 * @returns {JSX.Element}
 */
const HomePage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [highlightedItems, setHighlightedItems] = useState({
    oldest: null,
    mostValuable: null,
  });
  const [selectedItem, setSelectedItem] = useState(null);
  const [editing, setEditing] = useState(false);
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
        setHighlightedItems({
          oldest: findOldestHeirloom(data),
          mostValuable: findMostValuableHeirloom(data),
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  // Handle save after edit
  const handleEditSave = (updatedItem) => {
    setItems((prev) =>
        prev.map((item) =>
            item.vaultItemId === updatedItem.vaultItemId ? updatedItem : item
        )
    );
    setEditing(false);
    setEditingItem(null);
    setSelectedItem(updatedItem);
  };

  if (loading) {
    return <div className="home-container">Loading homepage...</div>;
  }

  if (error) {
    return (
        <div className="home-container">
          <p>Error: {error}</p>
        </div>
    );
  }

  return (
      <div className="layout">
        <div className="content-wrapper">
          {!selectedItem && !editing ? (
              <div className="home-container">
                <h1 className="home-title">Heirloom Highlights</h1>
                <div className="highlight-section">
                  {highlightedItems.oldest && (
                      <div
                          className="highlight-card"
                          onClick={() => setSelectedItem(highlightedItems.oldest)}
                          tabIndex={0}
                          role="button"
                          aria-label="View oldest heirloom"
                      >
                        <h2>Oldest Heirloom</h2>
                        <img
                            src={getFullImageUrl(highlightedItems.oldest.photoUrl)}
                            alt={highlightedItems.oldest.title || "Oldest Heirloom"}
                        />
                        <p><b>Title:</b> {highlightedItems.oldest.title || "Unknown"}</p>
                        <p><b>Creation Date:</b> {highlightedItems.oldest.creationDate || "N/A"}</p>
                        <p><b>Description:</b> {highlightedItems.oldest.description || "No description available."}</p>
                      </div>
                  )}
                  {highlightedItems.mostValuable && (
                      <div
                          className="highlight-card"
                          onClick={() => setSelectedItem(highlightedItems.mostValuable)}
                          tabIndex={0}
                          role="button"
                          aria-label="View most valuable heirloom"
                      >
                        <h2>Most Valuable Heirloom</h2>
                        <img
                            src={getFullImageUrl(highlightedItems.mostValuable.photoUrl)}
                            alt={highlightedItems.mostValuable.title || "Most Valuable Heirloom"}
                        />
                        <p><b>Title:</b> {highlightedItems.mostValuable.title || "Unknown"}</p>
                        <p><b>Estimated Value:</b> ${highlightedItems.mostValuable.estimatedValue || "N/A"}</p>
                        <p><b>Description:</b> {highlightedItems.mostValuable.description || "No description available."}</p>
                      </div>
                  )}
                </div>
              </div>
          ) : editing && editingItem ? (
              <ItemEdit
                  initialItem={editingItem}
                  onSave={handleEditSave}
                  navigateTo={() => {
                    setEditing(false);
                    setEditingItem(null);
                    setSelectedItem(editingItem);
                  }}
              />
          ) : (
              <ItemView
                  item={selectedItem}
                  onBack={() => setSelectedItem(null)}
                  onEdit={() => {
                    setEditingItem(selectedItem);
                    setEditing(true);
                  }}
              />
          )}
        </div>
      </div>
  );
};

export default HomePage;