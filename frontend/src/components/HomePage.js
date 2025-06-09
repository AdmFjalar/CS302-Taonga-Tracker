import React, { useState, useEffect } from "react";
import Sidebar from "./SideBar";
import Header from "./Header";
import { ViewItemPage } from "./ItemPages"; // Import the ViewItemPage
import "./HomePage.css";

const HomePage = () => {
  const [items, setItems] = useState([]); // Fetched items from backend
  const [loading, setLoading] = useState(true); // Loading indicator
  const [error, setError] = useState(null); // For error handling

  const [highlightedItems, setHighlightedItems] = useState({
    oldest: null,
    mostValuable: null,
  });

  const [selectedItem, setSelectedItem] = useState(null); // Tracks item to display in ViewItemPage

  // Fetch items when the homepage loads
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

        // Setting fetched items and computed highlighted items
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

  // Calculate the oldest heirloom
  const findOldestHeirloom = (items) => {
    return items.reduce((oldest, item) => {
      if (!oldest || new Date(item.creationDate) < new Date(oldest.creationDate)) {
        return item;
      }
      return oldest;
    }, null);
  };

  // Calculate the most valuable heirloom
  const findMostValuableHeirloom = (items) => {
    return items.reduce((mostValuable, item) => {
      if (!mostValuable || (item.estimatedValue || 0) > (mostValuable.estimatedValue || 0)) {
        return item;
      }
      return mostValuable;
    }, null);
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
      <Sidebar />
      <div className="content-wrapper">
        <Header />

        {!selectedItem ? ( // Show homepage content when no item is selected
          <div className="home-container">
            <h1 className="home-title">Heirloom Highlights</h1>

            <div className="highlight-section">
              {highlightedItems.oldest && (
                <div
                  className="highlight-card"
                  onClick={() => setSelectedItem(highlightedItems.oldest)}
                >
                  <h2>Oldest Heirloom</h2>
                  <img
                    src={highlightedItems.oldest.photoUrl || "https://placehold.co/275"}
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
                  onClick={() => setSelectedItem(highlightedItems.mostValuable)} // Set the selected item
                >
                  <h2>Most Valuable Heirloom</h2>
                  <img
                    src={highlightedItems.mostValuable.photoUrl || "https://placehold.co/275"}
                    alt={highlightedItems.mostValuable.title || "Most Valuable Heirloom"}
                  />
                  <p><b>Title:</b> {highlightedItems.mostValuable.title || "Unknown"}</p>
                  <p><b>Estimated Value:</b> ${highlightedItems.mostValuable.estimatedValue || "N/A"}</p>
                  <p><b>Description:</b> {highlightedItems.mostValuable.description || "No description available."}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <ViewItemPage
            item={selectedItem}
            onBack={() => setSelectedItem(null)} // Reset selected item to go back to highlights
            onEdit={() => console.log("Edit functionality can go here")}
          />
        )}
      </div>
    </div>
  );
};

export default HomePage;