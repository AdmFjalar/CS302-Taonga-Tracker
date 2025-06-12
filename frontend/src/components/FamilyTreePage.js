import React, { useEffect, useState, useCallback } from "react";
import ReactFlow, { Background, Controls, useNodesState, useEdgesState, Handle, Position } from "reactflow";
import "reactflow/dist/style.css";
import dagre from "dagre";
import { getFullImageUrl, toDateInputValue } from "./utils";
import FamilyMemberView from "./FamilyMemberView";
import FamilyMemberEdit from "./FamilyMemberEdit";
import FamilyMemberAdd from "./FamilyMemberAdd";
import "./FamilyTreePageLayout.css";
import "./FamilyTreeMenu.css";

const nodeWidth = 180;
const nodeHeight = 150;

// Assigns generations relative to a reference userId
function assignRelativeGenerations(nodes, edges, userId) {
    // Build parent<->child maps
    const idToNode = Object.fromEntries(nodes.map(n => [n.id, n]));
    const parentToChildren = {};
    const childToParents = {};
    nodes.forEach(node => {
        parentToChildren[node.id] = [];
        childToParents[node.id] = [];
    });
    edges.forEach(edge => {
        if (!edge.id.startsWith("spouse-")) {
            parentToChildren[edge.source].push(edge.target);
            childToParents[edge.target].push(edge.source);
        }
    });

    // BFS from userId, assign generation
    const generation = {};
    const queue = [[userId, 0]];
    generation[userId] = 0;

    while (queue.length > 0) {
        const [currentId, gen] = queue.shift();

        // Siblings (share at least one parent)
        childToParents[currentId].forEach(parentId => {
            parentToChildren[parentId].forEach(siblingId => {
                if (generation[siblingId] === undefined) {
                    generation[siblingId] = gen;
                    queue.push([siblingId, gen]);
                }
            });
        });

        // Parents
        childToParents[currentId].forEach(parentId => {
            if (generation[parentId] === undefined) {
                generation[parentId] = gen - 1;
                queue.push([parentId, gen - 1]);
            }
        });

        // Children
        parentToChildren[currentId].forEach(childId => {
            if (generation[childId] === undefined) {
                generation[childId] = gen + 1;
                queue.push([childId, gen + 1]);
            }
        });

        // Spouses (same generation)
        const node = idToNode[currentId];
        if (node && node.data && node.data.spouseIds) {
            node.data.spouseIds.forEach(spouseId => {
                spouseId = String(spouseId);
                if (generation[spouseId] === undefined) {
                    generation[spouseId] = gen;
                    queue.push([spouseId, gen]);
                }
            });
        }
    }

    return generation;
}

// Layout nodes by relative generation
function getLayoutedElementsRelative(nodes, edges, referenceUserId, direction = "TB") {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: direction, ranksep: 120 });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });
    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    // Assign relative generations
    const nodeGeneration = assignRelativeGenerations(nodes, edges, referenceUserId);

    // Group nodes by generation
    const genToIds = {};
    Object.entries(nodeGeneration).forEach(([id, gen]) => {
        genToIds[gen] = genToIds[gen] || new Set();
        genToIds[gen].add(id);
    });

    // For each generation, set all y to a fixed interval (user = 0 in the middle)
    const allGens = Object.keys(genToIds).map(Number);
    const minGen = Math.min(...allGens);
    const maxGen = Math.max(...allGens);
    const verticalSpacing = nodeHeight + 80;
    Object.entries(genToIds).forEach(([genStr, idSet]) => {
        const gen = parseInt(genStr, 10);
        // Center user at y=middle, parents above, children below
        const y = (gen - minGen) * verticalSpacing + 60;
        Array.from(idSet).forEach(id => {
            if (dagreGraph.node(id)) dagreGraph.node(id).y = y;
        });
    });

    // For each spouse pair, space horizontally
    const spousePairs = [];
    nodes.forEach((node) => {
        if (node.data && node.data.spouseIds) {
            node.data.spouseIds.forEach((spouseId) => {
                const pair = [node.id, String(spouseId)].sort();
                if (!spousePairs.find(([a, b]) => a === pair[0] && b === pair[1])) {
                    spousePairs.push(pair);
                }
            });
        }
    });
    spousePairs.forEach(([id1, id2]) => {
        const n1 = dagreGraph.node(id1);
        const n2 = dagreGraph.node(id2);
        if (n1 && n2) {
            const dist = nodeWidth + 40;
            if (n1.x < n2.x) {
                n2.x = n1.x + dist;
            } else {
                n1.x = n2.x + dist;
            }
        }
    });

    return {
        nodes: nodes.map((node) => {
            const pos = dagreGraph.node(node.id);
            return {
                ...node,
                position: { x: pos.x - nodeWidth / 2, y: pos.y - nodeHeight / 2 },
                targetPosition: "top",
                sourcePosition: "bottom",
            };
        }),
        edges,
    };
}

function FamilyNode({ data }) {
    return (
        <div
            className="family-node-card"
            style={{ textAlign: "center", cursor: "pointer", position: "relative" }}
            onClick={data.onView}
            tabIndex={0}
            role="button"
            aria-label={`View ${data.label}`}
            onKeyPress={e => {
                if (e.key === "Enter" || e.key === " ") data.onView();
            }}
        >
            {/* Add Parent (+) Button */}
            <button
                className="family-node-plus family-node-plus-top"
                title="Add Parent"
                onClick={e => { e.stopPropagation(); data.onAddParent(); }}
            >+</button>
            <Handle type="target" position={Position.Top} style={{ background: "#bcb88a" }} />
            <Handle type="source" position={Position.Bottom} style={{ background: "#bcb88a" }} />
            {/* Spouse handles for horizontal edge */}
            <Handle type="source" position={Position.Right} id="spouse-right" style={{ background: "#7c9a7a" }} />
            <Handle type="target" position={Position.Left} id="spouse-left" style={{ background: "#7c9a7a" }} />
            <img
                src={getFullImageUrl(data.photoUrl)}
                alt={data.label}
                style={{
                    width: 64,
                    height: 64,
                    objectFit: "cover",
                    borderRadius: "50%",
                    marginBottom: 8,
                    border: "2px solid #bcb88a",
                    background: "#fff"
                }}
            />
            <div style={{ fontWeight: "bold" }}>{data.label}</div>
            <div style={{ fontSize: 12, color: "#888" }}>{data.dates}</div>
            {/* Add Child (+) Button */}
            <button
                className="family-node-plus family-node-plus-bottom"
                title="Add Child"
                onClick={e => { e.stopPropagation(); data.onAddChild(); }}
            >+</button>
        </div>
    );
}

const nodeTypes = { family: FamilyNode };

function buildFamilyGraph(members, onView, onAddParent, onAddChild, referenceUserId) {
    if (!members || members.length === 0) return { nodes: [], edges: [] };

    const nodes = members.map((member) => ({
        id: String(member.familyMemberId),
        type: "family",
        data: {
            label: `${member.firstName || ""} ${member.lastName || ""}`,
            photoUrl: member.profilePictureUrl,
            dates: [member.dateOfBirth, member.dateOfDeath]
                .map(toDateInputValue)
                .filter(Boolean)
                .join(" - "),
            onView: () => onView(member),
            onAddParent: () => onAddParent(member),
            onAddChild: () => onAddChild(member),
            spouseIds: member.spouseIds || [],
        },
        position: { x: 0, y: 0 },
        style: { width: nodeWidth, background: "#fffbe9", border: "1px solid #bcb88a", borderRadius: 12 },
    }));

    const edges = [];
    members.forEach(child => {
        (child.parentsIds || []).forEach(parentId => {
            const parentIdStr = String(parentId);
            const childIdStr = String(child.familyMemberId);
            if (
                nodes.find(n => n.id === parentIdStr) &&
                nodes.find(n => n.id === childIdStr)
            ) {
                edges.push({
                    id: `${parentIdStr}->${childIdStr}`,
                    source: parentIdStr,
                    target: childIdStr,
                    animated: false,
                    style: { stroke: "#bcb88a", strokeWidth: 2 }
                });
            }
        });
    });

    // Add spouse edges (dotted, horizontal)
    members.forEach(member => {
        (member.spouseIds || []).forEach(spouseId => {
            const spouseIdStr = String(spouseId);
            const memberIdStr = String(member.familyMemberId);
            // Avoid duplicate spouse edges
            if (
                memberIdStr < spouseIdStr &&
                nodes.find(n => n.id === spouseIdStr) &&
                nodes.find(n => n.id === memberIdStr)
            ) {
                edges.push({
                    id: `spouse-${memberIdStr}-${spouseIdStr}`,
                    source: memberIdStr,
                    target: spouseIdStr,
                    sourceHandle: "spouse-right",
                    targetHandle: "spouse-left",
                    type: "default",
                    style: { stroke: "#7c9a7a", strokeWidth: 2, strokeDasharray: "4 2" }
                });
            }
        });
    });

    return getLayoutedElementsRelative(nodes, edges, referenceUserId);
}

const FamilyTreePage = () => {
    const [familyMembers, setFamilyMembers] = useState([]);
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [viewingMember, setViewingMember] = useState(null);
    const [editingMember, setEditingMember] = useState(null);
    const [adding, setAdding] = useState(false);
    const [addContext, setAddContext] = useState(null);
    const [referenceUserId, setReferenceUserId] = useState(null);

    const fetchMembers = useCallback(async () => {
        const token = localStorage.getItem("authToken");
        const res = await fetch("http://localhost:5240/api/familymember", {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
            const data = await res.json();
            setFamilyMembers(data);
            // Set default reference user if not set
            if (!referenceUserId && data.length > 0) {
                setReferenceUserId(String(data[0].familyMemberId));
            }
        }
    }, [referenceUserId]);

    useEffect(() => { fetchMembers(); }, [fetchMembers]);

    const handleAdd = () => {
        setAdding(true);
        setViewingMember(null);
        setEditingMember(null);
        setAddContext(null);
    };

    const handleEdit = (member) => {
        setEditingMember(member);
        setViewingMember(null);
        setAdding(false);
        setAddContext(null);
    };

    const handleAddParent = (member) => {
        setAddContext({ type: "parent", member });
        setAdding(true);
        setViewingMember(null);
        setEditingMember(null);
    };

    const handleAddChild = (member) => {
        setAddContext({ type: "child", member });
        setAdding(true);
        setViewingMember(null);
        setEditingMember(null);
    };

    const handleSaved = () => {
        setAdding(false);
        setEditingMember(null);
        setViewingMember(null);
        setAddContext(null);
        fetchMembers();
    };

    // When a node is clicked, set as reference user (for demo)
    const handleSetReferenceUser = (member) => {
        setReferenceUserId(String(member.familyMemberId));
        setViewingMember(member);
    };

    useEffect(() => {
        const { nodes, edges } = buildFamilyGraph(
            familyMembers,
            handleSetReferenceUser,
            handleAddParent,
            handleAddChild,
            referenceUserId
        );
        setNodes(nodes);
        setEdges(edges);
    }, [familyMembers, referenceUserId]);

    return (
        <div className="familytree-container">
            {/*<div className="familytree-treeheader">*/}
            {/*    <h1>Family Tree</h1>*/}
            {/*    <button className="auth-button" onClick={handleAdd}>Add Family Member</button>*/}
            {/*</div>*/}
            <div className="familytree-treearea">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    nodeTypes={nodeTypes}
                    fitView
                    nodesDraggable
                    nodesConnectable={false}
                    elementsSelectable
                >
                    <Background />
                    <Controls />
                </ReactFlow>
            </div>
            {viewingMember && (
                <div className="family-modal-overlay">
                    <div className="family-modal">
                        <FamilyMemberView
                            member={viewingMember}
                            familyMembers={familyMembers}
                            onEdit={() => handleEdit(viewingMember)}
                            onBack={() => setViewingMember(null)}
                        />
                        <div style={{ marginTop: 12 }}>
                            <button
                                className="auth-button"
                                onClick={() => setReferenceUserId(String(viewingMember.familyMemberId))}
                            >
                                Set as Reference Person
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {editingMember && (
                <div className="family-modal-overlay">
                    <div className="family-modal">
                        <FamilyMemberEdit
                            initialMember={editingMember}
                            familyMembers={familyMembers}
                            onSave={handleSaved}
                            onCancel={() => setEditingMember(null)}
                        />
                    </div>
                </div>
            )}
            {adding && (
                <div className="family-modal-overlay">
                    <div className="family-modal">
                        <FamilyMemberAdd
                            familyMembers={familyMembers}
                            onSave={handleSaved}
                            onCancel={() => { setAdding(false); setAddContext(null); }}
                            addContext={addContext}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default FamilyTreePage;