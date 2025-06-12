import React, { useEffect, useState, useCallback } from "react";
import ReactFlow, { Background, Controls, useNodesState, useEdgesState, Handle, Position } from "reactflow";
import "reactflow/dist/style.css";
import { getFullImageUrl, toDateInputValue } from "./utils";
import FamilyMemberView from "./FamilyMemberView";
import FamilyMemberEdit from "./FamilyMemberEdit";
import FamilyMemberAdd from "./FamilyMemberAdd";
import "./FamilyTreePageLayout.css";
import "./FamilyTreeMenu.css";

const nodeWidth = 180;
const nodeHeight = 150;

// Assigns relative generations for layout
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

// Helper: Find all spouse groups (connected components via spouse links)
function findSpouseGroups(nodes) {
    const groups = [];
    const visited = new Set();
    const idToNode = Object.fromEntries(nodes.map(n => [n.id, n]));
    nodes.forEach(node => {
        if (visited.has(node.id)) return;
        const group = new Set([node.id]);
        const queue = [node.id];
        while (queue.length) {
            const id = queue.pop();
            visited.add(id);
            const spouseIds = (idToNode[id]?.data?.spouseIds || []).map(String);
            spouseIds.forEach(sid => {
                if (!visited.has(sid)) {
                    group.add(sid);
                    queue.push(sid);
                }
            });
        }
        if (group.size > 0) groups.push(Array.from(group));
    });
    return groups;
}

function getLayoutedElementsRelative(nodes, edges, referenceUserId, direction = "TB") {
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

    const nodeGeneration = assignRelativeGenerations(nodes, edges, referenceUserId);
    const minGen = Math.min(...Object.values(nodeGeneration));
    const verticalSpacing = nodeHeight + 120;
    const horizontalSpacing = nodeWidth + 60;
    const nodePositions = {};
    const visited = new Set();

    // Find all spouse groups
    const spouseGroups = findSpouseGroups(nodes);
    const nodeToGroup = {};
    spouseGroups.forEach(group => group.forEach(id => nodeToGroup[id] = group));

    // Helper: get all children of a group (with at least one parent in group)
    function getChildrenOfGroup(group) {
        const childrenSet = new Set();
        group.forEach(id => {
            (parentToChildren[id] || []).forEach(childId => {
                childrenSet.add(childId);
            });
        });
        return Array.from(childrenSet);
    }

    // Helper: get all parents of a group (with at least one child in group)
    function getParentsOfGroup(group) {
        const parentsSet = new Set();
        group.forEach(id => {
            (childToParents[id] || []).forEach(parentId => {
                parentsSet.add(parentId);
            });
        });
        return Array.from(parentsSet);
    }

    // Find the direct ancestor chain (spouse groups) from referenceUserId up
    function getAncestorChain(nodeId) {
        const chain = [];
        let currentGroup = nodeToGroup[nodeId] || [nodeId];
        while (true) {
            const parents = getParentsOfGroup(currentGroup);
            if (parents.length === 0) break;
            let parentGroup = null;
            for (const p of parents) {
                const group = nodeToGroup[p] || [p];
                if (parents.every(pid => group.includes(pid))) {
                    parentGroup = group;
                    break;
                }
            }
            if (!parentGroup) parentGroup = [parents[0]];
            chain.unshift(parentGroup);
            currentGroup = parentGroup;
        }
        return chain;
    }

    // Recursive layout: returns [minX, maxX] for the block
    let nextX = 0;
    function layoutBlock(group, gen, mainChildId = null) {
        if (group.some(id => visited.has(id))) return [null, null];
        group.forEach(id => visited.add(id));

        // --- 1. Group children by their spouse group (sibling sets) ---
        let children = getChildrenOfGroup(group);
        let childGroups = [];
        const childVisited = new Set();
        children.forEach(childId => {
            if (childVisited.has(childId)) return;
            const cg = nodeToGroup[childId] || [childId];
            cg.forEach(cid => childVisited.add(cid));
            childGroups.push(cg);
        });

        // --- 2. If this is an ancestor group, center the main child group, others to sides ---
        let childSpans = [];
        if (mainChildId) {
            // Find the main child group (the one leading to the reference user)
            const mainGroup = nodeToGroup[mainChildId] || [mainChildId];
            const sideGroups = childGroups.filter(g => !g.every(id => mainGroup.includes(id)));
            // Layout side groups to left/right
            let leftX = nextX;
            sideGroups.forEach(cg => {
                const [minX, maxX] = layoutBlock(cg, gen + 1);
                if (minX !== null && maxX !== null) {
                    childSpans.push([minX, maxX]);
                    leftX = maxX + horizontalSpacing;
                }
            });
            // Layout main group last, so it's centered
            const [mainMin, mainMax] = layoutBlock(mainGroup, gen + 1, null);
            if (mainMin !== null && mainMax !== null) childSpans.push([mainMin, mainMax]);
        } else {
            // Not an ancestor group, just layout all children in order
            childGroups.forEach(cg => {
                const [minX, maxX] = layoutBlock(cg, gen + 1);
                if (minX !== null && maxX !== null) childSpans.push([minX, maxX]);
            });
        }

        // --- 3. Compute width of this block ---
        let minX, maxX;
        if (childSpans.length > 0) {
            minX = childSpans[0][0];
            maxX = childSpans[childSpans.length - 1][1];
        } else {
            minX = nextX;
            maxX = nextX + (group.length - 1) * horizontalSpacing;
        }

        // --- 4. Center this group above its children, or just lay them out in a row ---
        let centerX = (minX + maxX) / 2;
        const totalWidth = (group.length - 1) * horizontalSpacing;
        group.forEach((id, i) => {
            nodePositions[id] = {
                x: centerX - totalWidth / 2 + i * horizontalSpacing,
                y: (gen - minGen) * verticalSpacing + 60
            };
        });

        // --- 5. If no children, move nextX forward ---
        if (childSpans.length === 0) {
            nextX = maxX + horizontalSpacing;
        }

        return [minX, maxX];
    }

    // 1. Layout the ancestor chain, always centering the direct line
    const ancestorChain = getAncestorChain(referenceUserId);
    let mainChildId = referenceUserId;
    ancestorChain.forEach((group, i) => {
        layoutBlock(group, nodeGeneration[group[0]] ?? 0, mainChildId);
        // The main child for the next ancestor up is the first member of the current group
        mainChildId = group[0];
    });

    // 2. Layout the reference user's sibling group (if not already visited)
    const refGroup = nodeToGroup[referenceUserId] || [referenceUserId];
    if (!refGroup.some(id => visited.has(id))) {
        layoutBlock(refGroup, nodeGeneration[refGroup[0]] ?? 0);
    }

    // 3. Layout all other root groups (unrelated trees) further out to the right
    const roots = nodes.filter(n => (childToParents[n.id] || []).length === 0);
    const rootGroups = [];
    const rootVisited = new Set();
    roots.forEach(root => {
        const group = nodeToGroup[root.id] || [root.id];
        const groupKey = group.slice().sort().join("-");
        if (!rootVisited.has(groupKey)) {
            rootGroups.push(group);
            rootVisited.add(groupKey);
        }
    });
    rootGroups.forEach(group => {
        if (group.some(id => visited.has(id))) return;
        layoutBlock(group, nodeGeneration[group[0]] ?? 0);
    });

    // Assign positions to nodes
    const layoutedNodes = nodes.map(node => {
        const pos = nodePositions[node.id] || { x: 0, y: 0 };
        return {
            ...node,
            position: { x: pos.x, y: pos.y },
            targetPosition: "top",
            sourcePosition: "bottom",
        };
    });

    return { nodes: layoutedNodes, edges };
}

function updateSpouseEdgeHandles(nodes, edges) {
    const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n.position]));
    return edges.map(edge => {
        if (!edge.id.startsWith("spouse-")) return edge;
        const sourcePos = nodeMap[edge.source];
        const targetPos = nodeMap[edge.target];
        if (!sourcePos || !targetPos) return edge;
        const sourceCenterX = sourcePos.x + nodeWidth / 2;
        const targetCenterX = targetPos.x + nodeWidth / 2;
        if (sourceCenterX <= targetCenterX) {
            return { ...edge, sourceHandle: "spouse-right", targetHandle: "spouse-left" };
        } else {
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

// --- Helper functions for lineage highlighting ---
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

function buildFamilyGraph(members, onView, onAddParent, onAddChild, referenceUserId, setHoveredNodeId) {
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
            setHoveredNodeId,
        },
        position: { x: 0, y: 0 },
        style: { width: nodeWidth, background: "#fffbe9", border: "1px solid #bcb88a", borderRadius: 12 },
    }));

    const nodeIdSet = new Set(nodes.map(n => n.id));
    const edges = [];
    members.forEach(child => {
        (child.parentsIds || []).forEach(parentId => {
            const parentIdStr = String(parentId);
            const childIdStr = String(child.familyMemberId);
            if (nodeIdSet.has(parentIdStr) && nodeIdSet.has(childIdStr)) {
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

    const spouseEdgeSet = new Set();
    members.forEach(member => {
        (member.spouseIds || []).forEach(spouseId => {
            const spouseIdStr = String(spouseId);
            const memberIdStr = String(member.familyMemberId);
            if (nodeIdSet.has(spouseIdStr) && nodeIdSet.has(memberIdStr)) {
                const pairKey = [memberIdStr, spouseIdStr].sort().join("-");
                if (!spouseEdgeSet.has(pairKey)) {
                    spouseEdgeSet.add(pairKey);
                    edges.push({
                        id: `spouse-${pairKey}`,
                        source: memberIdStr,
                        target: spouseIdStr,
                        type: "straight",
                        style: { stroke: "#7c9a7a", strokeWidth: 2, strokeDasharray: "4 2" }
                    });
                }
            }
        });
    });

    const layout = getLayoutedElementsRelative(nodes, edges, referenceUserId);
    layout.edges = updateSpouseEdgeHandles(layout.nodes, layout.edges);
    return layout;
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
    const [hoveredNodeId, setHoveredNodeId] = useState(null);

    // For lineage highlighting
    const [lineageIds, setLineageIds] = useState({ ancestors: new Set(), descendants: new Set() });

    const fetchMembers = useCallback(async () => {
        const token = localStorage.getItem("authToken");
        const res = await fetch("http://localhost:5240/api/familymember", {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
            const data = await res.json();
            setFamilyMembers(data);
            if (!referenceUserId && data.length > 0) {
                setReferenceUserId(String(data[0].familyMemberId));
            }
        }
    }, [referenceUserId]);

    useEffect(() => { fetchMembers(); }, [fetchMembers]);

    // Compute lineage ids for highlighting
    useEffect(() => {
        if (!hoveredNodeId || nodes.length === 0) {
            setLineageIds({ ancestors: new Set(), descendants: new Set() });
            return;
        }
        // Build parent/child maps
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
        setLineageIds({
            ancestors: getAncestorIds(hoveredNodeId, childToParents),
            descendants: getDescendantIds(hoveredNodeId, parentToChildren)
        });
    }, [hoveredNodeId, nodes, edges]);

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

    useEffect(() => {
        const { nodes, edges } = buildFamilyGraph(
            familyMembers,
            handleSetReferenceUser,
            handleAddParent,
            handleAddChild,
            referenceUserId,
            setHoveredNodeId
        );
        setNodes(nodes);
        setEdges(edges);
    }, [familyMembers, referenceUserId, setHoveredNodeId]);

    // Highlight edges if connected to hovered node or in lineage
    const highlightedEdges = edges.map(edge => {
        const isDirect = hoveredNodeId && (edge.source === hoveredNodeId || edge.target === hoveredNodeId);
        const isAncestorLine = hoveredNodeId && (
            lineageIds.ancestors.has(edge.source) && lineageIds.ancestors.has(edge.target)
        );
        const isDescendantLine = hoveredNodeId && (
            lineageIds.descendants.has(edge.source) && lineageIds.descendants.has(edge.target)
        );
        return {
            ...edge,
            className: (isDirect || isAncestorLine || isDescendantLine) ? "highlighted-edge" : ""
        };
    });

    return (
        <div className="familytree-container">
            <div className="familytree-treearea">
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