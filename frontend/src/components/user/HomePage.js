import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { differenceInYears, parseISO } from 'date-fns';
import { ItemView, ItemEdit } from "../heirloom/ItemPages";
import FamilyMemberEdit from "../family/FamilyMemberEdit";
import FamilyMemberView from "../family/FamilyMemberView";
import LoadingScreen from "../ui/LoadingScreen";
import AuthErrorOverlay from "../ui/AuthErrorOverlay";
import { getFullImageUrl, toDateInputValue } from "../../services/utils";
import { familyAPI } from "../../services/api";
import { vaultAPI } from "../../services/api";
import { getStandardizedValue, formatCurrency } from "../../services/currency";
import { tokenManager } from "../../services/security";
import { STORAGE_KEYS } from "../../services/constants";
import { isAuthError } from "../../services/authErrorUtils";
import "../../styles/user/HomePage.css";

/**
 * Calculate age based on birth date and possibly death date
 * @param {string} birthDateStr - Birth date as string
 * @param {string|null} deathDateStr - Death date as string, or null if still living
 * @returns {number} - Age in years
 */
function calculateAge(birthDateStr, deathDateStr) {
  try {
    const birthDate = new Date(birthDateStr);

    // If person is deceased, calculate age at time of death
    if (deathDateStr) {
      const deathDate = new Date(deathDateStr);
      return differenceInYears(deathDate, birthDate);
    }

    // If person is still living, calculate current age
    return differenceInYears(new Date(), birthDate);
  } catch (error) {
    console.error("Error calculating age:", error);
    return 0;
  }
}

/**
 * Calculate the age of an heirloom in years
 * @param {string} creationDateStr - Creation date of the heirloom as string
 * @returns {number} - Age in years
 */
function calculateHeirloomAge(creationDateStr) {
  try {
    const creationDate = new Date(creationDateStr);
    return differenceInYears(new Date(), creationDate);
  } catch (error) {
    console.error("Error calculating heirloom age:", error);
    return 0;
  }
}

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

const findMostValuableHeirloom = async (items) => {
    if (!items || items.length === 0) return null;

    // Filter items that have values
    const itemsWithValues = items.filter(item => item.estimatedValue && item.estimatedValue > 0);
    if (itemsWithValues.length === 0) return null;

    // Get standardized values for all items
    const itemsWithStandardizedValues = await Promise.all(
        itemsWithValues.map(async (item) => ({
            ...item,
            standardizedValue: await getStandardizedValue(item)
        }))
    );

    // Find the most valuable using standardized USD values
    return itemsWithStandardizedValues.reduce((mostValuable, item) => {
        return item.standardizedValue > mostValuable.standardizedValue ? item : mostValuable;
    });
};

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
  const [mostValuableHeirloom, setMostValuableHeirloom] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      setError(null);
      try {
        // Using the vault API service instead of direct fetch
        const data = await vaultAPI.getAll();
        setItems(data);

        // Calculate most valuable heirloom with real exchange rates
        const mostValuable = await findMostValuableHeirloom(data);
        setMostValuableHeirloom(mostValuable);
      } catch (err) {
        setError(err.message || err.toString());
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [navigate]);

  useEffect(() => {
    const fetchFamilyMembers = async () => {
      try {
        // Using the family API service instead of direct fetch
        const data = await familyAPI.getAll();
        setFamilyMembers(data);
        setHighlighted(getOldestMembers(data));
      } catch (err) {
        setError(err.message || err.toString());
      }
    };
    fetchFamilyMembers();
  }, [navigate]);

  const oldestHeirloom = findOldestHeirloom(items);

  // Save handler for heirloom
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

  // Show loading screen while fetching data
  if (loading) {
    return <LoadingScreen message="Loading your family treasures..." />;
  }

  // Show error state
  if (error) {
    // Check if this is an authentication error message
    if (isAuthError(error)) {
      return <AuthErrorOverlay error={error} />;
    }

    return (
      <div className="error-container">
        <h2>Error Loading Data</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
      <div className="home-container">
        {/* Main highlights view */}
        {!selectedItem && !editingItem && !selectedMember && !editingMember ? (
            <>
              <h1 className="home-title">Welcome to Your Family Archive</h1>
              <div className="highlight-section">
                {/* Check if there are any highlights to show */}
                {!highlighted.oldest && !highlighted.oldestLiving && !oldestHeirloom && !mostValuableHeirloom ? (
                  <div className="no-highlights">
                    <div className="no-highlights-content">
                      <h2>No highlights found</h2>
                      <p>Start by adding family members or heirlooms to see your family archive highlights here.</p>
                      <div className="no-highlights-actions">
                        <button
                          className="highlight-action-btn"
                          onClick={() => navigate('/family')}
                        >
                          Add Family Members
                        </button>
                        <button
                          className="highlight-action-btn"
                          onClick={() => navigate('/heirloom')}
                        >
                          Add Heirlooms
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
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
                              style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 8, marginBottom: 12, border: "2px solid #bcb88a", background: "#fff" }}
                          />
                          <p>
                            <b>{highlighted.oldest.firstName} {highlighted.oldest.lastName}</b>
                          </p>
                          <p>
                            {toDateInputValue(highlighted.oldest.dateOfBirth)}
                            {highlighted.oldest.dateOfDeath && (
                                <> &ndash; {toDateInputValue(highlighted.oldest.dateOfDeath)}</>
                            )}
                          </p>
                          <p>
                            <strong>Age: {calculateAge(highlighted.oldest.dateOfBirth, highlighted.oldest.dateOfDeath)} years</strong>
                          </p>
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
                              style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 8, marginBottom: 12, border: "2px solid #bcb88a", background: "#fff" }}
                          />
                          <p>
                            <b>{highlighted.oldestLiving.firstName} {highlighted.oldestLiving.lastName}</b>
                          </p>
                          <p>
                            <strong>Age: {calculateAge(highlighted.oldestLiving.dateOfBirth)} years</strong>
                          </p>
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
                            <strong>Age: {calculateHeirloomAge(oldestHeirloom.creationDate)} years</strong>
                          </p>
                          {oldestHeirloom.estimatedValue && (
                              <p>${oldestHeirloom.estimatedValue}</p>
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
                              <p>
                                Estimated Value: <strong>
                                  {formatCurrency(mostValuableHeirloom.estimatedValue, mostValuableHeirloom.currency)}
                                </strong>
                              </p>
                          )}
                        </div>
                    )}
                  </>
                )}
              </div>
            </>
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
                familyMembers={familyMembers}
                onBack={() => setSelectedMember(null)}
                onEdit={() => setEditingMember(selectedMember)}
            />
        ) : null}
      </div>
  );
};

export default HomePage;

