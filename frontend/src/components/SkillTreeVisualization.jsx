import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import ForceGraph3D from 'react-force-graph-3d';

const getNodeColor = (status) => {
  switch (status) {
    case 'mastered':
      return '#4cc9f0'; // Bright blue
    case 'active':
      return '#39ff14'; // Neon green
    case 'locked':
      return '#555555'; // Gray
    default:
      return '#ffffff';
  }
};

const SkillTreeVisualization = ({ graphData, onNodeClick, selectedNodeId }) => {
  const fgRef = useRef();
  const [highlightedNodeId, setHighlightedNodeId] = useState(null);

  // Memoize nodes map to avoid recreating it on every render
  const nodesMap = useMemo(() => {
    return new Map(graphData.nodes.map(node => [node.id, node]));
  }, [graphData.nodes]);
  
  // Memoize node objects to avoid recreating on every render
  const nodeObjects = useMemo(() => {
    return graphData.nodes.map(node => ({
      id: node.id,
      name: node.label,
      val: node.status === 'active' ? 40 : node.status === 'mastered' ? 35 : 25,
      color: getNodeColor(node.status),
      status: node.status,
    }));
  }, [graphData.nodes]);

  // Memoize link objects to avoid recreating on every render
  const linkObjects = useMemo(() => {
    return graphData.links.map(link => ({
      source: link.source,
      target: link.target,
    }));
  }, [graphData.links]);

  // Set up force simulation only once
  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.d3Force('charge').strength(-200);
      fgRef.current.d3Force('link').distance(80);
    }
  }, []);

  // Memoize click handler to avoid unnecessary re-renders
  const handleNodeClick = useCallback((node) => {
    if (node && node.id) {
      setHighlightedNodeId(node.id);
      onNodeClick(nodesMap.get(node.id));
    }
  }, [onNodeClick, nodesMap]);

  // Memoize hover handler and only update if node actually changed
  const handleNodeHover = useCallback((node) => {
    setHighlightedNodeId(prevId => {
      const newId = node ? node.id : null;
      // Only update state if the node actually changed
      return newId === prevId ? prevId : newId;
    });
  }, []);

  // Memoize nodeColor function to prevent recalculation on every render
  const getNodeColorForRender = useCallback((node) => {
    const isSelected = node.id === selectedNodeId;
    const isHighlighted = node.id === highlightedNodeId;
    
    if (isSelected) return '#FFD700'; // Gold for selected
    if (isHighlighted) return '#FFFF00'; // Yellow for hovered
    return node.color;
  }, [selectedNodeId, highlightedNodeId]);

  // Memoize nodeLabel function
  const getNodeLabel = useCallback((node) => {
    const fullNode = nodesMap.get(node.id);
    return `<div style="background: #111; padding: 8px; border-radius: 4px; border: 1px solid #4A4A4A; font-size: 12px;">
      <strong>${fullNode.label.replace('\n', ' ')}</strong><br/>
      Status: ${fullNode.status}<br/>
      ${fullNode.description}
    </div>`;
  }, [nodesMap]);

  return (
    <div className="relative w-full h-full bg-black" onClick={() => onNodeClick(null)}>
      <ForceGraph3D
        ref={fgRef}
        graphData={{ nodes: nodeObjects, links: linkObjects }}
        nodeColor={getNodeColorForRender}
        nodeSize="val"
        nodeLabel={getNodeLabel}
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
        linkColor={() => 'rgba(76, 201, 240, 0.6)'}
        linkWidth={3}
        linkOpacity={0.8}
        backgroundColor="#000000"
        showNavInfo={false}
        width={typeof window !== 'undefined' ? window.innerWidth : 800}
        height={typeof window !== 'undefined' ? window.innerHeight : 600}
        onBackgroundClick={() => {
          setHighlightedNodeId(null);
          onNodeClick(null);
        }}
      />
      
      {/* Overlay info panel */}
      {selectedNodeId && (
        <div className="absolute bottom-6 left-6 bg-gray-900 border border-gray-700 rounded p-4 max-w-sm">
          <div className="text-sm text-gray-300">
            {graphData.nodes.find(n => n.id === selectedNodeId) && (
              <>
                <p className="font-bold text-blue-400">
                  {graphData.nodes.find(n => n.id === selectedNodeId).label.replace('\n', ' ')}
                </p>
                <p className="text-xs mt-2">
                  {graphData.nodes.find(n => n.id === selectedNodeId).description}
                </p>
                <p className="text-xs mt-2">
                  Status: <span className="capitalize font-semibold">
                    {graphData.nodes.find(n => n.id === selectedNodeId).status}
                  </span>
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillTreeVisualization;
