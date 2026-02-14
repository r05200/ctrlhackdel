import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { knowledgeGraphData } from '../data/knowledgeGraph';
import { fetchKnowledgeGraph, completeNode, verifyExplanation, generateCustomTree } from '../services/api';
import BossFightModal from './BossFightModal';

// Constellation-style node positioning
function ConstellationNode({ node, position, onClick, isSelected }) {
  const getNodeStyle = (status) => {
    switch (status) {
      case 'mastered':
        return { opacity: 1, size: 50, pulseSize: 2, shadow: '0 0 30px rgba(255,255,255,1)', rotate: true };
      case 'active':
        return { opacity: 0.8, size: 45, pulseSize: 1.8, shadow: '0 0 20px rgba(255,255,255,0.8)', rotate: true };
      case 'locked':
      default:
        return { opacity: 0.3, size: 35, pulseSize: 0, shadow: '0 0 10px rgba(255,255,255,0.3)', rotate: false };
    }
  };

  const nodeStyle = getNodeStyle(node.status);
  const baseColor = '#ffffff';
  const size = nodeStyle.size;

  return (
    <motion.div
      className="absolute cursor-pointer group"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)'
      }}
      initial={{ scale: 0, opacity: 0, rotate: -180 }}
      animate={{ 
        scale: 1, 
        opacity: 1,
        rotate: 0
      }}
      transition={{ 
        duration: 1.2,
        delay: node.level * 0.15,
        type: 'spring',
        stiffness: 100
      }}
      whileHover={{ scale: 1.4, transition: { duration: 0.3 } }}
      onClick={() => onClick(node)}
    >
      {/* Diamond/Hexagon shape instead of circle */}
      <motion.div
        style={{
          position: 'relative',
          width: `${size}px`,
          height: `${size}px`
        }}
        animate={nodeStyle.rotate ? {
          rotate: [0, 360]
        } : {}}
        transition={{
          rotate: { duration: 20, repeat: Infinity, ease: 'linear' }
        }}
      >
        {/* Star burst shape with 8 rays - shortened */}
        <svg width={size} height={size} viewBox="0 0 100 100" style={{ filter: `drop-shadow(${nodeStyle.shadow})` }}>
          {/* Main rays - 4 primary directions */}
          <motion.line
            x1="50" y1="50" x2="50" y2="20"
            stroke={baseColor}
            strokeWidth="3"
            strokeLinecap="round"
            opacity={nodeStyle.opacity}
            animate={{
              opacity: [nodeStyle.opacity * 0.6, nodeStyle.opacity, nodeStyle.opacity * 0.6]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
          <motion.line
            x1="50" y1="50" x2="80" y2="50"
            stroke={baseColor}
            strokeWidth="3"
            strokeLinecap="round"
            opacity={nodeStyle.opacity}
            animate={{
              opacity: [nodeStyle.opacity * 0.6, nodeStyle.opacity, nodeStyle.opacity * 0.6]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.25
            }}
          />
          <motion.line
            x1="50" y1="50" x2="50" y2="80"
            stroke={baseColor}
            strokeWidth="3"
            strokeLinecap="round"
            opacity={nodeStyle.opacity}
            animate={{
              opacity: [nodeStyle.opacity * 0.6, nodeStyle.opacity, nodeStyle.opacity * 0.6]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.5
            }}
          />
          <motion.line
            x1="50" y1="50" x2="20" y2="50"
            stroke={baseColor}
            strokeWidth="3"
            strokeLinecap="round"
            opacity={nodeStyle.opacity}
            animate={{
              opacity: [nodeStyle.opacity * 0.6, nodeStyle.opacity, nodeStyle.opacity * 0.6]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.75
            }}
          />
          
          {/* Secondary rays - diagonal directions */}
          <motion.line
            x1="50" y1="50" x2="71" y2="29"
            stroke={baseColor}
            strokeWidth="2"
            strokeLinecap="round"
            opacity={nodeStyle.opacity * 0.7}
            animate={{
              opacity: [nodeStyle.opacity * 0.4, nodeStyle.opacity * 0.7, nodeStyle.opacity * 0.4]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.1
            }}
          />
          <motion.line
            x1="50" y1="50" x2="71" y2="71"
            stroke={baseColor}
            strokeWidth="2"
            strokeLinecap="round"
            opacity={nodeStyle.opacity * 0.7}
            animate={{
              opacity: [nodeStyle.opacity * 0.4, nodeStyle.opacity * 0.7, nodeStyle.opacity * 0.4]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.35
            }}
          />
          <motion.line
            x1="50" y1="50" x2="29" y2="71"
            stroke={baseColor}
            strokeWidth="2"
            strokeLinecap="round"
            opacity={nodeStyle.opacity * 0.7}
            animate={{
              opacity: [nodeStyle.opacity * 0.4, nodeStyle.opacity * 0.7, nodeStyle.opacity * 0.4]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.6
            }}
          />
          <motion.line
            x1="50" y1="50" x2="29" y2="29"
            stroke={baseColor}
            strokeWidth="2"
            strokeLinecap="round"
            opacity={nodeStyle.opacity * 0.7}
            animate={{
              opacity: [nodeStyle.opacity * 0.4, nodeStyle.opacity * 0.7, nodeStyle.opacity * 0.4]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.85
            }}
          />
          
          {/* Bright center core */}
          <motion.circle
            cx="50"
            cy="50"
            r="8"
            fill={baseColor}
            opacity={nodeStyle.opacity}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [nodeStyle.opacity * 0.9, nodeStyle.opacity, nodeStyle.opacity * 0.9]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        </svg>
      </motion.div>

      {/* Label with smooth fade */}
      <motion.div
        className="absolute whitespace-nowrap font-mono text-sm font-medium"
        style={{
          left: `${size + 15}px`,
          top: '50%',
          transform: 'translateY(-50%)',
          color: baseColor,
          textShadow: `0 0 ${15 * nodeStyle.opacity}px rgba(255, 255, 255, ${nodeStyle.opacity * 0.8}), 0 2px 4px rgba(0,0,0,0.5)`,
          pointerEvents: 'none'
        }}
        initial={{ opacity: 0, x: -20 }}
        animate={{ 
          opacity: nodeStyle.opacity * 0.95, 
          x: 0 
        }}
        transition={{ 
          delay: node.level * 0.15 + 0.4,
          duration: 0.8,
          type: 'spring'
        }}
      >
        {node.label.replace('\n', ' ')}
      </motion.div>
    </motion.div>
  );
}

// Connection lines between nodes with flowing energy
function ConstellationLinks({ links, nodePositions, nodes }) {
  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{ width: '100%', height: '100%' }}
    >
      <defs>
        <filter id="constellation-glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <linearGradient id="energy-flow" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 0 }} />
          <stop offset="50%" style={{ stopColor: '#ffffff', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#ffffff', stopOpacity: 0 }} />
        </linearGradient>
      </defs>
      
      {links.map((link, i) => {
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
        
        const sourcePos = nodePositions[sourceId];
        const targetPos = nodePositions[targetId];
        
        if (!sourcePos || !targetPos) return null;

        const sourceNode = nodes.find(n => n.id === sourceId);
        const targetNode = nodes.find(n => n.id === targetId);
        
        // Subtle link styling - much less obvious
        let strokeOpacity = 0.08;
        let strokeWidth = 0.5;
        
        if (sourceNode?.status === 'mastered' || sourceNode?.status === 'active') {
          strokeOpacity = sourceNode.status === 'mastered' ? 0.25 : 0.15;
          strokeWidth = sourceNode.status === 'mastered' ? 1 : 0.7;
        }

        return (
          <motion.line
            key={i}
            x1={`${sourcePos.x}%`}
            y1={`${sourcePos.y}%`}
            x2={`${targetPos.x}%`}
            y2={`${targetPos.y}%`}
            stroke="#ffffff"
            strokeWidth={strokeWidth}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ 
              pathLength: 1, 
              opacity: strokeOpacity
            }}
            transition={{ 
              pathLength: { duration: 1.2, delay: i * 0.03 },
              opacity: { duration: 0.5, delay: i * 0.03 }
            }}
          />
        );
      })}
    </svg>
  );
}

export default function ConstellationView({ onBack, userPrompt }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const [graphData, setGraphData] = useState(knowledgeGraphData); // Start with local data as fallback
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBossFight, setShowBossFight] = useState(false);
  const [currentBossNode, setCurrentBossNode] = useState(null);
  const [generatedTopic, setGeneratedTopic] = useState('');
  
  // Fetch knowledge graph from backend on mount
  useEffect(() => {
    const loadGraphData = async () => {
      try {
        setIsLoading(true);
        
        // If user provided a prompt, generate custom tree
        if (userPrompt && userPrompt.trim()) {
          const result = await generateCustomTree(userPrompt);
          if (result.success && result.graph) {
            setGraphData(result.graph);
            setGeneratedTopic(result.topic);
            setError(null);
          } else {
            throw new Error('Failed to generate custom tree');
          }
        } else {
          // Otherwise load default tree
          const data = await fetchKnowledgeGraph();
          setGraphData(data);
          setError(null);
        }
      } catch (err) {
        console.error('Failed to fetch graph, using local data:', err);
        setError('Using offline data');
        // Keep using knowledgeGraphData as fallback
      } finally {
        setIsLoading(false);
      }
    };

    loadGraphData();
  }, [userPrompt]);

  // Handle node click - open boss fight for active nodes
  const handleNodeClick = (node) => {
    setSelectedNode(node);
    if (node.status === 'active') {
      setCurrentBossNode(node);
      setShowBossFight(true);
    }
  };

  // Handle boss fight completion
  const handleBossFightComplete = async (nodeId, explanation) => {
    try {
      // First verify the explanation
      const verifyResult = await verifyExplanation(nodeId, explanation);
      
      if (verifyResult.passed) {
        // If passed, complete the node
        const result = await completeNode(nodeId);
        
        if (result.success) {
          // Update the graph with new data
          setGraphData(result.updatedGraph);
          setShowBossFight(false);
          setCurrentBossNode(null);
          
          // Show success message (you can add a toast notification here)
          console.log('✅', result.message);
          if (result.unlockedNodes.length > 0) {
            console.log('🔓 Unlocked:', result.unlockedNodes);
          }
        }
      } else {
        // Show feedback to user (you can add a toast notification here)
        console.log('❌ Verification failed:', verifyResult.message);
        alert(`${verifyResult.message}\n\nScore: ${verifyResult.score}/100\n\nFeedback: ${verifyResult.feedback}`);
      }
    } catch (err) {
      console.error('Error completing boss fight:', err);
      alert('Failed to verify explanation. Please try again.');
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="relative w-full h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <motion.div
            className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <p className="text-white font-mono">Loading constellation...</p>
        </div>
      </div>
    );
  }
  
  // Position nodes in a constellation pattern (top to bottom)
  // Dynamic positioning based on node levels
  const nodePositions = {};
  const nodesByLevel = {};
  
  // Group nodes by level
  graphData.nodes.forEach(node => {
    if (!nodesByLevel[node.level]) {
      nodesByLevel[node.level] = [];
    }
    nodesByLevel[node.level].push(node);
  });
  
  // Calculate positions for each level
  const maxLevel = Math.max(...graphData.nodes.map(n => n.level));
  const verticalSpacing = 70 / (maxLevel); // Distribute 70% of height
  
  Object.keys(nodesByLevel).forEach(level => {
    const nodes = nodesByLevel[level];
    const count = nodes.length;
    const levelNum = parseInt(level);
    
    // Vertical position based on level
    const y = 10 + (levelNum - 1) * verticalSpacing;
    
    // Horizontal distribution
    if (count === 1) {
      nodePositions[nodes[0].id] = { x: 50, y };
    } else {
      const spacing = 60 / (count + 1); // Distribute across 60% of width
      nodes.forEach((node, idx) => {
        const x = 20 + spacing * (idx + 1);
        nodePositions[node.id] = { x, y };
      });
    }
  });

  return (
    <motion.div 
      className="relative w-full h-screen bg-black overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >

      {/* Topic Header (if generated from prompt) */}
      {generatedTopic && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="absolute top-6 left-6 z-50 bg-black/60 border border-white/30 rounded-lg px-6 py-3 backdrop-blur-sm"
        >
          <div className="text-sm text-gray-400 font-mono">Learning Path:</div>
          <div className="text-xl text-white font-bold font-mono mt-1" style={{ textShadow: '0 0 15px rgba(255, 255, 255, 0.5)' }}>
            {generatedTopic.toUpperCase()}
          </div>
        </motion.div>
      )}

      {/* Back button with glow */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(255, 255, 255, 0.4)' }}
        transition={{ type: 'spring', stiffness: 300 }}
        onClick={onBack}
        className="absolute top-6 right-6 z-50 px-6 py-3 bg-black/60 border border-white/30 rounded-lg font-mono text-white hover:bg-white/10 transition-all backdrop-blur-sm"
        style={{
          boxShadow: '0 0 20px rgba(255, 255, 255, 0.2)'
        }}
      >
        Back
      </motion.button>

      {/* Constellation graph */}
      <motion.div 
        className="absolute inset-0 flex items-center justify-center"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.3 }}
      >
        <div className="relative w-full h-full">
          {/* Connection lines */}
          <ConstellationLinks 
            links={graphData.links} 
            nodePositions={nodePositions}
            nodes={graphData.nodes}
          />
          
          {/* Nodes */}
          {graphData.nodes.map((node) => (
            <ConstellationNode
              key={node.id}
              node={node}
              position={nodePositions[node.id]}
              onClick={handleNodeClick}
              isSelected={selectedNode?.id === node.id}
            />
          ))}
        </div>
      </motion.div>

      {/* Enhanced Legend */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1, duration: 0.8, type: 'spring' }}
        className="absolute bottom-8 left-8 z-50 bg-black/80 border border-white/20 rounded-xl p-5 backdrop-blur-md"
        style={{ 
          fontFamily: 'monospace',
          boxShadow: '0 0 30px rgba(0, 0, 0, 0.5)'
        }}
      >
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <motion.div 
              className="w-4 h-4 rounded-full bg-white" 
              style={{ boxShadow: '0 0 20px rgba(255, 255, 255, 0.8)' }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-sm text-gray-200 font-medium">Mastered</span>
          </div>
          <div className="flex items-center gap-3">
            <motion.div 
              className="w-3 h-3 rounded-full bg-white opacity-80" 
              style={{ boxShadow: '0 0 15px rgba(255, 255, 255, 0.5)' }}
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
            />
            <span className="text-sm text-gray-300">Available</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-white opacity-30" />
            <span className="text-sm text-gray-500">Locked</span>
          </div>
        </div>
      </motion.div>

      {/* Node details panel with AnimatePresence */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, x: 30, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 30, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute bottom-8 right-8 z-50 bg-black/80 border border-white/30 rounded-xl p-6 max-w-sm backdrop-blur-md"
            style={{
              fontFamily: 'monospace',
              boxShadow: '0 0 40px rgba(255, 255, 255, 0.2)'
            }}
          >
            <motion.h3 
              className="text-xl text-white mb-2 font-bold"
              style={{ textShadow: '0 0 15px rgba(255, 255, 255, 0.5)' }}
              initial={{ y: -10 }}
              animate={{ y: 0 }}
            >
              {selectedNode.label.replace('\n', ' ')}
            </motion.h3>
            <motion.p 
              className="text-sm text-gray-300 mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {selectedNode.description}
            </motion.p>
            <div className="flex items-center gap-2">
              <motion.span 
                className="px-3 py-1 bg-white/10 border border-white/30 rounded text-xs text-white"
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.15)' }}
              >
                Level {selectedNode.level}
              </motion.span>
              <motion.span 
                className={`px-3 py-1 rounded text-xs font-semibold border ${
                  selectedNode.status === 'mastered' ? 'bg-white/30 border-white text-white' :
                  selectedNode.status === 'active' ? 'bg-white/20 border-white/70 text-white/80' :
                  'bg-white/10 border-white/30 text-white/40'
                }`}
                whileHover={{ scale: 1.05 }}
              >
                {selectedNode.status.toUpperCase()}
              </motion.span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Boss Fight Modal */}
      {showBossFight && currentBossNode && (
        <BossFightModal
          node={currentBossNode}
          onClose={() => {
            setShowBossFight(false);
            setCurrentBossNode(null);
          }}
          onComplete={handleBossFightComplete}
        />
      )}

      {/* Error indicator (if using offline data) */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-yellow-500/20 border border-yellow-500/50 rounded-lg px-4 py-2 text-yellow-200 text-sm font-mono backdrop-blur-sm"
        >
          ⚠️ {error} - Backend not connected
        </motion.div>
      )}
    </motion.div>
  );
}
