import React, { useState, useRef, useCallback, useEffect } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import BossFightModal from './components/BossFightModal';
import { knowledgeGraphData, getNodeColor, getLinkColor } from './data/knowledgeGraph';
import './App.css';

const API_URL = 'http://localhost:5000';

function App() {
  const [graphData, setGraphData] = useState(knowledgeGraphData);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fgRef = useRef();

  // Create a map for quick node lookup
  const nodesMap = new Map(graphData.nodes.map(node => [node.id, node]));

  // Fetch graph data from backend
  useEffect(() => {
    const fetchGraph = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/graph`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch graph data');
        }
        
        const data = await response.json();
        
        if (data.success && data.data) {
          setGraphData(data.data);
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching graph:', err);
        setError('Backend not connected. Using local data.');
        // Keep using local data from import
      } finally {
        setLoading(false);
      }
    };
    
    fetchGraph();
  }, []);

  // Auto-rotate the graph
  useEffect(() => {
    if (fgRef.current) {
      const graph = fgRef.current;
      
      // Set initial camera position
      const distance = 400;
      graph.cameraPosition({ z: distance });
      
      // Auto-rotate
      let angle = 0;
      const rotateInterval = setInterval(() => {
        angle += 0.3;
        const x = distance * Math.sin(angle * Math.PI / 180);
        const z = distance * Math.cos(angle * Math.PI / 180);
        graph.cameraPosition({ x, y: 100, z }, { x: 0, y: 0, z: 0 }, 2000);
      }, 2000);

      return () => clearInterval(rotateInterval);
    }
  }, []);

  const handleNodeClick = useCallback((node) => {
    if (node.status === 'active') {
      setSelectedNode(node);
      setShowModal(true);
    } else if (node.status === 'locked') {
      // Show locked message
      alert(`🔒 "${node.label}" is locked. Complete prerequisite nodes first!`);
    } else if (node.status === 'mastered') {
      // Already completed
      alert(`✅ "${node.label}" already mastered! This knowledge is yours.`);
    }
  }, []);

  const handleComplete = useCallback(async (nodeId) => {
    try {
      const response = await fetch(`${API_URL}/api/node/${nodeId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success && data.updatedGraph) {
        // Update with backend response
        setGraphData(data.updatedGraph);
        
        // Show success message if nodes were unlocked
        if (data.unlockedNodes && data.unlockedNodes.length > 0) {
          console.log('🎉 Unlocked nodes:', data.unlockedNodes);
        }
      } else {
        throw new Error(data.message || 'Failed to complete node');
      }
    } catch (err) {
      console.error('Error completing node:', err);
      
      // Fallback to local state update if backend fails
      setGraphData(prevData => {
        const newNodes = prevData.nodes.map(node => {
          if (node.id === nodeId) {
            return { ...node, status: 'mastered' };
          }
          
          // Unlock child nodes
          const isChild = prevData.links.some(
            link => {
              const sourceId = link.source.id || link.source;
              const targetId = link.target.id || link.target;
              return sourceId === nodeId && targetId === node.id;
            }
          );
          
          if (isChild && node.status === 'locked') {
            // Check if all parent nodes are mastered
            const parentLinks = prevData.links.filter(
              link => {
                const targetId = link.target.id || link.target;
                return targetId === node.id;
              }
            );
            
            const allParentsMastered = parentLinks.every(link => {
              const sourceId = link.source.id || link.source;
              const parentNode = prevData.nodes.find(n => n.id === sourceId);
              return parentNode?.status === 'mastered' || sourceId === nodeId;
            });
            
            if (allParentsMastered) {
              return { ...node, status: 'active' };
            }
          }
          
          return node;
        });
        
        return { ...prevData, nodes: newNodes };
      });
    }
  }, []);

  // Custom node appearance
  const nodeThreeObject = useCallback((node) => {
    const group = new THREE.Group();
    
    // Main sphere
    const geometry = new THREE.SphereGeometry(8, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      color: getNodeColor(node.status),
      emissive: getNodeColor(node.status),
      emissiveIntensity: node.status === 'locked' ? 0.1 : 0.5,
      metalness: 0.8,
      roughness: 0.2,
    });
    const sphere = new THREE.Mesh(geometry, material);
    group.add(sphere);
    
    // Glow effect for active/mastered nodes
    if (node.status !== 'locked') {
      const glowGeometry = new THREE.SphereGeometry(10, 32, 32);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: getNodeColor(node.status),
        transparent: true,
        opacity: 0.2,
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      group.add(glow);
    }
    
    // Ring for mastered nodes
    if (node.status === 'mastered') {
      const ringGeometry = new THREE.RingGeometry(10, 12, 32);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: '#4cc9f0',
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6,
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2;
      group.add(ring);
    }
    
    return group;
  }, []);

  const nodeLabel = useCallback((node) => {
    return `
      <div style="
        background: rgba(0, 0, 0, 0.9);
        border: 2px solid ${getNodeColor(node.status)};
        border-radius: 12px;
        padding: 12px 16px;
        color: white;
        font-family: 'Rajdhani', sans-serif;
        font-size: 14px;
        text-align: center;
        box-shadow: 0 0 20px ${getNodeColor(node.status)}40;
        min-width: 150px;
      ">
        <div style="
          font-weight: bold;
          font-size: 16px;
          margin-bottom: 8px;
          color: ${getNodeColor(node.status)};
        ">
          ${node.label}
        </div>
        <div style="
          font-size: 12px;
          color: #aaa;
          Loading State */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading Knowledge Graph...</div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="error-banner">
          ⚠️ {error}
        </div>
      )}

      {/* margin-bottom: 8px;
        ">
          ${node.description}
        </div>
        <div style="
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: ${getNodeColor(node.status)};
        ">
          ${node.status === 'locked' ? '🔒 LOCKED' : node.status === 'active' ? '⚡ READY' : '✅ MASTERED'}
        </div>
      </div>
    `;
  }, []);

  // Stats calculation
  const stats = {
    total: graphData.nodes.length,
    mastered: graphData.nodes.filter(n => n.status === 'mastered').length,
    active: graphData.nodes.filter(n => n.status === 'active').length,
    locked: graphData.nodes.filter(n => n.status === 'locked').length,
  };

  return (
    <div className="app-container">
      {/* Header HUD */}
      <div className="hud-header">
        <div className="logo">
          <span className="logo-icon">🧠</span>
          <span className="logo-text">NEXUS</span>
        </div>
        <div className="subtitle">Knowledge RPG</div>
      </div>

      {/* Stats Panel */}
      <div className="stats-panel">
        <div className="stat-item">
          <div className="stat-label">Progress</div>
          <div className="stat-value">{Math.round((stats.mastered / stats.total) * 100)}%</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Mastered</div>
          <div className="stat-value mastered">{stats.mastered}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Active</div>
          <div className="stat-value active">{stats.active}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Locked</div>
          <div className="stat-value locked">{stats.locked}</div>
        </div>
      </div>

      {/* Legend */}
      <div className="legend">
        <div className="legend-title">LEGEND</div>
        <div className="legend-item">
          <div className="legend-dot mastered"></div>
          <span>Mastered</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot active"></div>
          <span>Ready to Battle</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot locked"></div>
          <span>Locked</span>
        </div>
      </div>

      {/* Instructions */}
      <div className="instructions">
        <div className="instruction-text">
          🎮 Click on <span className="highlight-green">GREEN nodes</span> to start a Boss Fight
        </div>
        <div className="instruction-text small">
          Use mouse to rotate • Scroll to zoom
        </div>
      </div>

      {/* 3D Force Graph */}
      <ForceGraph3D
        ref={fgRef}
        graphData={graphData}
        nodeLabel={nodeLabel}
        nodeThreeObject={nodeThreeObject}
        nodeThreeObjectExtend={true}
        onNodeClick={handleNodeClick}
        onNodeHover={setHoveredNode}
        linkColor={(link) => getLinkColor(link, nodesMap)}
        linkWidth={2}
        linkOpacity={0.6}
        linkDirectionalParticles={2}
        linkDirectionalParticleWidth={(link) => {
          const sourceNode = nodesMap.get(link.source.id || link.source);
          return sourceNode?.status === 'mastered' ? 2 : 0;
        }}
        linkDirectionalParticleColor={() => '#39ff14'}
        linkDirectionalParticleSpeed={0.005}
        backgroundColor="#000000"
        showNavInfo={false}
        enableNodeDrag={false}
        d3VelocityDecay={0.3}
      />

      {/* Boss Fight Modal */}
      {showModal && selectedNode && (
        <BossFightModal
          node={selectedNode}
          onClose={() => setShowModal(false)}
          onComplete={handleComplete}
        />
      )}
    </div>
  );
}

export default App;
