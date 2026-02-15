import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { knowledgeGraphData } from '../data/knowledgeGraph';
import { fetchKnowledgeGraph, completeNode, verifyExplanation, generateCustomTree } from '../services/api';
import BossFightModal from './BossFightModal';
import ConstellationLoader from './ConstellationLoader';

const DEFAULT_SCALE = 1.72;
const DEFAULT_TARGET_X = 24;
const DEFAULT_TARGET_Y = 50;
const EDGE_ANIM_MS = 1900;
const DEBUG_CLICK_UNLOCK = true;

const getNodeId = (value) => (typeof value === 'object' ? value.id : value);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const hashString = (value) => {
  let hash = 0;
  const text = String(value || '');
  for (let i = 0; i < text.length; i += 1) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const normalizeNodeStatus = (node) => {
  if (typeof node.status === 'number') {
    if (node.status > 0) return 'mastered';
    if (node.status === 0) return 'active';
    return 'locked';
  }
  return node.status || 'locked';
};

const getNodeBestScore = (node) => {
  if (typeof node.status === 'number' && node.status > 0) {
    return node.status;
  }
  return node.score || null;
};

const parseGraphPayload = (payload) => {
  if (!payload) return null;

  if (payload.graph?.nodes && payload.graph?.links) {
    return { graph: payload.graph, topic: payload.topic || '' };
  }

  if (payload.nodes && payload.links) {
    return { graph: payload, topic: payload.topic || '' };
  }

  if (payload.data?.nodes && payload.data?.links) {
    return { graph: payload.data, topic: payload.topic || '' };
  }

  return null;
};

const buildSidewaysPositions = (nodes) => {
  const byLevel = {};
  nodes.forEach((node) => {
    if (!byLevel[node.level]) byLevel[node.level] = [];
    byLevel[node.level].push(node);
  });

  const levels = Object.keys(byLevel).map(Number).sort((a, b) => a - b);
  if (!levels.length) return {};

  const xStart = 10;
  const xEnd = 90;
  const levelSpan = Math.max(1, levels.length - 1);
  const positions = {};

  levels.forEach((levelValue, levelIndex) => {
    const levelNodes = [...byLevel[levelValue]].sort((a, b) => a.id.localeCompare(b.id));
    const baseX = xStart + (levelIndex / levelSpan) * (xEnd - xStart);
    const count = levelNodes.length;

    levelNodes.forEach((node, idx) => {
      let y;
      if (count === 1) {
        y = 50;
      } else {
        const spread = 72;
        const step = spread / (count - 1);
        y = 14 + (idx * step);
      }

      const nodeHash = hashString(node.id);
      const xHash = hashString(`${node.id}-x`);
      const xJitter = ((xHash % 100) / 100 - 0.5) * 5 + Math.sin((levelIndex + idx + 1) * 1.1) * 1.5;
      const x = clamp(baseX + xJitter, 8, 92);
      const jitter = ((nodeHash % 100) / 100 - 0.5) * 6;
      const wave = Math.sin((levelIndex + idx + 1) * 1.33) * 2.2;
      y = clamp(y + jitter + wave, 8, 92);

      positions[node.id] = { x, y };
    });
  });

  return positions;
};

const buildEdgePath = (sourcePos, targetPos, edgeKey) => {
  return {
    d: `M ${sourcePos.x} ${sourcePos.y} L ${targetPos.x} ${targetPos.y}`,
    points: [sourcePos, targetPos],
  };
};

function ConstellationNode({ node, position, onClick, isUnlocking = false }) {
  const normalizedStatus = normalizeNodeStatus(node);
  const isMastered = normalizedStatus === 'mastered';
  const isActive = normalizedStatus === 'active';

  const size = isMastered ? 52 : isActive ? 46 : 36;
  const opacity = isMastered ? 1 : isActive ? 0.86 : 0.32;
  const glow = isMastered ? '0 0 26px rgba(255,255,255,0.95)' : isActive ? '0 0 18px rgba(255,255,255,0.65)' : '0 0 10px rgba(255,255,255,0.25)';

  return (
    <motion.div
      className="absolute cursor-pointer group"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
      }}
      initial={{ scale: 0, opacity: 0, x: '-50%', y: '-50%' }}
      animate={isUnlocking
        ? { scale: [1, 1.25, 1], opacity: 1, x: '-50%', y: '-50%' }
        : { scale: 1, opacity: 1, x: '-50%', y: '-50%' }
      }
      transition={isUnlocking ? { duration: 1.15, ease: 'easeOut' } : { duration: 0.9, type: 'spring', stiffness: 120 }}
      whileHover={{ scale: 1.18, x: '-50%', y: '-50%', transition: { duration: 0.25 } }}
      onClick={() => onClick(node)}
    >
      <motion.div
        style={{ width: `${size}px`, height: `${size}px`, position: 'relative' }}
        animate={isMastered || isActive ? { rotate: [0, 360] } : {}}
        transition={{ rotate: { duration: isMastered ? 22 : 30, repeat: Infinity, ease: 'linear' } }}
      >
        <svg width={size} height={size} viewBox="0 0 100 100" style={{ filter: `drop-shadow(${glow})` }}>
          <motion.line
            x1="50"
            y1="10"
            x2="50"
            y2="90"
            stroke="#ffffff"
            strokeWidth="3"
            strokeLinecap="round"
            animate={{ opacity: [opacity * 0.6, opacity, opacity * 0.6] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.line
            x1="10"
            y1="50"
            x2="90"
            y2="50"
            stroke="#ffffff"
            strokeWidth="3"
            strokeLinecap="round"
            animate={{ opacity: [opacity * 0.6, opacity, opacity * 0.6] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: 0.45 }}
          />
          <motion.circle
            cx="50"
            cy="50"
            r={isMastered ? 9 : isActive ? 8 : 6}
            fill="#ffffff"
            animate={{ opacity: [opacity * 0.8, opacity, opacity * 0.8], scale: [1, 1.12, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </svg>
      </motion.div>

      <motion.div
        className="absolute whitespace-nowrap font-mono text-sm font-medium"
        style={{
          left: `${size + 12}px`,
          top: '50%',
          transform: 'translateY(-50%)',
          color: '#ffffff',
          textShadow: `0 0 ${12 * opacity}px rgba(255, 255, 255, ${opacity * 0.75}), 0 2px 4px rgba(0,0,0,0.5)`,
          pointerEvents: 'none',
        }}
        initial={{ opacity: 0, x: -14 }}
        animate={{ opacity, x: 0 }}
        transition={{ duration: 0.7 }}
      >
        {node.label.replace('\n', ' ')}
      </motion.div>

      <motion.div
        className="absolute whitespace-nowrap font-mono text-xs"
        style={{
          left: `${size + 12}px`,
          top: 'calc(50% + 18px)',
          color: isMastered ? '#93c5fd' : isActive ? '#d9f99d' : '#9ca3af',
          opacity: opacity * 0.85,
          pointerEvents: 'none',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: opacity * 0.85 }}
        transition={{ duration: 0.7, delay: 0.1 }}
      >
        {isMastered ? `Best Score: ${getNodeBestScore(node) || 95}%` : isActive ? 'Ready to challenge' : 'Locked'}
      </motion.div>
    </motion.div>
  );
}

function ConstellationLinks({ links, nodePositions, animatingEdgeKeys = [] }) {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
      <defs>
        <filter id="unlock-travel-glow">
          <feGaussianBlur stdDeviation="0.8" result="blurred" />
          <feMerge>
            <feMergeNode in="blurred" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {links.map((link, index) => {
        const sourceId = getNodeId(link.source);
        const targetId = getNodeId(link.target);
        const sourcePos = nodePositions[sourceId];
        const targetPos = nodePositions[targetId];
        if (!sourcePos || !targetPos || sourceId === targetId) return null;

        const edgeKey = `${sourceId}->${targetId}`;
        const geometry = buildEdgePath(sourcePos, targetPos, edgeKey);
        const isAnimating = animatingEdgeKeys.includes(edgeKey);

        const baseOpacity = 0.16;
        const baseWidth = 0.32;

        return (
          <g key={edgeKey}>
            <motion.path
              d={geometry.d}
              fill="none"
              stroke="#ffffff"
              strokeWidth={baseWidth}
              strokeLinecap="round"
              initial={{ opacity: 0 }}
              animate={{ opacity: baseOpacity }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
            />

            {isAnimating && (
              <>
                <motion.path
                  d={geometry.d}
                  fill="none"
                  stroke="#93c5fd"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  filter="url(#unlock-travel-glow)"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.95, 0.3] }}
                  transition={{ duration: EDGE_ANIM_MS / 1000, ease: 'easeOut' }}
                />

                <motion.circle
                  r="0.95"
                  fill="#dbeafe"
                  filter="url(#unlock-travel-glow)"
                  initial={{ cx: geometry.points[0].x, cy: geometry.points[0].y, opacity: 0 }}
                  animate={{
                    cx: geometry.points.map((point) => point.x),
                    cy: geometry.points.map((point) => point.y),
                    opacity: [0, 1, 1, 0],
                  }}
                  transition={{
                    duration: EDGE_ANIM_MS / 1000,
                    times: [0, 0.1, 0.9, 1],
                    ease: 'easeInOut',
                  }}
                />

                <motion.circle
                  cx={targetPos.x}
                  cy={targetPos.y}
                  r="1.1"
                  fill="#ffffff"
                  filter="url(#unlock-travel-glow)"
                  initial={{ opacity: 0, scale: 0.2 }}
                  animate={{ opacity: [0, 1, 0], scale: [0.2, 2.2, 0.2] }}
                  transition={{
                    duration: 0.55,
                    delay: (EDGE_ANIM_MS / 1000) - 0.45,
                    ease: 'easeOut',
                  }}
                />
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export default function ConstellationView({
  onBack,
  userPrompt,
  query,
  graphData: externalGraphData,
  hideSideHud = false,
  onTopicResolved,
}) {
  const [selectedNode, setSelectedNode] = useState(null);
  const [graphData, setGraphData] = useState(knowledgeGraphData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBossFight, setShowBossFight] = useState(false);
  const [currentBossNode, setCurrentBossNode] = useState(null);
  const [generatedTopic, setGeneratedTopic] = useState('');
  const [unlockedNodes, setUnlockedNodes] = useState([]);
  const [animatingEdgeKeys, setAnimatingEdgeKeys] = useState([]);
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const dragRef = useRef({
    dragging: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
  });
  const viewportRef = useRef(null);
  const defaultViewInitializedRef = useRef(false);
  const seenUnlockEdgesRef = useRef(new Set());

  const promptText = query || userPrompt || '';

  useEffect(() => {
    let cancelled = false;

    const incoming = parseGraphPayload(externalGraphData);
    if (incoming) {
      setGraphData(incoming.graph);
      setGeneratedTopic(incoming.topic || promptText || '');
      setError(null);
      setIsLoading(false);
      return undefined;
    }

    const loadGraphData = async () => {
      try {
        setIsLoading(true);

        if (promptText.trim()) {
          const generated = await generateCustomTree(promptText);
          const parsed = parseGraphPayload(generated);
          if (!parsed) {
            throw new Error('Generated tree payload did not contain graph data.');
          }
          if (!cancelled) {
            setGraphData(parsed.graph);
            setGeneratedTopic(parsed.topic || promptText);
            setError(null);
          }
        } else {
          const fetched = await fetchKnowledgeGraph();
          const parsed = parseGraphPayload(fetched);
          if (!parsed) {
            throw new Error('Fetched graph payload did not contain graph data.');
          }
          if (!cancelled) {
            setGraphData(parsed.graph);
            setError(null);
          }
        }
      } catch (err) {
        console.error('Failed to load graph data, using local fallback:', err);
        if (!cancelled) {
          setGraphData(knowledgeGraphData);
          setError('Using offline data');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadGraphData();

    return () => {
      cancelled = true;
    };
  }, [externalGraphData, promptText]);

  useEffect(() => {
    if (!onTopicResolved) return;
    onTopicResolved(generatedTopic || promptText || '');
  }, [generatedTopic, promptText, onTopicResolved]);

  const nodePositions = useMemo(
    () => buildSidewaysPositions(graphData.nodes || []),
    [graphData],
  );

  const startNode = useMemo(() => {
    if (!graphData.nodes?.length) return null;
    const sortedByLevel = [...graphData.nodes].sort((a, b) => a.level - b.level);
    return sortedByLevel[0];
  }, [graphData]);

  useEffect(() => {
    defaultViewInitializedRef.current = false;
  }, [graphData]);

  useEffect(() => {
    if (!startNode || !nodePositions[startNode.id] || defaultViewInitializedRef.current) return;

    const rootPos = nodePositions[startNode.id];
    const defaultOffsetX = DEFAULT_TARGET_X - (((rootPos.x - 50) * DEFAULT_SCALE) + 50);
    const defaultOffsetY = DEFAULT_TARGET_Y - (((rootPos.y - 50) * DEFAULT_SCALE) + 50);
    setViewOffset({ x: defaultOffsetX, y: defaultOffsetY });
    defaultViewInitializedRef.current = true;
  }, [startNode, nodePositions]);

  const handlePointerDown = (event) => {
    if (!viewportRef.current) return;
    dragRef.current = {
      dragging: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: viewOffset.x,
      originY: viewOffset.y,
    };
    viewportRef.current.setPointerCapture(event.pointerId);
    setIsDragging(true);
  };

  const handlePointerMove = (event) => {
    if (!dragRef.current.dragging || !viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const dx = ((event.clientX - dragRef.current.startX) / rect.width) * 100;
    const dy = ((event.clientY - dragRef.current.startY) / rect.height) * 100;
    setViewOffset({
      x: dragRef.current.originX + dx,
      y: dragRef.current.originY + dy,
    });
  };

  const endDrag = (event) => {
    if (!dragRef.current.dragging || !viewportRef.current) return;
    try {
      viewportRef.current.releasePointerCapture(dragRef.current.pointerId);
    } catch (_error) {
      // No-op if capture was already released.
    }
    dragRef.current.dragging = false;
    setIsDragging(false);
  };

  const applyUnlockFromNode = (nodeId, { markMastered = false } = {}) => {
    const updatedGraph = JSON.parse(JSON.stringify(graphData));
    const sourceNode = updatedGraph.nodes.find((node) => node.id === nodeId);
    if (!sourceNode) return;

    if (markMastered && normalizeNodeStatus(sourceNode) !== 'mastered') {
      sourceNode.status = 'mastered';
      sourceNode.score = sourceNode.score || 95;
    }

    const newlyUnlockedNodeIds = [];
    updatedGraph.links.forEach((link) => {
      const sourceId = getNodeId(link.source);
      const targetId = getNodeId(link.target);
      if (sourceId !== nodeId || sourceId === targetId) return;

      const targetNode = updatedGraph.nodes.find((node) => node.id === targetId);
      if (targetNode && normalizeNodeStatus(targetNode) === 'locked') {
        targetNode.status = 'active';
        newlyUnlockedNodeIds.push(targetId);
      }
    });

    const edgeKeysToAnimate = [];
    updatedGraph.links.forEach((link) => {
      const sourceId = getNodeId(link.source);
      const targetId = getNodeId(link.target);
      if (sourceId !== nodeId || !newlyUnlockedNodeIds.includes(targetId) || sourceId === targetId) return;

      const edgeKey = `${sourceId}->${targetId}`;
      if (!seenUnlockEdgesRef.current.has(edgeKey)) {
        seenUnlockEdgesRef.current.add(edgeKey);
        edgeKeysToAnimate.push(edgeKey);
      }
    });

    setGraphData(updatedGraph);
    setUnlockedNodes(newlyUnlockedNodeIds);
    setAnimatingEdgeKeys(edgeKeysToAnimate);

    setTimeout(() => {
      setAnimatingEdgeKeys([]);
      setUnlockedNodes([]);
    }, EDGE_ANIM_MS + 350);
  };

  const handleNodeClick = (node) => {
    setSelectedNode(node);
    const status = normalizeNodeStatus(node);

    if (DEBUG_CLICK_UNLOCK && (status === 'active' || status === 'mastered')) {
      applyUnlockFromNode(node.id, { markMastered: true });
      return;
    }

    if (status === 'active' || status === 'mastered') {
      setCurrentBossNode(node);
      setShowBossFight(true);
    }
  };

  const handleBossFightComplete = async (nodeId, explanation, verificationResult) => {
    try {
      const verifyResult = verificationResult || await verifyExplanation(nodeId, explanation);

      if (!verifyResult.passed) {
        alert(`${verifyResult.message}\n\nScore: ${verifyResult.score}/100\n\nFeedback: ${verifyResult.feedback}`);
        return;
      }

      const completion = await completeNode(nodeId, verifyResult.bestScore || verifyResult.score);
      if (!completion.success) return;

      const updatedGraph = JSON.parse(JSON.stringify(graphData));
      const completedNode = updatedGraph.nodes.find((node) => node.id === nodeId);
      if (completedNode) {
        completedNode.status = 'mastered';
        completedNode.score = verifyResult.bestScore || verifyResult.score || completedNode.score || 95;
      }

      const newlyUnlockedNodeIds = [];
      updatedGraph.links.forEach((link) => {
        const sourceId = getNodeId(link.source);
        const targetId = getNodeId(link.target);
        if (sourceId !== nodeId) return;

        const targetNode = updatedGraph.nodes.find((node) => node.id === targetId);
        if (targetNode && normalizeNodeStatus(targetNode) === 'locked') {
          targetNode.status = 'active';
          newlyUnlockedNodeIds.push(targetId);
        }
      });

      const edgeKeysToAnimate = [];
      updatedGraph.links.forEach((link) => {
        const sourceId = getNodeId(link.source);
        const targetId = getNodeId(link.target);
        if (sourceId !== nodeId || !newlyUnlockedNodeIds.includes(targetId)) return;

        const edgeKey = `${sourceId}->${targetId}`;
        if (!seenUnlockEdgesRef.current.has(edgeKey)) {
          seenUnlockEdgesRef.current.add(edgeKey);
          edgeKeysToAnimate.push(edgeKey);
        }
      });

      setGraphData(updatedGraph);
      setUnlockedNodes(newlyUnlockedNodeIds);
      setAnimatingEdgeKeys(edgeKeysToAnimate);

      setTimeout(() => {
        setAnimatingEdgeKeys([]);
        setUnlockedNodes([]);
      }, EDGE_ANIM_MS + 350);

      setShowBossFight(false);
      setCurrentBossNode(null);

      const previousBest = verifyResult.previousBestScore;
      const currentBest = verifyResult.bestScore || verifyResult.score;
      const deltaPercent = verifyResult.scoreDeltaPercent;
      const deltaText = deltaPercent === null || deltaPercent === undefined
        ? 'N/A (first completion)'
        : `${deltaPercent >= 0 ? '+' : ''}${deltaPercent}% vs previous best`;
      const bestChange = previousBest === null || previousBest === undefined
        ? `Best Score: ${currentBest}/100`
        : `Best Score: ${previousBest}/100 -> ${currentBest}/100`;

      alert(`Practice result:\nAttempt Score: ${verifyResult.score}/100\n${bestChange}\nChange: ${deltaText}`);
    } catch (error) {
      console.error('Error completing node:', error);
      alert('Failed to verify explanation. Please try again.');
    }
  };

  if (isLoading) {
    return <ConstellationLoader />;
  }

  return (
    <motion.div
      className="relative w-full h-screen bg-black overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {!hideSideHud && generatedTopic && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.7 }}
          className="absolute top-6 left-6 z-50 bg-black/60 border border-white/30 rounded-lg px-6 py-3 backdrop-blur-sm"
        >
          <div className="text-sm text-gray-400 font-mono">Learning Path:</div>
          <div className="text-xl text-white font-bold font-mono mt-1" style={{ textShadow: '0 0 15px rgba(255, 255, 255, 0.5)' }}>
            {generatedTopic.toUpperCase()}
          </div>
        </motion.div>
      )}

      {onBack && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(255, 255, 255, 0.4)' }}
          transition={{ type: 'spring', stiffness: 280 }}
          onClick={onBack}
          className="absolute top-6 right-6 z-50 px-6 py-3 bg-black/60 border border-white/30 rounded-lg font-mono text-white hover:bg-white/10 transition-all backdrop-blur-sm"
          style={{ boxShadow: '0 0 20px rgba(255, 255, 255, 0.2)' }}
        >
          Back
        </motion.button>
      )}

      <div
        ref={viewportRef}
        className={`absolute inset-0 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        style={{ touchAction: 'none' }}
      >
        <motion.div
          className="absolute inset-0"
          style={{
            transform: `translate(${viewOffset.x}%, ${viewOffset.y}%) scale(${DEFAULT_SCALE})`,
            transformOrigin: '50% 50%',
          }}
          initial={{ opacity: 0.2 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <ConstellationLinks
            links={graphData.links || []}
            nodePositions={nodePositions}
            animatingEdgeKeys={animatingEdgeKeys}
          />

          {(graphData.nodes || []).map((node) => (
            <ConstellationNode
              key={node.id}
              node={node}
              position={nodePositions[node.id]}
              onClick={handleNodeClick}
              isUnlocking={unlockedNodes.includes(node.id)}
            />
          ))}
        </motion.div>
      </div>

      {!hideSideHud && (
        <motion.div
          initial={{ opacity: 0, x: -25 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8, duration: 0.7 }}
          className="absolute bottom-8 left-8 z-50 bg-black/80 border border-white/20 rounded-xl p-5 backdrop-blur-md"
          style={{ fontFamily: 'monospace', boxShadow: '0 0 30px rgba(0, 0, 0, 0.5)' }}
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
                transition={{ duration: 2, repeat: Infinity, delay: 0.25 }}
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

      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, x: 30, scale: 0.92 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 30, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            className="absolute bottom-8 right-8 z-50 bg-black/80 border border-white/30 rounded-xl p-6 max-w-sm backdrop-blur-md"
            style={{ fontFamily: 'monospace', boxShadow: '0 0 40px rgba(255, 255, 255, 0.2)' }}
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
                whileHover={{ scale: 1.04, backgroundColor: 'rgba(255,255,255,0.15)' }}
              >
                Level {selectedNode.level}
              </motion.span>
              <motion.span
                className={`px-3 py-1 rounded text-xs font-semibold border ${normalizeNodeStatus(selectedNode) === 'mastered'
                  ? 'bg-white/30 border-white text-white'
                  : normalizeNodeStatus(selectedNode) === 'active'
                    ? 'bg-white/20 border-white/70 text-white/80'
                    : 'bg-white/10 border-white/30 text-white/40'
                  }`}
                whileHover={{ scale: 1.04 }}
              >
                {normalizeNodeStatus(selectedNode).toUpperCase()}
              </motion.span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-yellow-500/20 border border-yellow-500/50 rounded-lg px-4 py-2 text-yellow-200 text-sm font-mono backdrop-blur-sm"
        >
          {error} - Backend not connected
        </motion.div>
      )}
    </motion.div>
  );
}
