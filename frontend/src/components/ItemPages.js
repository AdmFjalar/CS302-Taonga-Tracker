import React, { useState } from "react";
import "./ItemPages.css";
import "./CreateItemPage.css";

const defaultItem = {
  name: "",
  date: "",
  tags: [],
  image: "https://placehold.co/275",
  description: "",
  story: "",
  documents: ""
};

export function CreateItemPage({ onSave, initialItem }) {
  const [item, setItem] = useState(initialItem || defaultItem);
  const [activeTab, setActiveTab] = useState("description");

  const handleChange = (field, value) => {
    setItem(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave({ ...item });
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "description":
        return (
          <textarea
            placeholder="Enter Description.."
            value={item.description}
            onChange={e => handleChange("description", e.target.value)}
          />
        );
      case "story":
        return (
          <textarea
            placeholder="Origin / Story.."
            value={item.story}
            onChange={e => handleChange("story", e.target.value)}
          />
        );
      case "documents":
        return (
          <textarea
            placeholder="Documents / Media Info.."
            value={item.documents}
            onChange={e => handleChange("documents", e.target.value)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="item-layout top-aligned">
      <div className="save-button-top">
        <button onClick={handleSave} className="auth-button">Save Heirloom</button>
      </div>

      <div className="item-header">
        <img src={item.image} alt="Item Preview" />
        <div className="item-meta">
          <div className="form-row">
            <b>Name:</b>
            <input value={item.name} onChange={e => handleChange("name", e.target.value)} />
          </div>
          <div className="form-row">
            <b>Date Added:</b>
            <input type="date" value={item.date} onChange={e => handleChange("date", e.target.value)} />
          </div>
          <div className="form-row">
            <b>Add Tags:</b>
            <input onChange={e => handleChange("tags", e.target.value.split(","))} placeholder="Comma-separated" />
          </div>
        </div>
      </div>

      <div className="tabs">
        <div className="tab-buttons">
          <button className={activeTab === "description" ? "active" : ""} onClick={() => setActiveTab("description")}>Description</button>
          <button className={activeTab === "story" ? "active" : ""} onClick={() => setActiveTab("story")}>Origin / Story</button>
          <button className={activeTab === "documents" ? "active" : ""} onClick={() => setActiveTab("documents")}>Documents / Media</button>
        </div>
        {renderTabContent()}
      </div>
    </div>
  );
}

export function ViewItemPage({ item, onBack, onEdit }) {
  const [activeTab, setActiveTab] = useState("description");

  const renderTabContent = () => {
    switch (activeTab) {
      case "description":
        return <div className="tab-text">{item.description || "No description provided."}</div>;
      case "story":
        return <div className="tab-text">{item.story || "No story provided."}</div>;
      case "documents":
        return <div className="tab-text">{item.documents || "No documents provided."}</div>;
      default:
        return null;
    }
  };

  return (
    <div className="item-layout top-aligned">
      <div className="save-button-top">
        <button onClick={onEdit} className="auth-button">Edit</button>
        <button onClick={onBack} className="auth-button">Back to List</button>
      </div>

      <div className="item-header">
        <img src={item.image} alt="Item Preview" />
        <div className="item-meta">
          <div className="form-row"><b>Name:</b> <span>{item.name}</span></div>
          <div className="form-row"><b>Date Added:</b> <span>{item.date}</span></div>
          <div className="form-row"><b>Tags:</b> <span>{item.tags?.join(", ")}</span></div>
        </div>
      </div>

      <div className="tabs">
        <div className="tab-buttons">
          <button className={activeTab === "description" ? "active" : ""} onClick={() => setActiveTab("description")}>Description</button>
          <button className={activeTab === "story" ? "active" : ""} onClick={() => setActiveTab("story")}>Origin / Story</button>
          <button className={activeTab === "documents" ? "active" : ""} onClick={() => setActiveTab("documents")}>Documents / Media</button>
        </div>
        <div className="tab-textarea">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}


