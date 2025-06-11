import React, { useEffect, useState } from "react";
import Tree from "react-d3-tree";
import FamilyMemberView from "./FamilyMemberView";
import FamilyMemberEdit from "./FamilyMemberEdit";
import FamilyMemberAdd from "./FamilyMemberAdd";
import { getFullImageUrl } from "./utils";
import "./FamilyTreePage.css";

const CARD_WIDTH = 260;
const CARD_HEIGHT = 190;
const IMAGE_SIZE = 90;

// Build a tree with only parent-child edges
function buildFamilyTree(members) {
    if (!members || members.length === 0) return null;
    const idToNode = {};
    members.forEach(member => {
        idToNode[member.familyMemberId] = {
            ...member,
            name: `${member.firstName || ""} ${member.lastName || ""}`,
            children: [],
        };
    });

    // Track which nodes have been attached as children
    const attached = new Set();

    // Attach each child only once (under the first parent found)
    members.forEach(parent => {
        (parent.childrenIds || []).forEach(cid => {
            if (idToNode[cid] && !attached.has(cid)) {
                idToNode[parent.familyMemberId].children.push(idToNode[cid]);
                attached.add(cid);
            }
        });
    });

    // Roots: nodes not attached as children
    const roots = members
        .filter(m => !attached.has(m.familyMemberId))
        .map(m => idToNode[m.familyMemberId]);

    // If only one root, return it; else, return all roots (no dummy node)
    if (roots.length === 1) return roots[0];
    if (roots.length > 1) return { name: "Family", children: roots };
    return null;
}

const FamilyTreePage = () => {
    const [treeData, setTreeData] = useState(null);
    const [user, setUser] = useState(null);
    const [familyMembers, setFamilyMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [error, setError] = useState(null);
    const [selectedMember, setSelectedMember] = useState(null);
    const [editingMember, setEditingMember] = useState(null);

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            setError(null);
            try {
                const token = localStorage.getItem("authToken");
                const userRes = await fetch("http://localhost:5240/api/Auth/me", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!userRes.ok) throw new Error("Failed to fetch user");
                const userData = await userRes.json();
                setUser({ ...userData, id: userData.id });
                const famRes = await fetch("http://localhost:5240/api/familymember", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!famRes.ok) throw new Error("Failed to fetch family members");
                const famData = await famRes.json();
                setFamilyMembers(famData);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    useEffect(() => {
        if (user) {
            setTreeData(buildFamilyTree(familyMembers, user));
        }
    }, [user, familyMembers]);

    const refreshFamily = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem("authToken");
            const famRes = await fetch("http://localhost:5240/api/familymember", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!famRes.ok) throw new Error("Failed to fetch family members");
            const famData = await famRes.json();
            setFamilyMembers(famData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="familytree-container">Loading family tree...</div>;
    if (error) return <div className="familytree-container">Error: {error}</div>;
    if (!treeData) return <div className="familytree-container">No family data found.</div>;

    // Custom node rendering for cards
    const renderNodeLabel = ({ nodeDatum }) => (
        <g
            style={{ cursor: "pointer" }}
            onClick={e => {
                e.stopPropagation();
                setSelectedMember(nodeDatum);
                setEditingMember(null);
            }}
        >
            <rect
                x={-CARD_WIDTH / 2}
                y={-CARD_HEIGHT / 2}
                width={CARD_WIDTH}
                height={CARD_HEIGHT}
                rx={18}
                fill="#fffbe9"
                stroke="#bcb88a"
                strokeWidth={2}
                style={{
                    filter: "drop-shadow(0 4px 24px rgba(30,50,28,0.10))",
                }}
            />
            <image
                href={getFullImageUrl(nodeDatum.profilePictureUrl)}
                x={-IMAGE_SIZE / 2}
                y={-CARD_HEIGHT / 2 + 16}
                width={IMAGE_SIZE}
                height={IMAGE_SIZE}
                style={{ borderRadius: "50%" }}
            />
            <text
                x={0}
                y={-CARD_HEIGHT / 2 + IMAGE_SIZE + 40}
                textAnchor="middle"
                fontSize="1.1rem"
                fontWeight="bold"
                fill="#1e321c"
            >
                {nodeDatum.firstName} {nodeDatum.lastName}
            </text>
            <text
                x={0}
                y={-CARD_HEIGHT / 2 + IMAGE_SIZE + 65}
                textAnchor="middle"
                fontSize="0.95rem"
                fill="#3a4a2b"
            >
                {nodeDatum.relationshipType || ""}
            </text>
            <text
                x={0}
                y={-CARD_HEIGHT / 2 + IMAGE_SIZE + 90}
                textAnchor="middle"
                fontSize="0.85rem"
                fill="#7c9a7a"
            >
                {nodeDatum.dateOfBirth ? `Born: ${nodeDatum.dateOfBirth}` : ""}
            </text>
        </g>
    );

    return (
        <div className="familytree-container">
            <div className="familytree-header">
                <h1>Family Tree</h1>
                <button className="auth-button" onClick={() => setShowAdd(true)}>
                    Add Family Member
                </button>
            </div>
            <div className="familytree-treearea">
                <Tree
                    data={treeData}
                    orientation="vertical"
                    translate={{ x: 600, y: 120 }}
                    renderCustomNodeElement={renderNodeLabel}
                    zoomable
                    collapsible
                    separation={{ siblings: 2.5, nonSiblings: 3.5 }}
                    pathFunc="elbow"
                />
            </div>
            {showAdd && (
                <FamilyMemberAdd
                    familyMembers={familyMembers}
                    onSave={async () => {
                        setShowAdd(false);
                        await refreshFamily();
                    }}
                    onCancel={() => setShowAdd(false)}
                />
            )}
            {editingMember && (
                <FamilyMemberEdit
                    initialMember={editingMember}
                    familyMembers={familyMembers}
                    onSave={async () => {
                        setEditingMember(null);
                        setSelectedMember(null);
                        await refreshFamily();
                    }}
                    onCancel={() => setEditingMember(null)}
                />
            )}
            {selectedMember && !editingMember && (
                <FamilyMemberView
                    member={selectedMember}
                    onBack={() => setSelectedMember(null)}
                    onEdit={() => setEditingMember(selectedMember)}
                />
            )}
        </div>
    );
};

export default FamilyTreePage;