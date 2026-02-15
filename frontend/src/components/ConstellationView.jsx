import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { knowledgeGraphData } from '../data/knowledgeGraph';
import FIXED_STARS from '../data/stars';
import { fetchKnowledgeGraph, completeNode, verifyExplanation, generateCustomTree } from '../services/api';
import BossFightModal from './BossFightModal';
import ConstellationLoader from './ConstellationLoader';

const normalizeNodeStatus = (node) => {
  if (typeof node.status === 'number') {
    if (node.status > 0) return 'mastered';
    if (node.status === 0) return 'active';
    return 'locked';
  }
  return node.status;
};

const getNodeBestScore = (node) => {
  if (typeof node.status === 'number' && node.status > 0) {
    return node.status;
  }
  return node.score || null;
};

const getNodeStyleByStatus = (status) => {
  switch (status) {
    case 'mastered':
      return { opacity: 1, size: 68, pulseSize: 2.2, shadow: '0 0 34px rgba(255,255,255,1)', rotate: true };
    case 'active':
      return { opacity: 0.86, size: 60, pulseSize: 2, shadow: '0 0 26px rgba(255,255,255,0.82)', rotate: true };
    case 'locked':
    default:
      return { opacity: 0.42, size: 50, pulseSize: 1.2, shadow: '0 0 14px rgba(255,255,255,0.42)', rotate: true };
  }
};

const hashString = (value) => {
  let hash = 0;
  const str = String(value || '');
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash;
};

const getNodeMotionProfile = (nodeId) => {
  const hash = hashString(nodeId);
  const dir = hash % 2 === 0 ? 1 : -1;
  const swing = 8 + (hash % 13); // 8..20 degrees
  const rotationDuration = 7 + (hash % 6); // 7..12 sec
  const shimmerDuration = 2.6 + ((hash >>> 3) % 22) / 10; // 2.6..4.7 sec
  const shimmerDelay = ((hash >>> 5) % 14) / 10; // 0..1.3 sec
  return { dir, swing, rotationDuration, shimmerDuration, shimmerDelay };
};

const isHexColor = (value) => /^#[0-9a-fA-F]{6}$/.test(String(value || '').trim());

const withAlpha = (hex, alpha = 1) => {
  const safeHex = isHexColor(hex) ? hex : '#ffffff';
  const n = safeHex.replace('#', '');
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const hexToRgbString = (hex) => {
  const safeHex = isHexColor(hex) ? hex : '#ffffff';
  const n = safeHex.replace('#', '');
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
};

const getStatusHighlightColor = (status) => {
  if (status === 'mastered') return '#3b82f6';
  if (status === 'active') return '#22c55e';
  return null;
};
// Constellation-style node positioning
function ConstellationNode({ node, position, onClick, isSelected, isUnlocking = false, nodeColor = '#ffffff' }) {
  const normalizedStatus = normalizeNodeStatus(node);
  const nodeStyle = getNodeStyleByStatus(normalizedStatus);
  const baseColor = isHexColor(nodeColor) ? nodeColor : '#ffffff';
  const shimmerHighlight = getStatusHighlightColor(normalizedStatus);
  const glowColor = shimmerHighlight || baseColor;
  const size = nodeStyle.size;
  const motionProfile = useMemo(() => getNodeMotionProfile(node.id), [node.id]);

  return (
    <motion.div
      className="absolute cursor-pointer group"
      style={{ position: 'absolute' }}
      initial={{ scale: 0, opacity: 0, rotate: -180 }}
      animate={isUnlocking ? {
        left: `${position.x}%`,
        top: `${position.y}%`,
        scale: [1, 1.3, 1],
        opacity: 1,
        rotate: 0,
        boxShadow: [
          '0 0 20px rgba(96, 165, 250, 0)',
          '0 0 50px rgba(96, 165, 250, 0.8)',
          '0 0 20px rgba(96, 165, 250, 0)'
        ]
      } : {
        left: `${position.x}%`,
        top: `${position.y}%`,
        scale: 1,
        opacity: 1,
        rotate: 0
      }}
      transition={isUnlocking ? {
        left: { type: 'spring', damping: 22, mass: 0.8 },
        top: { type: 'spring', damping: 22, mass: 0.8 },
        duration: 1.2,
        ease: 'easeOut'
      } : {
        left: { type: 'spring', damping: 22, mass: 0.8, delay: node.level * 0.03 },
        top: { type: 'spring', damping: 22, mass: 0.8, delay: node.level * 0.03 },
        duration: 1.2,
        delay: node.level * 0.15,
        type: 'spring',
        stiffness: 100
      }}
      whileHover={{ scale: 1.32, transition: { duration: 0.3 } }}
      onClick={() => onClick(node)}
    >
      <div
        style={{
          position: 'relative',
          transform: 'translate(-50%, -50%)'
        }}
      >
        <motion.div
          style={{
            position: 'relative',
            width: `${size}px`,
            height: `${size}px`
          }}
          animate={nodeStyle.rotate ? {
            rotate: [
              0,
              motionProfile.dir * motionProfile.swing,
              0,
              motionProfile.dir * -motionProfile.swing,
              0
            ]
          } : {}}
          transition={{
            rotate: {
              duration: motionProfile.rotationDuration,
              repeat: Infinity,
              ease: 'easeInOut'
            }
          }}
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            style={{
              filter: `drop-shadow(0 0 12px ${withAlpha(glowColor, 0.85)}) drop-shadow(${nodeStyle.shadow})`
            }}
          >
            <motion.path
              d="M50 6 L58 42 L94 50 L58 58 L50 94 L42 58 L6 50 L42 42 Z"
              fill={baseColor}
              opacity={nodeStyle.opacity}
              animate={{
                scale: [1, 1.06, 0.98, 1],
                opacity: [nodeStyle.opacity * 0.74, nodeStyle.opacity, nodeStyle.opacity * 0.78]
              }}
              transition={{
                duration: motionProfile.shimmerDuration,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: motionProfile.shimmerDelay
              }}
            />
            <motion.path
              d="M50 24 L54 46 L76 50 L54 54 L50 76 L46 54 L24 50 L46 46 Z"
              fill={baseColor}
              opacity={nodeStyle.opacity * 0.86}
              animate={{
                opacity: [nodeStyle.opacity * 0.56, nodeStyle.opacity * 0.92, nodeStyle.opacity * 0.56]
              }}
              transition={{
                duration: motionProfile.shimmerDuration * 0.9,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: motionProfile.shimmerDelay * 0.6
              }}
            />
            {shimmerHighlight && (
              <motion.path
                d="M50 6 L58 42 L94 50 L58 58 L50 94 L42 58 L6 50 L42 42 Z"
                fill={shimmerHighlight}
                opacity={0.2}
                animate={{
                  opacity: [0.08, 0.45, 0.12, 0.38, 0.08]
                }}
                transition={{
                  duration: motionProfile.shimmerDuration * 0.9,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: motionProfile.shimmerDelay * 0.5
                }}
              />
            )}
            <motion.circle
              cx="50"
              cy="50"
              r="6"
              fill={baseColor}
              opacity={nodeStyle.opacity * 0.95}
              animate={{
                scale: [1, 1.22, 0.92, 1],
                opacity: [nodeStyle.opacity * 0.72, nodeStyle.opacity, nodeStyle.opacity * 0.72]
              }}
              transition={{
                duration: motionProfile.shimmerDuration,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: motionProfile.shimmerDelay
              }}
            />
          </svg>

          {isUnlocking && (
            <>
              <motion.svg
                width={size * 3}
                height={size * 3}
                viewBox="0 0 100 100"
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none'
                }}
              >
                <defs>
                  <filter id="unlock-glow">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <motion.circle
                  cx="50"
                  cy="50"
                  r="20"
                  fill="none"
                  stroke="#60a5fa"
                  strokeWidth="2"
                  opacity={0.8}
                  filter="url(#unlock-glow)"
                  animate={{
                    r: [20, 35, 50],
                    opacity: [0.8, 0.4, 0]
                  }}
                  transition={{
                    duration: 1.2,
                    ease: 'easeOut'
                  }}
                />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="25"
                  fill="none"
                  stroke="#a78bfa"
                  strokeWidth="1.5"
                  opacity={0.6}
                  filter="url(#unlock-glow)"
                  animate={{
                    r: [25, 40, 55],
                    opacity: [0.6, 0.2, 0]
                  }}
                  transition={{
                    duration: 1.3,
                    ease: 'easeOut',
                    delay: 0.1
                  }}
                />
              </motion.svg>
            </>
          )}
        </motion.div>

        <motion.div
          className="absolute whitespace-nowrap font-mono text-sm font-medium"
          style={{
            left: `${size + 18}px`,
            top: '50%',
            transform: 'translateY(-50%)',
            color: baseColor,
            textShadow: `0 0 ${15 * nodeStyle.opacity}px ${withAlpha(baseColor, nodeStyle.opacity * 0.8)}, 0 2px 4px rgba(0,0,0,0.5)`,
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

        <motion.div
          className="absolute whitespace-nowrap font-mono text-xs"
          style={{
            left: `${size + 18}px`,
            top: 'calc(50% + 20px)',
            color: normalizedStatus === 'mastered' ? '#60a5fa' : normalizedStatus === 'active' ? '#99ff00' : '#888888',
            opacity: nodeStyle.opacity * 0.8,
            textShadow: `0 0 8px ${withAlpha(baseColor, nodeStyle.opacity * 0.45)}`,
            pointerEvents: 'none',
            fontSize: '10px'
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: nodeStyle.opacity * 0.8 }}
          transition={{ delay: node.level * 0.15 + 0.6, duration: 0.8 }}
        >
          {normalizedStatus === 'mastered' ? `Best Score: ${getNodeBestScore(node) || 95}%` : 'Incomplete'}
        </motion.div>
      </div>
    </motion.div>
  );
}

// Connection lines between nodes with flowing energy
function ConstellationLinks({ links, nodePositions, nodes, animatingEdges = [], nodeColor = '#ffffff' }) {
  const baseColor = isHexColor(nodeColor) ? nodeColor : '#ffffff';
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
        <filter id="neural-glow">
          <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.8"/>
          </feComponentTransfer>
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
        
        // Check if this edge is animating
        const isAnimating = animatingEdges.includes(i);
        
        // Base edge styling
        let strokeOpacity = 0.32;
        let strokeWidth = 5.2;
        let strokeColor = withAlpha(baseColor, 0.55);
        
        const sourceStatus = sourceNode ? normalizeNodeStatus(sourceNode) : 'locked';
        if (sourceStatus === 'mastered' || sourceStatus === 'active') {
          strokeOpacity = sourceStatus === 'mastered' ? 0.52 : 0.4;
          strokeWidth = sourceStatus === 'mastered' ? 2.3 : 1.9;
        }

        // Neural animation for newly unlocked edges
        if (isAnimating) {
          return (
            <g key={i}>
              {/* Glow effect */}
              <motion.line
                x1={`${sourcePos.x}%`}
                y1={`${sourcePos.y}%`}
                x2={`${targetPos.x}%`}
                y2={`${targetPos.y}%`}
                stroke="#60a5fa"
                strokeWidth={4}
                filter="url(#neural-glow)"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: [0, 0.8, 0],
                  strokeWidth: [3, 5, 3]
                }}
                transition={{
                  duration: 1.5,
                  ease: 'easeOut'
                }}
              />
              
              {/* Main neural pulse */}
              <motion.line
                x1={`${sourcePos.x}%`}
                y1={`${sourcePos.y}%`}
                x2={`${targetPos.x}%`}
                y2={`${targetPos.y}%`}
                stroke="#a78bfa"
                strokeWidth={2}
                initial={{ opacity: 0 }}
                animate={{
                  opacity: [0, 1, 0.3]
                }}
                transition={{
                  duration: 1.5,
                  ease: 'easeOut'
                }}
              />
              
              {/* Traveling energy particle */}
              <motion.circle
                r="8"
                fill="#60a5fa"
                filter="url(#neural-glow)"
                initial={{ cx: `${sourcePos.x}%`, cy: `${sourcePos.y}%`, opacity: 0 }}
                animate={{
                  cx: [`${sourcePos.x}%`, `${targetPos.x}%`],
                  cy: [`${sourcePos.y}%`, `${targetPos.y}%`],
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: 1.5,
                  ease: 'easeOut'
                }}
              />
            </g>
          );
        }

        const breatheDuration = 2.6 + (i % 6) * 0.28;
        const breatheDelay = (i % 9) * 0.1;

        return (
          <motion.line
            key={i}
            x1={`${sourcePos.x}%`}
            y1={`${sourcePos.y}%`}
            x2={`${targetPos.x}%`}
            y2={`${targetPos.y}%`}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            filter="url(#constellation-glow)"
            initial={{ opacity: 0 }}
            animate={{
              opacity: [strokeOpacity * 0.8, strokeOpacity, strokeOpacity * 0.6]
            }}
            transition={{
              opacity: { duration: breatheDuration, delay: breatheDelay, repeat: Infinity, ease: 'easeInOut' }
            }}
          />
        );
      })}
    </svg>
  );
}

const parseGraphPayload = (payload) => {
  if (!payload) return null;
  if (payload.graph?.nodes && payload.graph?.links) return payload.graph;
  if (payload.nodes && payload.links) return payload;
  return null;
};

export default function ConstellationView({
  onBack,
  userPrompt,
  graphData: initialGraphData = null,
  query = '',
  hideSideHud = false,
  onTopicResolved,
  nodeColor = '#ffffff',
  backgroundStarsEnabled = true,
  starColor = '#ffffff'
}) {
  const [selectedNode, setSelectedNode] = useState(null);
  const [graphData, setGraphData] = useState(knowledgeGraphData); // Start with local data as fallback
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBossFight, setShowBossFight] = useState(false);
  const [currentBossNode, setCurrentBossNode] = useState(null);
  const [generatedTopic, setGeneratedTopic] = useState('');
  const [unlockedNodes, setUnlockedNodes] = useState([]);
  const [animatingEdges, setAnimatingEdges] = useState([]);
  const graphContainerRef = useRef(null);
  const [cursorPoint, setCursorPoint] = useState(null);
  const constellationBgStars = useMemo(
    () => FIXED_STARS.filter((star, idx) => idx % 2 === 0),
    []
  );
  const constellationStarColor = isHexColor(starColor) ? starColor : '#ffffff';
  const constellationStarRgb = hexToRgbString(constellationStarColor);
  const [toast, setToast] = useState(null); // { type: 'success'|'error'|'info', title, lines[] }
  
  // Resolve graph from props or backend
  useEffect(() => {
    const loadGraphData = async () => {
      try {
        setIsLoading(true);
        const prompt = userPrompt || query;
        const providedGraph = parseGraphPayload(initialGraphData);

        if (providedGraph) {
          setGraphData(providedGraph);
          const resolvedTopic = initialGraphData?.topic || prompt || '';
          setGeneratedTopic(resolvedTopic);
          if (onTopicResolved) onTopicResolved(resolvedTopic);
          setError(null);
          return;
        }

        if (prompt && prompt.trim()) {
          const result = await generateCustomTree(prompt);

          if (result && result.success && result.graph && result.graph.nodes && result.graph.links) {
            const newGraph = {
              nodes: [...result.graph.nodes],
              links: [...result.graph.links]
            };

            setGraphData(newGraph);
            const resolvedTopic = result.topic || prompt;
            setGeneratedTopic(resolvedTopic);
            if (onTopicResolved) onTopicResolved(resolvedTopic);
            setError(null);
          } else {
            throw new Error('Failed to generate custom tree - invalid structure');
          }
        } else {
          const data = await fetchKnowledgeGraph();
          if (data && data.nodes && data.links) {
            setGraphData(data);
            setError(null);
          } else {
            throw new Error('Invalid default graph data');
          }
        }
      } catch (err) {
        console.error('Failed to fetch graph, using local fallback:', err);
        setError('Using offline data');
        setGraphData(knowledgeGraphData);
      } finally {
        setIsLoading(false);
      }
    };

    loadGraphData();
  }, [userPrompt, query, initialGraphData, onTopicResolved]);

  // Handle node click - open boss fight for active nodes
  const handleNodeClick = (node) => {
    setSelectedNode(node);
    const normalizedStatus = normalizeNodeStatus(node);
    if (normalizedStatus === 'active' || normalizedStatus === 'mastered') {
      setCurrentBossNode(node);
      setShowBossFight(true);
    }
  };

  // Handle boss fight completion
  const handleBossFightComplete = async (nodeId, explanation, verificationResult) => {
    try {
      // Find the node data to pass to backend
      const nodeData = graphData.nodes.find(n => n.id === nodeId);
      const verifyResult = verificationResult || await verifyExplanation(nodeId, explanation, null, nodeData);
      if (verifyResult.passed) {
        // If passed, complete the node
        const result = await completeNode(nodeId, verifyResult.bestScore || verifyResult.score);
        
        if (result.success) {
          // Create updated graph data
          let updatedGraph = JSON.parse(JSON.stringify(graphData)); // Deep copy
          
          // Find and update the completed node
          const completedNode = updatedGraph.nodes.find(n => n.id === nodeId);
          if (completedNode) {
            completedNode.status = 'mastered';
            const bestScore = verifyResult.bestScore || verifyResult.score || completedNode.score || 95;
            completedNode.score = bestScore;
          }
          
          // Find all nodes that depend on this completed node (targets of outgoing links)
          const dependentNodeIds = updatedGraph.links
            .filter(link => {
              const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
              return sourceId === nodeId;
            })
            .map(link => typeof link.target === 'object' ? link.target.id : link.target);
          
          // Unlock dependent nodes
          dependentNodeIds.forEach(targetId => {
            const targetNode = updatedGraph.nodes.find(n => n.id === targetId);
            if (targetNode && normalizeNodeStatus(targetNode) === 'locked') {
              targetNode.status = 'active';
            }
          });
          
          // Update state
          setGraphData(updatedGraph);
          setUnlockedNodes(dependentNodeIds);
          
          // Animate edges to unlocked nodes
          const animatingEdgeIds = updatedGraph.links
            .map((link, index) => {
              const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
              const targetId = typeof link.target === 'object' ? link.target.id : link.target;
              
              if (sourceId === nodeId && dependentNodeIds.includes(targetId)) {
                return index;
              }
              return null;
            })
            .filter(id => id !== null);
          
          setAnimatingEdges(animatingEdgeIds);
          
          // Clear animation after 2 seconds
          setTimeout(() => {
            setAnimatingEdges([]);
            setUnlockedNodes([]);
          }, 2000);
          
          setShowBossFight(false);
          setCurrentBossNode(null);
          
          // Show success message
          console.log('OK', result.message);
          if (dependentNodeIds.length > 0) {
            console.log('Unlocked:', dependentNodeIds);
          }

          const previousBest = verifyResult.previousBestScore;
          const currentBest = verifyResult.bestScore || verifyResult.score;
          const deltaPercent = verifyResult.scoreDeltaPercent;
          const deltaDisplay = deltaPercent === null || deltaPercent === undefined
            ? 'N/A (first completion)'
            : `${deltaPercent >= 0 ? '+' : ''}${deltaPercent}% vs previous best`;
          const bestChangeLine = previousBest === null || previousBest === undefined
            ? `Best Score: ${currentBest}/100`
            : `Best Score: ${previousBest}/100 → ${currentBest}/100`;
          setToast({
            type: 'success',
            title: '🏆 Boss Defeated!',
            lines: [
              `Attempt Score: ${verifyResult.score}/100`,
              bestChangeLine,
              `Change: ${deltaDisplay}`
            ]
          });
        }
      } else {
        // Show feedback to user
        console.log('❌ Verification failed:', verifyResult.message);
        setToast({
          type: 'error',
          title: '❌ Not Quite There',
          lines: [
            `Score: ${verifyResult.score}/100`,
            verifyResult.feedback || verifyResult.message
          ]
        });
      }
    } catch (err) {
      console.error('Error completing boss fight:', err);
      setToast({
        type: 'error',
        title: '⚠️ Error',
        lines: ['Failed to verify explanation. Please try again.']
      });
    }
  };

  const handleGraphMouseMove = (event) => {
    const container = graphContainerRef.current;
    if (!container) return;

    const bounds = container.getBoundingClientRect();
    setCursorPoint({
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top
    });
  };

  const handleGraphMouseLeave = () => {
    setCursorPoint(null);
  };

  // Show loading state
  if (isLoading) {
    return <ConstellationLoader />;
  }
  
  // Validate graph data before rendering
  if (!graphData || !graphData.nodes || !Array.isArray(graphData.nodes) || graphData.nodes.length === 0) {
    console.error('❌ Invalid graph data structure:', graphData);
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-2xl mb-4">⚠️ Error loading constellation</p>
          <p className="text-gray-400">Graph data is invalid or empty</p>
          {typeof onBack === 'function' && (
            <button
              onClick={onBack}
              className="mt-6 px-6 py-3 bg-white/20 border border-white/30 rounded-lg hover:bg-white/30"
            >
              Go Back
            </button>
          )}
        </div>
      </div>
    );
  }
  
  console.log('🎨 Rendering constellation with', graphData.nodes.length, 'nodes');
  
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
  const dynamicNodePositions = {};
  const bounds = graphContainerRef.current?.getBoundingClientRect();
  const width = bounds?.width || 0;
  const height = bounds?.height || 0;
  const repelRadiusPx = 220;
  const maxRepelShiftPx = 80;
  const snapZoneWidthPx = 75; // 1.5x wider than previous 12px border band

  graphData.nodes.forEach((node) => {
    const basePos = nodePositions[node.id];
    if (!basePos || !cursorPoint || width <= 0 || height <= 0) {
      dynamicNodePositions[node.id] = basePos;
      return;
    }

    const nodeSize = getNodeStyleByStatus(normalizeNodeStatus(node)).size;
    const nodeRadiusPx = nodeSize * 0.5 + 6;

    const centerX = (basePos.x / 100) * width;
    const centerY = (basePos.y / 100) * height;
    const dx = cursorPoint.x - centerX;
    const dy = cursorPoint.y - centerY;
    const distance = Math.hypot(dx, dy) || 0.0001;

    // Repulsion field (same-charge behavior).
    let repelledX = basePos.x;
    let repelledY = basePos.y;
    if (distance < repelRadiusPx) {
      const force = Math.pow(1 - distance / repelRadiusPx, 2);
      const repelShiftPx = force * maxRepelShiftPx;
      const shiftX = ((-dx / distance) * repelShiftPx / width) * 100;
      const shiftY = ((-dy / distance) * repelShiftPx / height) * 100;
      repelledX = basePos.x + shiftX;
      repelledY = basePos.y + shiftY;
    }

    // Attraction field around/inside node border with smooth transition.
    const transitionOuter = nodeRadiusPx + snapZoneWidthPx;
    const transitionInner = Math.max(1, nodeRadiusPx - snapZoneWidthPx);
    let attractionEase = 0;
    if (distance <= transitionOuter) {
      const rawT = (transitionOuter - distance) / (transitionOuter - transitionInner);
      const clampedT = Math.max(0, Math.min(1, rawT));
      attractionEase = clampedT * clampedT * (3 - 2 * clampedT); // smoothstep
    }

    // Center-anchored stretch toward cursor, capped so node never sits directly on it.
    const maxStretchPx = Math.max(12, nodeRadiusPx * 0.9);
    const stretchDistancePx = Math.min(maxStretchPx, distance * 0.8);
    const stretchXPercent = ((dx / distance) * stretchDistancePx / width) * 100;
    const stretchYPercent = ((dy / distance) * stretchDistancePx / height) * 100;
    const attractedX = basePos.x + stretchXPercent;
    const attractedY = basePos.y + stretchYPercent;

    const finalX = repelledX + (attractedX - repelledX) * attractionEase;
    const finalY = repelledY + (attractedY - repelledY) * attractionEase;

    dynamicNodePositions[node.id] = {
      x: Math.max(4, Math.min(96, finalX)),
      y: Math.max(6, Math.min(94, finalY))
    };
  });
  return (
    <motion.div 
      className="relative w-full h-screen bg-black overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {backgroundStarsEnabled && (
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            '--bg-star-color': constellationStarColor,
            '--bg-star-rgb': constellationStarRgb
          }}
        >
          {constellationBgStars.map((star, idx) => (
            <div
              key={`const-map-star-${star.id}`}
              className="bg-twinkle-star"
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: `${star.size}px`,
                height: `${star.size}px`,
                animation: `star-twinkle-forever ${3.2 + (idx % 6) * 0.5}s ease-in-out infinite`,
                animationDelay: `${(idx * 0.13) % 4.4}s`,
                opacity: 0.42
              }}
            />
          ))}
        </div>
      )}

      {/* Topic Header (if generated from prompt) */}
      {!hideSideHud && generatedTopic && (
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
      {typeof onBack === 'function' && (
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
      )}

      {/* Constellation graph */}
      <motion.div 
        className="absolute inset-0 flex items-center justify-center"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.3 }}
      >
        <div ref={graphContainerRef} onMouseMove={handleGraphMouseMove} onMouseLeave={handleGraphMouseLeave} className="relative w-full h-full">
          {/* Connection lines */}
          <ConstellationLinks 
            links={graphData.links} 
            nodePositions={dynamicNodePositions}
            nodes={graphData.nodes}
            animatingEdges={animatingEdges}
            nodeColor={nodeColor}
          />
          
          {/* Nodes */}
          {graphData.nodes.map((node) => (
            <ConstellationNode
              key={node.id}
              node={node}
              position={dynamicNodePositions[node.id]}
              onClick={handleNodeClick}
              isSelected={selectedNode?.id === node.id}
              isUnlocking={unlockedNodes.includes(node.id)}
              nodeColor={nodeColor}
            />
          ))}
        </div>
      </motion.div>

      {/* Enhanced Legend */}
      {!hideSideHud && (
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
      )}

      {/* Node details panel with AnimatePresence */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, x: 30, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 30, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute z-50 bg-black/80 border border-white/30 rounded-xl p-6 backdrop-blur-md"
            style={{
              top: 'auto',
              left: 'auto',
              right: '96px',
              bottom: '32px',
              maxWidth: 'min(24rem, calc(100vw - 32px))',
              maxHeight: 'calc(100vh - 32px)',
              overflowY: 'auto',
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
                  normalizeNodeStatus(selectedNode) === 'mastered' ? 'bg-white/30 border-white text-white' :
                  normalizeNodeStatus(selectedNode) === 'active' ? 'bg-white/20 border-white/70 text-white/80' :
                  'bg-white/10 border-white/30 text-white/40'
                }`}
                whileHover={{ scale: 1.05 }}
              >
                {normalizeNodeStatus(selectedNode).toUpperCase()}
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
          Warning: {error} - Backend not connected
        </motion.div>
      )}

      {/* Toast notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            style={{
              position: 'fixed', bottom: '32px', left: '50%', transform: 'translateX(-50%)',
              zIndex: 2000, minWidth: '320px', maxWidth: '460px',
              background: toast.type === 'success'
                ? 'linear-gradient(135deg, rgba(0,180,80,0.92), rgba(0,120,60,0.92))'
                : toast.type === 'error'
                  ? 'linear-gradient(135deg, rgba(200,40,40,0.92), rgba(140,20,20,0.92))'
                  : 'linear-gradient(135deg, rgba(60,60,120,0.92), rgba(40,40,80,0.92))',
              border: `1px solid ${toast.type === 'success' ? 'rgba(0,255,136,0.4)' : toast.type === 'error' ? 'rgba(255,100,100,0.4)' : 'rgba(138,43,226,0.4)'}`,
              borderRadius: '14px', padding: '18px 22px',
              boxShadow: '0 12px 40px rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)',
              color: 'white', fontFamily: 'monospace'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>{toast.title}</div>
              <button
                onClick={() => setToast(null)}
                style={{
                  background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white',
                  borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer',
                  fontSize: '14px', lineHeight: '24px', textAlign: 'center', flexShrink: 0
                }}
              >×</button>
            </div>
            {toast.lines && toast.lines.map((line, i) => (
              <div key={i} style={{ fontSize: '13px', opacity: 0.9, marginTop: '4px', lineHeight: 1.4 }}>{line}</div>
            ))}
            {/* auto-dismiss after 5s */}
            <motion.div
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 5, ease: 'linear' }}
              onAnimationComplete={() => setToast(null)}
              style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px',
                background: 'rgba(255,255,255,0.3)', borderRadius: '0 0 14px 14px',
                transformOrigin: 'left'
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}



