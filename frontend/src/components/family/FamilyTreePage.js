import React, { useEffect, useState, useCallback } from "react";
import ReactFlow, { Background, Controls, useNodesState, useEdgesState, Handle, Position } from "reactflow";
import "reactflow/dist/style.css";
import { getFullImageUrl, toDateInputValue } from "../../services/utils";
import FamilyMemberView from "./FamilyMemberView";
import FamilyMemberEdit from "./FamilyMemberEdit";
import FamilyMemberAdd from "./FamilyMemberAdd";
import Button from "../shared/Button";
import { FamilyService } from "../../services/family";
import "../../styles/family/FamilyTreePage.css";
import "../../styles/family/FamilyTreeMenu.css";
import ELK from "elkjs/lib/elk.bundled.js";

const nodeWidth = 180;
const nodeHeight = 150;

/**
 * Finds all spouse groups in the given nodes.
 * Each group is a set of node IDs that are directly or indirectly connected as spouses.
 * @param {Array} nodes - The array of React Flow nodes.
 * @returns {Array<Array<string>>} Array of spouse groups (each group is an array of node IDs).
 */
function findSpouseGroups(nodes) {
    const idToNode = Object.fromEntries(nodes.map(n => [n.id, n]));
    // Build undirected spouse adjacency
    const spouseAdj = {};
    nodes.forEach(node => {
        const id = node.id;
        spouseAdj[id] = new Set();
        (node.data.spouseIds || []).forEach(sid => {
            sid = String(sid);
            spouseAdj[id].add(sid);
            if (!spouseAdj[sid]) spouseAdj[sid] = new Set();
            spouseAdj[sid].add(id);
        });
    });
    // Find connected components
    const visited = new Set();
    const groups = [];
    for (const id of Object.keys(spouseAdj)) {
        if (visited.has(id)) continue;
        const group = [];
        const stack = [id];
        while (stack.length) {
            const curr = stack.pop();
            if (visited.has(curr)) continue;
            visited.add(curr);
            group.push(curr);
            spouseAdj[curr].forEach(neigh => {
                if (!visited.has(neigh)) stack.push(neigh);
            });
        }
        if (group.length > 1) groups.push(group);
    }
    return groups;
}

/**
 * Assigns generations to nodes, ensuring all spouses are in the same generation.
 * @param {Array} nodes - The array of React Flow nodes.
 * @param {Array} edges - The array of React Flow edges.
 * @param {string} userId - The reference/root user ID.
 * @returns {Object} Mapping from node ID to generation number.
 */
function assignRelativeGenerationsWithSpouses(nodes, edges, userId) {
    const generation = assignRelativeGenerations(nodes, edges, userId);
    const spouseGroups = findSpouseGroups(nodes);
    for (const group of spouseGroups) {
        const gens = group.map(id => generation[id]).filter(g => g !== undefined);
        if (gens.length === 0) continue;
        const minGen = Math.min(...gens);
        for (const id of group) {
            generation[id] = minGen;
        }
    }
    return generation;
}

/**
 * Assigns relative generations to nodes based on parent-child relationships.
 * @param {Array} nodes - The array of React Flow nodes.
 * @param {Array} edges - The array of React Flow edges.
 * @param {string} userId - The reference/root user ID.
 * @returns {Object} Mapping from node ID to generation number.
 */
function assignRelativeGenerations(nodes, edges, userId) {
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

    const generation = {};
    const queue = [[userId, 0]];
    generation[userId] = 0;

    while (queue.length > 0) {
        const [currentId, gen] = queue.shift();

        (childToParents[currentId] || []).forEach(parentId => {
            (parentToChildren[parentId] || []).forEach(siblingId => {
                if (generation[siblingId] === undefined) {
                    generation[siblingId] = gen;
                    queue.push([siblingId, gen]);
                }
            });
        });

        (childToParents[currentId] || []).forEach(parentId => {
            if (generation[parentId] === undefined) {
                generation[parentId] = gen - 1;
                queue.push([parentId, gen - 1]);
            }
        });

        (parentToChildren[currentId] || []).forEach(childId => {
            if (generation[childId] === undefined) {
                generation[childId] = gen + 1;
                queue.push([childId, gen + 1]);
            }
        });

        const node = idToNode[currentId];
        if (node && node.data && node.data.spouseIds) {
            (node.data.spouseIds || []).forEach(spouseId => {
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

/**
 * Returns all ancestor IDs for a given node.
 * @param {string} nodeId - The node ID to start from.
 * @param {Object} childToParents - Mapping from child ID to array of parent IDs.
 * @returns {Set<string>} Set of ancestor node IDs.
 */
function getAncestorIds(nodeId, childToParents) {
    const ancestors = new Set();
    const stack = [nodeId];
    while (stack.length) {
        const current = stack.pop();
        (childToParents[current] || []).forEach(parentId => {
            if (!ancestors.has(parentId)) {
                ancestors.add(parentId);
                stack.push(parentId);
            }
        });
    }
    return ancestors;
}

/**
 * Returns all descendant IDs for a given node.
 * @param {string} nodeId - The node ID to start from.
 * @param {Object} parentToChildren - Mapping from parent ID to array of child IDs.
 * @returns {Set<string>} Set of descendant node IDs.
 */
function getDescendantIds(nodeId, parentToChildren) {
    const descendants = new Set();
    const stack = [nodeId];
    while (stack.length) {
        const current = stack.pop();
        (parentToChildren[current] || []).forEach(childId => {
            if (!descendants.has(childId)) {
                descendants.add(childId);
                stack.push(childId);
            }
        });
    }
    return descendants;
}

/**
 * React component for rendering a family member node in the tree.
 * @param {Object} props - The component props.
 * @returns {JSX.Element}
 */
function FamilyNode({ data, id, setHoveredNodeId }) {
    return (
        <div
            className="family-node-card"
            style={{ textAlign: "center", cursor: "pointer", position: "relative" }}
            onClick={e => { e.stopPropagation(); data.onView(); }}
            tabIndex={0}
            role="button"
            aria-label={`View ${data.label}`}
            onKeyPress={e => {
                if (e.key === "Enter" || e.key === " ") data.onView();
            }}
            onMouseEnter={() => setHoveredNodeId && setHoveredNodeId(id)}
            onMouseLeave={() => setHoveredNodeId && setHoveredNodeId(null)}
        >
            <button
                className="family-node-plus family-node-plus-top"
                title="Add Parent"
                onClick={e => { e.stopPropagation(); data.onAddParent(); }}
            >+</button>
            <Handle type="target" position={Position.Top} style={{ background: "#bcb88a" }} id="top" key="top" />
            <Handle type="source" position={Position.Bottom} style={{ background: "#bcb88a" }} id="bottom" key="bottom" />
            <Handle type="source" position={Position.Right} id="spouse-right" style={{ background: "#7c9a7a" }} key="spouse-right" />
            <Handle type="target" position={Position.Left} id="spouse-left" style={{ background: "#7c9a7a" }} key="spouse-left" />
            <img
                src={getFullImageUrl(data.photoUrl)}
                alt={data.label}
                style={{
                    width: 60,
                    height: 60,
                    objectFit: "cover",
                    borderRadius: 10,
                    background: "#e3e7d3",
                    border: "1.5px solid #bcb88a",
                    marginBottom: 8
                }}
            />
            <div style={{ fontWeight: "bold" }}>{data.label}</div>
            <div style={{ fontSize: 12, color: "#888" }}>{data.dates}</div>
            <button
                className="family-node-plus family-node-plus-bottom"
                title="Add Child"
                onClick={e => { e.stopPropagation(); data.onAddChild(); }}
            >+</button>
        </div>
    );
}

const nodeTypes = {
    family: (props) => <FamilyNode {...props} setHoveredNodeId={props.data.setHoveredNodeId} />
};


/**
 * Builds the family graph nodes and edges from the members array.
 * @param {Array} members - Array of family member objects.
 * @param {Function} onView - Callback for viewing a member.
 * @param {Function} onAddParent - Callback for adding a parent.
 * @param {Function} onAddChild - Callback for adding a child.
 * @param {string} referenceUserId - The reference/root user ID.
 * @param {Function} setHoveredNodeId - Callback for setting hovered node ID.
 * @returns {{nodes: Array, edges: Array}} The nodes and edges for the graph.
 */
function buildFamilyGraph(members, onView, onAddParent, onAddChild, referenceUserId, setHoveredNodeId) {
    if (!members || members.length === 0) return { nodes: [], edges: [] };

    const nodes = members.map((member) => ({
        id: String(member.familyMemberId),
        type: "family",
        data: {
            label: `${member.firstName || ""} ${member.lastName || ""}`,
            photoUrl: member.profilePictureUrl,
            dates: [member.dateOfBirth, member.dateOfDeath].map(toDateInputValue).filter(Boolean).join(" - "),
            onView: () => onView(member),
            onAddParent: () => onAddParent(member),
            onAddChild: () => onAddChild(member),
            spouseIds: member.spouseIds || [],
            setHoveredNodeId,
            siblingIds: member.siblingIds || [],
        },
        position: { x: 0, y: 0 },
        style: { width: nodeWidth, background: "#fffbe9", border: "1px solid #bcb88a", borderRadius: 12 },
    }));

    const nodeIdSet = new Set(nodes.map(n => n.id));
    const edges = [];

    // Parent-child edges
    members.forEach(child => {
        (child.parentsIds || []).forEach(parentId => {
            const parentIdStr = String(parentId);
            const childIdStr = String(child.familyMemberId);
            if (nodeIdSet.has(parentIdStr) && nodeIdSet.has(childIdStr)) {
                edges.push({
                    id: `parent-${parentIdStr}-${childIdStr}`,
                    source: parentIdStr,
                    target: childIdStr,
                    type: "default"
                });
            }
        });
    });

    // Spouse edges
    const spouseGroups = findSpouseGroups(nodes);
    const spouseEdgeSet = new Set();
    spouseGroups.forEach(group => {
        const groupIds = group.filter(id => nodeIdSet.has(id) && !id.startsWith("dummy-child-"));
        for (let i = 0; i < groupIds.length; i++) {
            for (let j = i + 1; j < groupIds.length; j++) {
                const a = groupIds[i], b = groupIds[j];
                const pairKey = [a, b].sort().join("-");
                if (!spouseEdgeSet.has(pairKey)) {
                    spouseEdgeSet.add(pairKey);
                    edges.push({
                        id: `spouse-${pairKey}`,
                        source: a,
                        target: b,
                        type: "default"
                    });
                }
            }
        }
    });

    return { nodes, edges };
}

/**
 * Computes a layout for the family tree using ELK, ensuring spouse groups are kept together using node ordering.
 * @param {Array} nodes - The React Flow nodes.
 * @param {Array} edges - The React Flow edges.
 * @param {string} referenceUserId - The root/reference user ID.
 * @returns {Promise<{nodes: Array, edges: Array}>} Layouted nodes and edges.
 */
async function getLayoutedElementsELK(nodes, edges, referenceUserId) {
    const elk = new ELK();
    const nodeGeneration = assignRelativeGenerationsWithSpouses(nodes, edges, referenceUserId);
    const minGen = Math.min(...Object.values(nodeGeneration));

    // --- Assign fixed order for spouse groups ---
    const spouseGroups = findSpouseGroups(nodes);
    const nodeOrder = {};
    let orderCounter = 0;
    spouseGroups.forEach(group => {
        // Only real nodes
        const groupIds = group.filter(id => nodes.find(n => n.id === id && !id.startsWith("dummy-child-")));
        groupIds.forEach(id => {
            nodeOrder[id] = orderCounter++;
        });
        // Add a gap after each group
        orderCounter++;
    });

    const elkNodes = nodes.map(node => ({
        id: node.id,
        width: nodeWidth,
        height: nodeHeight,
        layer: String((nodeGeneration[node.id] ?? 0) - minGen),
        ...(nodeOrder[node.id] !== undefined
            ? { properties: { "elk.layered.nodePlacement.bk.order": nodeOrder[node.id] } }
            : {})
    }));

    const elkEdges = edges
        .filter(e => !e.id.startsWith("spouse-"))
        .map(e => ({
            id: e.id,
            sources: [e.source],
            targets: [e.target]
        }));

    const elkGraph = {
        id: "root",
        layoutOptions: {
            "elk.algorithm": "layered",
            "elk.direction": "DOWN",
            "elk.layered.spacing.nodeNodeBetweenLayers": "120",
            "elk.spacing.nodeNode": "80"
        },
        children: elkNodes,
        edges: elkEdges
    };

    const elkResult = await elk.layout(elkGraph);

    const nodePositions = {};
    (elkResult.children || []).forEach(node => {
        nodePositions[node.id] = { x: node.x ?? 0, y: node.y ?? 0 };
    });

    const layoutedNodes = nodes.map(node => {
        const pos = nodePositions[node.id] || { x: 0, y: 0 };
        return {
            ...node,
            position: { x: pos.x, y: pos.y },
            targetPosition: "top",
            sourcePosition: "bottom"
        };
    });

    const filteredNodes = layoutedNodes.filter(n => !n.id.startsWith("dummy-child-"));
    const filteredEdges = edges.filter(e => !e.id.startsWith("dummy-parent-")); // Keep spouse edges!

    return { nodes: filteredNodes, edges: filteredEdges };
}

/**
 * Ensures spouse edges always connect on the inside (between spouses),
 * and swaps source/target if needed based on node positions.
 * @param {Array} nodes - The array of React Flow nodes (with positions).
 * @param {Array} edges - The array of React Flow edges.
 * @returns {Array} The updated edges array.
 */
function updateSpouseEdgeHandles(nodes, edges) {
    // Build a map from node id to its x position
    const nodeX = {};
    nodes.forEach(node => {
        nodeX[node.id] = node.position?.x ?? 0;
    });
    return edges.map(edge => {
        if (!edge.id.startsWith("spouse-")) return edge;
        const sourceX = nodeX[edge.source] ?? 0;
        const targetX = nodeX[edge.target] ?? 0;
        // Always connect from right of leftmost to left of rightmost
        if (sourceX <= targetX) {
            return {
                ...edge,
                sourceHandle: "spouse-right",
                targetHandle: "spouse-left"
            };
        } else {
            // Swap source/target and handles
            return {
                ...edge,
                source: edge.target,
                target: edge.source,
                sourceHandle: "spouse-right",
                targetHandle: "spouse-left"
            };
        }
    });
}

/**
 * Builds parent-to-children and child-to-parents maps from nodes and edges.
 * @param {Array} nodes - The array of nodes.
 * @param {Array} edges - The array of edges.
 * @returns {{parentToChildren: Object, childToParents: Object}}
 */
function buildParentChildMaps(nodes, edges) {
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
    return { parentToChildren, childToParents };
}

/**
 * Returns a new edges array with proper highlighting and spouse styling.
 * Highlights direct, ancestor, and descendant relationships.
 * Spouse edges are styled as dotted lines.
 * @param {Array} edges - The array of edges.
 * @param {string|null} hoveredNodeId - The currently hovered node ID.
 * @param {Object} lineageIds - Object with ancestors and descendants sets.
 * @returns {Array} The updated edges array.
 */
function getHighlightedEdges(edges, hoveredNodeId, lineageIds) {
    return edges.map(edge => {
        // Direct connection to hovered node
        const isDirect = hoveredNodeId && (edge.source === hoveredNodeId || edge.target === hoveredNodeId);
        // Both source and target are ancestors
        const isAncestorLine = hoveredNodeId && (
            lineageIds.ancestors.has(edge.source) && lineageIds.ancestors.has(edge.target)
        );
        // Both source and target are descendants
        const isDescendantLine = hoveredNodeId && (
            lineageIds.descendants.has(edge.source) && lineageIds.descendants.has(edge.target)
        );
        // Spouse edge (dotted)
        const isSpouse = edge.id.startsWith("spouse-");
        return {
            ...edge,
            className: [
                isSpouse ? "spouse-edge" : "",
                (isDirect || isAncestorLine || isDescendantLine) ? "highlighted-edge" : ""
            ].filter(Boolean).join(" ")
        };
    });
}

// =========================
// FamilyTreePage Component
// =========================

/**
 * Main FamilyTreePage React component.
 * Handles state, data fetching, and rendering the family tree.
 * @returns {JSX.Element}
 */
const FamilyTreePage = () => {
    // State hooks
    const [familyMembers, setFamilyMembers] = useState([]);
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [viewingMember, setViewingMember] = useState(null);
    const [editingMember, setEditingMember] = useState(null);
    const [adding, setAdding] = useState(false);
    const [addContext, setAddContext] = useState(null);
    const [referenceUserId, setReferenceUserId] = useState(null);
    const [hoveredNodeId, setHoveredNodeId] = useState(null);
    const [lineageIds, setLineageIds] = useState({ ancestors: new Set(), descendants: new Set() });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    /**
     * Fetches all family members from the API and sets the initial reference user.
     */
    const fetchMembers = useCallback(async () => {
        try {
            setLoading(true);
            const data = await FamilyService.getAllMembers();
            setFamilyMembers(data);
            if (!referenceUserId && data.length > 0) {
                setReferenceUserId(String(data[0].familyMemberId));
            }
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    }, [referenceUserId]);

    // Fetch members on mount
    useEffect(() => { fetchMembers(); }, [fetchMembers]);

    // Update lineage highlighting when hovered node changes
    useEffect(() => {
        if (!hoveredNodeId || nodes.length === 0) {
            setLineageIds({ ancestors: new Set(), descendants: new Set() });
            return;
        }
        const { parentToChildren, childToParents } = buildParentChildMaps(nodes, edges);
        setLineageIds({
            ancestors: getAncestorIds(hoveredNodeId, childToParents),
            descendants: getDescendantIds(hoveredNodeId, parentToChildren)
        });
    }, [hoveredNodeId, nodes, edges]);

    // UI event handlers
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
    const handleSetReferenceUser = (member) => {
        setReferenceUserId(String(member.familyMemberId));
        setViewingMember(member);
    };

    // Layout and update nodes/edges when data changes
    useEffect(() => {
        let cancelled = false;
        (async () => {
            const { nodes, edges } = buildFamilyGraph(
                familyMembers,
                handleSetReferenceUser,
                handleAddParent,
                handleAddChild,
                referenceUserId,
                setHoveredNodeId
            );
            if (nodes.length === 0) {
                setNodes([]);
                setEdges([]);
                return;
            }
            const layout = await getLayoutedElementsELK(nodes, edges, referenceUserId);
            if (!cancelled) {
                layout.edges = updateSpouseEdgeHandles(layout.nodes, layout.edges);
                setNodes(layout.nodes);
                setEdges(layout.edges);
            }
        })();
        return () => { cancelled = true; };
    }, [familyMembers, referenceUserId, setHoveredNodeId]);

    // Highlight edges for direct, ancestor, or descendant relationships
    const highlightedEdges = getHighlightedEdges(edges, hoveredNodeId, lineageIds);

    if (loading) {
        return <div className="familytree-container">Loading family tree...</div>;
    }

    if (error) {
        return (
            <div className="familytree-container">
                <p className="error-message">Error: {error}</p>
                <Button onClick={fetchMembers}>Retry</Button>
            </div>
        );
    }

    // Render the family tree and modals
    return (
        <div className="familytree-container">
            <div className="familytree-treearea">
                {/* ReactFlow renders the interactive family tree graph */}
                <ReactFlow
                    nodes={nodes}
                    edges={highlightedEdges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    nodeTypes={nodeTypes}
                    fitView
                    fitViewOptions={{ padding: 0.2, minZoom: 0.1, maxZoom: 1.5 }}
                    panOnScroll
                    panOnDrag
                    nodesDraggable={false}
                    nodesConnectable={false}
                    elementsSelectable
                >
                    <Background />
                    <Controls />
                </ReactFlow>
            </div>
            {/* Modal for viewing a family member's details */}
            {viewingMember && (
                <div className="family-modal-overlay">
                    <div className="family-modal">
                        <FamilyMemberView
                            member={viewingMember}
                            familyMembers={familyMembers}
                            onBack={() => setViewingMember(null)}
                            onEdit={() => handleEdit(viewingMember)}
                        />
                    </div>
                </div>
            )}
            {/* Modal for editing a family member */}
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
            {/* Modal for adding a new family member */}
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

