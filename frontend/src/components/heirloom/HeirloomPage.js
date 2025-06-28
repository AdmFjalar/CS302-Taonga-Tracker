import React, { useState, useEffect, useRef } from "react";
import { ItemView, ItemEdit } from "./ItemPages";
import AddItem from "./AddItem";
import LoadingScreen from "../ui/LoadingScreen";
import { getFullImageUrl } from "../../services/utils";
import Button from "../shared/Button";
import { HeirloomService } from "../../services/heirloom";
import "../../styles/heirloom/HeirloomPage.css";

/**
 * HeirloomPage displays a grid of heirloom items and allows adding, viewing, and editing.
 * @returns {JSX.Element} The heirloom page component
 */
const HeirloomPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(false);
  const [viewIndex, setViewIndex] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [wiggle, setWiggle] = useState(false);
  const wiggleTimeout = useRef();

  // Wiggle effect every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setWiggle(true);
      wiggleTimeout.current = setTimeout(() => setWiggle(false), 800); // match animation duration
    }, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(wiggleTimeout.current);
    };
  }, []);

  // Fetch heirloom items on mount
  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await HeirloomService.getAllItems();
        setItems(data);
      } catch (err) {
        setError(err.message || "Failed to fetch heirloom");
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  // Handle successful add
  const handleAdd = (newItemData) => {
    setItems((prev) => [...prev, newItemData]);
    setAdding(false);
    setEditingItem(null);
    setViewIndex(null);
  };

  // Handle successful edit
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

  // Retry loading items if failed
  const handleRetry = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await HeirloomService.getAllItems();
      setItems(data);
      setLoading(false);
    } catch (err) {
      setError(err.message || "Failed to fetch heirloom");
      setLoading(false);
    }
  };

  // Show loading screen while fetching data
  if (loading) {
    return <LoadingScreen message="Loading your precious heirlooms..." />;
  }

  // Show error state
  if (error) {
    return (
      <div className="error-container">
        <h2>Error Loading Heirlooms</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="heirloom-container">
      {/* Main grid view */}
      {!adding && viewIndex === null && (
        <div className="heirloom-grid">
          {/* Heirloom Cards */}
          {items.map((item, index) => (
            <div
              key={item.vaultItemId || index}
              className="heirloom-card"
              onClick={() => setViewIndex(index)}
              tabIndex={0}
              role="button"
              aria-label={`View ${item.title || "Heirloom"}`}
              onKeyPress={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setViewIndex(index);
                }
              }}
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
          ))}
          {/* Add Heirloom Card at the end */}
          <div
            className={`heirloom-card add-heirloom-card${
              wiggle ? " wiggle" : ""
            }`}
            onClick={() => {
              setAdding(true);
              setEditingItem(null);
            }}
            tabIndex={0}
            role="button"
            aria-label="Add Heirloom"
            onKeyPress={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                setAdding(true);
                setEditingItem(null);
              }
            }}
          >
            <div className="add-heirloom-plus" aria-hidden="true">
              +
            </div>
            <div className="heirloom-card-content">
              <h2>Add an Heirloom</h2>
              <p>Click to add a new heirloom to your collection.</p>
            </div>
          </div>
        </div>
      )}

      {/* Add Item Form */}
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

      {/* Edit Item Form */}
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

      {/* Item View Modal */}
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
  );
};

export default HeirloomPage;
