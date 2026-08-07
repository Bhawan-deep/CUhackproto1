import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import GovernmentNode from './GovernmentNode';
import BusinessNode from './BusinessNode';
import CitizenGroupNode from './CitizenGroupNode';
import BankNode from './BankNode';
import MoneyFlowEdge from './MoneyFlowEdge';
import WorldTooltip from './WorldTooltip';
import WorldInspector from './WorldInspector';
import { getWorldState } from '../../api/simulations';
import { transformWorldToGraph } from '../../utils/worldGraph';

const nodeTypes = {
  government: GovernmentNode,
  bank: BankNode,
  business: BusinessNode,
  citizenGroup: CitizenGroupNode,
};

const edgeTypes = {
  moneyFlow: MoneyFlowEdge,
};



function FlowCanvas({ simulationId, liveState, displayWorld, baseline, impactDeltas, impactMode, viewMode, viewedTick, onOpenWhyModal }) {

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [rawWorldData, setRawWorldData] = useState(null);
  
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [mousePos, setMousePos] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Initial graph loading from GET /api/simulations/{id}/world
  useEffect(() => {
    if (!simulationId) return;

    let isMounted = true;
    setIsLoading(true);

    getWorldState(simulationId)
      .then((data) => {
        if (!isMounted) return;
        setRawWorldData(data);
        const { initialNodes, initialEdges } = transformWorldToGraph(data);
        setNodes(initialNodes);
        setEdges(initialEdges);
      })
      .catch((err) => {
        console.error('[EconomicWorld] Failed to load world state:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [simulationId, setNodes, setEdges]);

  // 2. World State Sync (LIVE or REPLAY): Update node.data properties in-place without resetting positions, selection, or viewport
  useEffect(() => {
    const summary = displayWorld || liveState?.world_summary;
    if (!summary) return;

    setNodes((prevNodes) =>
      prevNodes.map((node) => {
        let isImpactActive = false;
        let nodeDelta = null;

        if (impactMode && impactDeltas) {
          if (node.type === 'business') {
            nodeDelta = impactDeltas.businessDeltas[node.id];
            isImpactActive = nodeDelta?.isAffected || false;
          } else if (node.type === 'citizenGroup') {
            nodeDelta = impactDeltas.groupDeltas[node.id];
            isImpactActive = nodeDelta?.isAffected || false;
          } else if (node.id === 'government' && baseline?.interventionInfo?.type === 'policy') {
            isImpactActive = true;
          }
        }

        if (node.id === 'government' && summary.government) {
          return {
            ...node,
            data: {
              ...node.data,
              tax_rate: summary.government.tax_rate ?? node.data.tax_rate,
              infrastructure_spending: summary.government.infrastructure_spending ?? node.data.infrastructure_spending,
              treasury: summary.government.treasury ?? node.data.treasury,
              public_satisfaction: summary.government.public_satisfaction ?? node.data.public_satisfaction,
              isImpactActive,
              impactDelta: nodeDelta,
            },
          };
        }

        if (node.type === 'business' && summary.businesses) {
          const updatedBiz = summary.businesses.find((b) => String(b.id) === node.id);
          if (updatedBiz) {
            return {
              ...node,
              data: {
                ...node.data,
                health: updatedBiz.health ?? node.data.health,
                revenue: updatedBiz.revenue ?? node.data.revenue,
                profit: updatedBiz.profit ?? node.data.profit,
                employee_count: updatedBiz.employee_count ?? node.data.employee_count,
                isImpactActive,
                impactDelta: nodeDelta,
              },
            };
          }
        }

        if (node.type === 'citizenGroup' && summary.citizen_groups) {
          const updatedGroup = summary.citizen_groups.find((g) => String(g.id) === node.id);
          if (updatedGroup) {
            return {
              ...node,
              data: {
                ...node.data,
                count: updatedGroup.count ?? node.data.count,
                employed_count: updatedGroup.employed_count ?? node.data.employed_count,
                average_income: updatedGroup.average_income ?? node.data.average_income,
                average_wealth: updatedGroup.average_wealth ?? node.data.average_wealth,
                average_satisfaction: updatedGroup.average_satisfaction ?? node.data.average_satisfaction,
                isImpactActive,
                impactDelta: nodeDelta,
              },
            };
          }
        }

        return node;
      })
    );
  }, [displayWorld, liveState, setNodes, impactMode, impactDeltas, baseline]);


  // 3. Highlight connected nodes and edges when a node is selected or impact mode is active
  const { highlightedNodes, highlightedEdgeIds } = useMemo(() => {
    if (!selectedNodeId) {
      return { highlightedNodes: null, highlightedEdgeIds: null };
    }

    const connectedNodes = new Set([selectedNodeId]);
    const connectedEdges = new Set();

    edges.forEach((edge) => {
      if (edge.source === selectedNodeId || edge.target === selectedNodeId) {
        connectedEdges.add(edge.id);
        connectedNodes.add(edge.source);
        connectedNodes.add(edge.target);
      }
    });

    return { highlightedNodes: connectedNodes, highlightedEdgeIds: connectedEdges };
  }, [selectedNodeId, edges]);

  // Style nodes based on focus selection or impact mode
  const styledNodes = useMemo(() => {
    if (highlightedNodes) {
      return nodes.map((node) => {
        const isHighlighted = highlightedNodes.has(node.id);
        return {
          ...node,
          style: {
            ...node.style,
            opacity: isHighlighted ? 1.0 : 0.25,
            transition: 'opacity 0.3s ease',
          },
        };
      });
    }

    if (impactMode) {
      return nodes.map((node) => {
        const isAffected = node.data.isImpactActive;
        return {
          ...node,
          style: {
            ...node.style,
            opacity: isAffected ? 1.0 : 0.35,
            transition: 'opacity 0.3s ease',
          },
        };
      });
    }

    return nodes;
  }, [nodes, highlightedNodes, impactMode]);


  // Style edges based on focus selection
  const styledEdges = useMemo(() => {
    if (!highlightedEdgeIds) return edges;

    return edges.map((edge) => {
      const isHighlighted = highlightedEdgeIds.has(edge.id);
      return {
        ...edge,
        animated: isHighlighted || edge.animated,
        style: {
          ...edge.style,
          stroke: isHighlighted ? '#38bdf8' : '#334155',
          strokeWidth: isHighlighted ? 2.5 : 1.0,
          opacity: isHighlighted ? 1.0 : 0.08,
          transition: 'all 0.3s ease',
        },
      };
    });
  }, [edges, highlightedEdgeIds]);

  // Node click handler (toggle selection)
  const onNodeClick = useCallback(
    (_, node) => {
      if (selectedNodeId === node.id) {
        setSelectedNodeId(null);
      } else {
        setSelectedNodeId(node.id);
      }
    },
    [selectedNodeId]
  );

  // Pane click handler (deselect on canvas click)
  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  // Hover mouse tracking
  const onNodeMouseEnter = useCallback((event, node) => {
    setHoveredNode(node);
    setMousePos({ x: event.clientX, y: event.clientY });
  }, []);

  const onNodeMouseMove = useCallback((event) => {
    setMousePos({ x: event.clientX, y: event.clientY });
  }, []);

  const onNodeMouseLeave = useCallback(() => {
    setHoveredNode(null);
    setMousePos(null);
  }, []);

  const activeSelectedNode = useMemo(() => {
    return nodes.find((n) => n.id === selectedNodeId);
  }, [nodes, selectedNodeId]);

  return (
    <div className="relative w-full h-[calc(100vh-140px)] min-h-[620px] bg-[#090D16] flex overflow-hidden">
      {/* Main Graph Viewport */}
      <div className="flex-1 relative h-full">
        {isLoading ? (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#090D16]/90 text-slate-400 space-y-3">
            <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-mono">Initializing Economic Digital Twin graph...</p>
          </div>
        ) : (
          <ReactFlow
            nodes={styledNodes}
            edges={styledEdges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}

            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onNodeMouseEnter={onNodeMouseEnter}
            onNodeMouseMove={onNodeMouseMove}
            onNodeMouseLeave={onNodeMouseLeave}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.3}
            maxZoom={2.0}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#1e293b" gap={24} size={1} />
            <Controls className="!bg-slate-900 !border-slate-800 !text-slate-200 !shadow-xl" />
          </ReactFlow>
        )}

        {/* Hover Tooltip Popover */}
        <WorldTooltip hoveredNode={hoveredNode} mousePos={mousePos} />
      </div>

      {/* Side Inspector Drawer */}
      {activeSelectedNode && (
        <WorldInspector
          selectedNode={activeSelectedNode}
          baseline={baseline}
          impactDeltas={impactDeltas}
          viewMode={viewMode}
          viewedTick={viewedTick}
          onClose={() => setSelectedNodeId(null)}
          onOpenWhyModal={onOpenWhyModal}
        />
      )}

    </div>
  );
}

export default function EconomicWorld({
  simulationId,
  liveState,
  displayWorld,
  baseline,
  impactDeltas,
  impactMode,
  viewMode,
  viewedTick,
  onOpenWhyModal
}) {
  return (
    <ReactFlowProvider>
      <FlowCanvas
        simulationId={simulationId}
        liveState={liveState}
        displayWorld={displayWorld}
        baseline={baseline}
        impactDeltas={impactDeltas}
        impactMode={impactMode}
        viewMode={viewMode}
        viewedTick={viewedTick}
        onOpenWhyModal={onOpenWhyModal}
      />
    </ReactFlowProvider>
  );
}



