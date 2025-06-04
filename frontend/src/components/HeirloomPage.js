import React, { useState } from "react";
import { CreateItemPage, ViewItemPage } from "./ItemPages";
import Sidebar from "./SideBar";
import Header from "./Header";

export default function HeirloomPage() {
  const [items, setItems] = useState([]);
  const [adding, setAdding] = useState(false);
  const [viewIndex, setViewIndex] = useState(null);
  const [editIndex, setEditIndex] = useState(null);

  const handleAdd = (newItem) => {
    if (editIndex !== null) {
      const updated = [...items];
      updated[editIndex] = newItem;
      setItems(updated);
      setEditIndex(null);
      setViewIndex(editIndex);
    } else {
      const newIndex = items.length;
      setItems([...items, newItem]);
      setViewIndex(newIndex);
    }
    setAdding(false);
  };

  return (
    <div className="layout">
      <Sidebar />
      <div className="content-wrapper">
        <Header />
        <div className="heirloom-container">
          {!adding && viewIndex === null && (
            <>
              <div className="add-heirloom-header">
                <button onClick={() => setAdding(true)} className="auth-button">
                  Add Heirloom
                </button>
              </div>

              <div className="heirloom-grid">
                {items.map((item, index) => (
                  <div key={index} className="heirloom-card">
                    <img src={item.image} alt="" className="heirloom-img" />
                    <div className="heirloom-footer">
                      <p className="heirloom-name">{item.name}</p>
                      <div className="heirloom-actions">
                        <button
                          className="heirloom-view"
                          onClick={() => setViewIndex(index)}
                        >
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {adding && (
            <CreateItemPage
              onSave={handleAdd}
              initialItem={editIndex !== null ? items[editIndex] : null}
            />
          )}

          {viewIndex !== null && !adding && items[viewIndex] && (
            <ViewItemPage
              item={items[viewIndex]}
              onBack={() => setViewIndex(null)}
              onEdit={() => {
                setEditIndex(viewIndex);
                setAdding(true);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}