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

function getLayoutedElements(nodes, edges, direction = "TB") {
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

function buildFamilyGraph(members, onView, onAddParent, onAddChild) {
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

    return getLayoutedElements(nodes, edges);
}

const FamilyTreePage = () => {
    const [familyMembers, setFamilyMembers] = useState([]);
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [viewingMember, setViewingMember] = useState(null);
    const [editingMember, setEditingMember] = useState(null);
    const [adding, setAdding] = useState(false);
    const [addContext, setAddContext] = useState(null);

    const fetchMembers = useCallback(async () => {
        const token = localStorage.getItem("authToken");
        const res = await fetch("http://localhost:5240/api/familymember", {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
            const data = await res.json();
            setFamilyMembers(data);
        }
    }, []);

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

    useEffect(() => {
        const { nodes, edges } = buildFamilyGraph(
            familyMembers,
            setViewingMember,
            handleAddParent,
            handleAddChild
        );
        setNodes(nodes);
        setEdges(edges);
    }, [familyMembers]);

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
                            onEdit={() => handleEdit(viewingMember)}
                            onBack={() => setViewingMember(null)}
                        />
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