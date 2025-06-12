import React, { useEffect, useState } from "react";
import { ItemView, ItemEdit } from "./ItemPages";
import FamilyMemberEdit from "./FamilyMemberEdit";
import FamilyMemberView from "./FamilyMemberView";
import { getFullImageUrl, toDateInputValue } from "./utils";
import "./HomePage.css";

/**
 * Finds the oldest recorded and oldest living family members.
 * @param {Array} members - List of family members.
 * @returns {{oldest: object|null, oldestLiving: object|null}}
 */
function getOldestMembers(members) {
  if (!members || members.length === 0) return { oldest: null, oldestLiving: null };
  const valid = members.filter(m => m.dateOfBirth);
  if (valid.length === 0) return { oldest: null, oldestLiving: null };
  const oldest = valid.reduce((a, b) =>
      new Date(a.dateOfBirth) < new Date(b.dateOfBirth) ? a : b, valid[0]
  );
  const living = valid.filter(m => !m.dateOfDeath);
  const oldestLiving = living.length > 0
      ? living.reduce((a, b) =>
          new Date(a.dateOfBirth) < new Date(b.dateOfBirth) ? a : b, living[0]
      )
      : null;
  return { oldest, oldestLiving };
}

const findOldestHeirloom = (items) =>
    items.reduce((oldest, item) =>
            (!oldest || (item.creationDate && new Date(item.creationDate) < new Date(oldest.creationDate)))
                ? item
                : oldest,
        null
    );

const findMostValuableHeirloom = (items) =>
    items.reduce((mostValuable, item) =>
            (!mostValuable || (item.estimatedValue && item.estimatedValue > mostValuable.estimatedValue))
                ? item
                : mostValuable,
        null
    );

const HomePage = () => {
  const [items, setItems] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [highlighted, setHighlighted] = useState({ oldest: null, oldestLiving: null });
  const [selectedItem, setSelectedItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [editingMember, setEditingMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  useEffect(() => {
    const fetchFamilyMembers = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const res = await fetch("http://localhost:5240/api/familymember", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setFamilyMembers(data);
          setHighlighted(getOldestMembers(data));
        }
      } catch (err) {
        // Optionally handle error
      }
    };
    fetchFamilyMembers();
  }, []);

  const oldestHeirloom = findOldestHeirloom(items);
  const mostValuableHeirloom = findMostValuableHeirloom(items);

  // Save handler for heirlooms
  const handleEditSave = (updatedItem) => {
    setItems((prev) =>
        prev.map((item) =>
            item.vaultItemId === updatedItem.vaultItemId ? updatedItem : item
        )
    );
    setEditingItem(null);
    setSelectedItem(updatedItem);
  };

  // Save handler for family members
  const handleMemberSave = (updatedMember) => {
    setFamilyMembers((prev) =>
        prev.map((m) =>
            m.familyMemberId === updatedMember.familyMemberId ? updatedMember : m
        )
    );
    setEditingMember(null);
    setSelectedMember(updatedMember);
    setHighlighted(getOldestMembers(
        familyMembers.map((m) =>
            m.familyMemberId === updatedMember.familyMemberId ? updatedMember : m
        )
    ));
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
          {/* Main highlights view */}
          {!selectedItem && !editingItem && !selectedMember && !editingMember ? (
              <div className="home-container">
                <h1 className="home-title">Welcome to Your Family Archive</h1>
                <div className="highlight-section">
                  {highlighted.oldest && (
                      <div
                          className="highlight-card"
                          onClick={() => setSelectedMember(highlighted.oldest)}
                          tabIndex={0}
                          role="button"
                          aria-label="View oldest relative"
                      >
                        <h2>Oldest Recorded Family Member</h2>
                        <img
                            src={getFullImageUrl(highlighted.oldest.profilePictureUrl)}
                            alt={`${highlighted.oldest.firstName} ${highlighted.oldest.lastName}`}
                            style={{ width: 120, height: 120, objectFit: "cover", borderRadius: "50%", marginBottom: 12, border: "2px solid #bcb88a", background: "#fff" }}
                        />
                        <p>
                          <b>{highlighted.oldest.firstName} {highlighted.oldest.lastName}</b>
                        </p>
                        <p>
                          Born: {toDateInputValue(highlighted.oldest.dateOfBirth)}
                          {highlighted.oldest.dateOfDeath && (
                              <> &ndash; Died: {toDateInputValue(highlighted.oldest.dateOfDeath)}</>
                          )}
                        </p>
                        {highlighted.oldest.relationshipType && (
                            <p>Relationship: {highlighted.oldest.relationshipType}</p>
                        )}
                      </div>
                  )}
                  {highlighted.oldestLiving && (
                      <div
                          className="highlight-card"
                          onClick={() => setSelectedMember(highlighted.oldestLiving)}
                          tabIndex={0}
                          role="button"
                          aria-label="View oldest living relative"
                      >
                        <h2>Oldest Living Family Member</h2>
                        <img
                            src={getFullImageUrl(highlighted.oldestLiving.profilePictureUrl)}
                            alt={`${highlighted.oldestLiving.firstName} ${highlighted.oldestLiving.lastName}`}
                            style={{ width: 120, height: 120, objectFit: "cover", borderRadius: "50%", marginBottom: 12, border: "2px solid #bcb88a", background: "#fff" }}
                        />
                        <p>
                          <b>{highlighted.oldestLiving.firstName} {highlighted.oldestLiving.lastName}</b>
                        </p>
                        <p>
                          Born: {toDateInputValue(highlighted.oldestLiving.dateOfBirth)}
                        </p>
                        {highlighted.oldestLiving.relationshipType && (
                            <p>Relationship: {highlighted.oldestLiving.relationshipType}</p>
                        )}
                      </div>
                  )}
                  {oldestHeirloom && (
                      <div
                          className="highlight-card"
                          onClick={() => setSelectedItem(oldestHeirloom)}
                          tabIndex={0}
                          role="button"
                          aria-label="View oldest heirloom"
                      >
                        <h2>Oldest Heirloom</h2>
                        <img
                            src={getFullImageUrl(oldestHeirloom.photoUrl)}
                            alt={oldestHeirloom.title}
                            style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 8, marginBottom: 12, border: "2px solid #bcb88a", background: "#fff" }}
                        />
                        <p>
                          <b>{oldestHeirloom.title}</b>
                        </p>
                        <p>
                          Created: {toDateInputValue(oldestHeirloom.creationDate)}
                        </p>
                        {oldestHeirloom.estimatedValue && (
                            <p>Estimated Value: ${oldestHeirloom.estimatedValue}</p>
                        )}
                      </div>
                  )}
                  {mostValuableHeirloom && (
                      <div
                          className="highlight-card"
                          onClick={() => setSelectedItem(mostValuableHeirloom)}
                          tabIndex={0}
                          role="button"
                          aria-label="View most valuable heirloom"
                      >
                        <h2>Most Valuable Heirloom</h2>
                        <img
                            src={getFullImageUrl(mostValuableHeirloom.photoUrl)}
                            alt={mostValuableHeirloom.title}
                            style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 8, marginBottom: 12, border: "2px solid #bcb88a", background: "#fff" }}
                        />
                        <p>
                          <b>{mostValuableHeirloom.title}</b>
                        </p>
                        {mostValuableHeirloom.estimatedValue && (
                            <p>Estimated Value: ${mostValuableHeirloom.estimatedValue}</p>
                        )}
                        {mostValuableHeirloom.creationDate && (
                            <p>Created: {toDateInputValue(mostValuableHeirloom.creationDate)}</p>
                        )}
                      </div>
                  )}
                </div>
              </div>
          ) : editingItem ? (
              <ItemEdit
                  initialItem={editingItem}
                  onSave={handleEditSave}
                  navigateTo={() => {
                    setEditingItem(null);
                    setSelectedItem(editingItem);
                  }}
              />
          ) : selectedItem ? (
              <ItemView
                  item={selectedItem}
                  onBack={() => setSelectedItem(null)}
                  onEdit={() => {
                    setEditingItem(selectedItem);
                  }}
              />
          ) : editingMember ? (
              <FamilyMemberEdit
                  initialMember={editingMember}
                  familyMembers={familyMembers}
                  onSave={handleMemberSave}
                  onCancel={() => {
                    setEditingMember(null);
                    setSelectedMember(editingMember);
                  }}
              />
          ) : selectedMember ? (
              <FamilyMemberView
                  member={selectedMember}
                  onBack={() => setSelectedMember(null)}
                  onEdit={() => setEditingMember(selectedMember)}
              />
          ) : null}
        </div>
      </div>
  );
};

export default HomePage;