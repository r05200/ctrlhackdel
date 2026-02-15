import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { generateCustomTree } from '../services/api';

const DIRECTIONS = ['left', 'right', 'up', 'down'];
const FOUND_ZOOM_MS = 2200;
const FOUND_PAUSE_MS = 1000;
const FOUND_PAN_DISTANCE = 0;
const DIRECT_PAN_UP_MS = 2000;
const DIRECT_ZOOM_LENS_MS = 1600;
const DIRECT_SEARCH_DURATION_MS = 3500;
const DIRECT_FOUND_DELAY_MS = 300;
const DEFAULT_SKY_TRANSITION_EASE = 'cubic-bezier(0.7, 0, 0.12, 1)';
const DIRECT_SKY_TRANSITION_EASE = 'cubic-bezier(0.84, 0, 0.78, 1)';

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function getNodeId(value) {
  return typeof value === 'object' ? value.id : value;
}

function parseGraphPayload(payload) {
  if (!payload) return null;
  if (payload.graph?.nodes && payload.graph?.links) return payload.graph;
  if (payload.nodes && payload.links) return payload;
  if (payload.data?.nodes && payload.data?.links) return payload.data;
  return null;
}

function mapMainCoordToLens(value) {
  return (value + 50) / 2;
}

function buildConstellationPreview(payload) {
  const graph = parseGraphPayload(payload);
  if (!graph?.nodes?.length) return null;

  // Use the same diagonal layout algorithm as ConstellationView
  const nodesByLevel = {};
  graph.nodes.forEach((node) => {
    const level = node.level ?? 0;
    if (!nodesByLevel[level]) nodesByLevel[level] = [];
    nodesByLevel[level].push(node);
  });

  const levelValues = Object.keys(nodesByLevel).map(Number).sort((a, b) => a - b);
  const minLevel = Math.min(...levelValues);
  const maxLevel = Math.max(...levelValues);
  const levelRange = Math.max(1, maxLevel - minLevel);

  // Diagonal lane: top-left to bottom-right, matching ConstellationView
  const laneStart = { x: 24, y: 18 };
  const laneEnd = { x: 76, y: 82 };
  const siblingPerpX = -0.85;
  const siblingPerpY = 0.85;

  const placedNodes = [];
  levelValues.forEach((levelNum) => {
    const nodes = nodesByLevel[levelNum] || [];
    const count = nodes.length;
    const t = (levelNum - minLevel) / levelRange;
    const baseX = laneStart.x + (laneEnd.x - laneStart.x) * t;
    const baseY = laneStart.y + (laneEnd.y - laneStart.y) * t;

    if (count === 1) {
      placedNodes.push({
        id: getNodeId(nodes[0].id ?? nodes[0].name ?? placedNodes.length),
        x: baseX,
        y: baseY,
        size: 2.2,
      });
      return;
    }

    const spread = Math.min(18, 9 + count * 1.6);
    nodes.forEach((node, idx) => {
      const centeredIndex = idx - (count - 1) / 2;
      const offset = (centeredIndex / Math.max(1, count - 1)) * spread;
      placedNodes.push({
        id: getNodeId(node.id ?? node.name ?? placedNodes.length),
        x: baseX + siblingPerpX * offset,
        y: baseY + siblingPerpY * offset,
        size: idx === 0 ? 2.2 : 1.6,
      });
    });
  });

  const nodeById = new Map(placedNodes.map((n) => [n.id, n]));
  const links = (graph.links || []).map((link, index) => {
    const sourceId = getNodeId(link?.source);
    const targetId = getNodeId(link?.target);
    const source = nodeById.get(sourceId);
    const target = nodeById.get(targetId);
    if (!source || !target) return null;
    return {
      id: `${sourceId}-${targetId}-${index}`,
      x1: source.x,
      y1: source.y,
      x2: target.x,
      y2: target.y,
    };
  }).filter(Boolean);

  return { nodes: placedNodes, links };
}

// SVG path for a 4-pointed gemini star centered at (0,0) with radius 1
function geminiStarPath(cx, cy, size) {
  const s = size;
  const inner = s * 0.28;
  return [
    `M${cx},${cy - s}`,
    `L${cx + inner},${cy - inner}`,
    `L${cx + s},${cy}`,
    `L${cx + inner},${cy + inner}`,
    `L${cx},${cy + s}`,
    `L${cx - inner},${cy + inner}`,
    `L${cx - s},${cy}`,
    `L${cx - inner},${cy - inner}`,
    'Z',
  ].join(' ');
}

function generateNebulas(count) {
  const colors = [
    'rgba(100, 60, 180, 0.12)',
    'rgba(40, 80, 200, 0.10)',
    'rgba(180, 50, 120, 0.08)',
    'rgba(30, 120, 180, 0.09)',
    'rgba(140, 40, 160, 0.10)',
    'rgba(60, 40, 140, 0.11)',
  ];
  const nebulas = [];
  const nearViewportCount = Math.max(2, Math.floor(count / 2));

  for (let i = 0; i < nearViewportCount; i += 1) {
    nebulas.push({
      id: i,
      x: randomBetween(26, 72),
      y: randomBetween(24, 70),
      width: randomBetween(160, 320),
      height: randomBetween(120, 260),
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: randomBetween(0, 360),
      blur: randomBetween(42, 74),
      pulseDuration: randomBetween(8, 15),
      delay: randomBetween(0, 5),
    });
  }

  for (let i = nearViewportCount; i < count; i += 1) {
    nebulas.push({
      id: i,
      x: randomBetween(-30, 130),
      y: randomBetween(-30, 130),
      width: randomBetween(120, 370),
      height: randomBetween(80, 260),
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: randomBetween(0, 360),
      blur: randomBetween(40, 90),
      pulseDuration: randomBetween(8, 16),
      delay: randomBetween(0, 5),
    });
  }

  return nebulas;
}

function TelescopeView({ query, onComplete, initialStarField, presetTree = null }) {
  const isDirectOpen = Boolean(presetTree);
  const [phase, setPhase] = useState('pan-up');
  const [lensStars] = useState(() => {
    if (initialStarField?.stars?.length) {
      return initialStarField.stars.map((star) => ({
        id: star.id,
        x: mapMainCoordToLens(star.x),
        y: mapMainCoordToLens(star.y),
        size: Math.max(1, star.size),
        pulseDuration: Math.max(2.4, star.pulseDuration || 3),
        delay: star.pulseDelay || 0,
      }));
    }

    const stars = [];
    for (let i = 0; i < 200; i += 1) {
      stars.push({
        id: i,
        x: Math.random() * 200 - 50,
        y: Math.random() * 200 - 50,
        size: Math.random() * 2.5 + 1.2,
        pulseDuration: 3 + Math.random() * 3,
        delay: Math.random() * 4,
      });
    }
    return stars;
  });
  const [geminiStars] = useState(() => {
    if (initialStarField?.gemini?.length) {
      return initialStarField.gemini.map((star) => ({
        id: star.id,
        x: mapMainCoordToLens(star.x),
        y: mapMainCoordToLens(star.y),
        size: star.size,
        rotation: star.rotation,
        pulseDuration: Math.max(3.5, star.pulseDuration || 4),
        delay: star.pulseDelay || 0,
        opacity: star.opacity,
      }));
    }

    const stars = [];
    const nearViewportCount = 8;
    for (let i = 0; i < nearViewportCount; i += 1) {
      stars.push({
        id: i,
        x: randomBetween(34, 70),
        y: randomBetween(30, 68),
        size: randomBetween(18, 34),
        rotation: randomBetween(-18, 18),
        pulseDuration: randomBetween(3.5, 6.5),
        delay: randomBetween(0, 5),
        opacity: randomBetween(0.45, 0.85),
      });
    }
    for (let i = nearViewportCount; i < 12; i += 1) {
      stars.push({
        id: i,
        x: randomBetween(-35, 135),
        y: randomBetween(-35, 135),
        size: randomBetween(14, 30),
        rotation: randomBetween(-25, 25),
        pulseDuration: randomBetween(4, 8),
        delay: randomBetween(0, 6),
        opacity: randomBetween(0.25, 0.65),
      });
    }
    return stars;
  });
  const [nebulas] = useState(() => generateNebulas(6));
  const [searching, setSearching] = useState(false);
  const [found, setFound] = useState(false);
  const [skyOffset, setSkyOffset] = useState({ x: 0, y: 0 });
  const [panDir, setPanDir] = useState(null);
  const [panSpeed, setPanSpeed] = useState(null);
  const [transitionMs, setTransitionMs] = useState(0);
  const [transitionEase, setTransitionEase] = useState(DEFAULT_SKY_TRANSITION_EASE);
  const [streakPhase, setStreakPhase] = useState(null);
  const [constellationZoom, setConstellationZoom] = useState(false);
  const [constellationPaused, setConstellationPaused] = useState(false);
  const [generatedTree, setGeneratedTree] = useState(() => presetTree || null);
  const previewConstellation = useMemo(() => buildConstellationPreview(generatedTree), [generatedTree]);

  const timersRef = useRef([]);
  const searchLoopRef = useRef(true);
  const completionQueuedRef = useRef(false);
  const generatedTreeRef = useRef(null);

  useEffect(() => {
    generatedTreeRef.current = generatedTree;
  }, [generatedTree]);

  useEffect(() => {
    if (!presetTree) return;
    generatedTreeRef.current = presetTree;
    setGeneratedTree(presetTree);
  }, [presetTree]);

  const ensureTreeData = useCallback(async () => {
    if (presetTree) {
      generatedTreeRef.current = presetTree;
      return presetTree;
    }
    let tree = generatedTreeRef.current;
    if (!tree && query) {
      tree = await generateCustomTree(query);
      generatedTreeRef.current = tree;
      setGeneratedTree(tree);
    }
    return tree;
  }, [query, presetTree]);

  useEffect(() => {
    let cancelled = false;
    if (!query || isDirectOpen) return undefined;

    const preloadTree = async () => {
      try {
        const result = await generateCustomTree(query);
        if (cancelled) return;
        setGeneratedTree(result);
      } catch (error) {
        console.error('Preload tree generation failed:', error);
      }
    };

    preloadTree();
    return () => { cancelled = true; };
  }, [query, isDirectOpen]);

  const startSearchPan = useCallback(() => {
    const dir = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
    const dur = 2500 + Math.floor(Math.random() * 2500);
    const dist = 6 + Math.floor(Math.random() * 7);

    const accelEnd = dur * 0.275;
    const cruiseEnd = dur * 0.65;

    setPanDir(dir);
    setPanSpeed(dur);
    setTransitionMs(dur);
    setStreakPhase('accel');

    const tCruise = setTimeout(() => setStreakPhase('cruise'), accelEnd);
    const tDecel = setTimeout(() => setStreakPhase('decel'), cruiseEnd);

    setSkyOffset((prev) => {
      let newX = prev.x;
      let newY = prev.y;
      switch (dir) {
        case 'left': newX = prev.x + dist; break;
        case 'right': newX = prev.x - dist; break;
        case 'up': newY = prev.y + dist; break;
        case 'down': newY = prev.y - dist; break;
        default: break;
      }
      const MAX_OFFSET = 40;
      newX = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, newX));
      newY = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, newY));
      return { x: newX, y: newY };
    });

    const tEnd = setTimeout(() => {
      setPanDir(null);
      setPanSpeed(null);
      setStreakPhase(null);
    }, dur);

    const tNext = setTimeout(() => {
      if (searchLoopRef.current) {
        startSearchPan();
      }
    }, dur + 4000);

    timersRef.current.push(tCruise, tDecel, tEnd, tNext);
  }, []);

  // When found, trigger completion after pause + zoom
  useEffect(() => {
    if (!found) return undefined;
    if (completionQueuedRef.current) return undefined;
    completionQueuedRef.current = true;

    let cancelled = false;

    const completeSearch = async () => {
      try {
        const tree = await ensureTreeData();
        if (cancelled) return;
        if (onComplete) {
          // Wait for pause + zoom to complete before calling onComplete
          setTimeout(() => {
            if (!cancelled) onComplete(tree);
          }, FOUND_PAUSE_MS + FOUND_ZOOM_MS + 120);
        }
      } catch (error) {
        console.error('Error generating tree:', error);
        if (onComplete) onComplete(null);
      }
    };

    completeSearch();
    return () => { cancelled = true; };
  }, [found, onComplete, ensureTreeData]);

  useEffect(() => {
    if (!found) completionQueuedRef.current = false;
  }, [found]);

  // When found: show constellation paused, then zoom after delay
  useEffect(() => {
    if (!found) {
      setConstellationZoom(false);
      setConstellationPaused(false);
      return undefined;
    }
    // Immediately show constellation in paused state
    setConstellationPaused(true);
    // After the pause, start the zoom
    const zoomTimer = setTimeout(() => {
      setConstellationZoom(true);
    }, FOUND_PAUSE_MS);
    return () => clearTimeout(zoomTimer);
  }, [found]);

  // Main timeline
  useEffect(() => {
    let cancelled = false;

    if (isDirectOpen) {
      searchLoopRef.current = false;
      setSearching(false);
      setFound(false);
      setPanDir(null);
      setPanSpeed(null);
      setStreakPhase(null);
      setTransitionMs(0);
      setTransitionEase(DEFAULT_SKY_TRANSITION_EASE);
      setSkyOffset({ x: 0, y: 0 });

      // Phase 1: after pan-up, zoom into telescope lens
      const tZoom = setTimeout(() => {
        if (cancelled) return;
        setPhase('zoom-lens');
      }, DIRECT_PAN_UP_MS);
      timersRef.current.push(tZoom);

      // Phase 2: after zoom, start search-style panning (background only)
      const tStartSearch = setTimeout(() => {
        if (cancelled) return;
        setSearching(true);
        searchLoopRef.current = true;
        startSearchPan();
      }, DIRECT_PAN_UP_MS + DIRECT_ZOOM_LENS_MS);
      timersRef.current.push(tStartSearch);

      // Phase 3: stop searching and trigger found (centered)
      const tStopSearch = setTimeout(() => {
        if (cancelled) return;
        searchLoopRef.current = false;
        timersRef.current.forEach(clearTimeout);
        timersRef.current = [];

        setPanDir(null);
        setPanSpeed(null);
        setStreakPhase(null);

        // Smoothly pan sky back to center for constellation
        setTransitionMs(2000);
        setTransitionEase(DEFAULT_SKY_TRANSITION_EASE);
        setSkyOffset({ x: 0, y: 0 });

        const tFound = setTimeout(() => {
          if (cancelled) return;
          setSearching(false);
          setFound(true);
          setPhase('found');
        }, DIRECT_FOUND_DELAY_MS);
        timersRef.current.push(tFound);
      }, DIRECT_PAN_UP_MS + DIRECT_ZOOM_LENS_MS + DIRECT_SEARCH_DURATION_MS);
      timersRef.current.push(tStartSearch, tStopSearch);

      return () => {
        cancelled = true;
        timersRef.current.forEach(clearTimeout);
        timersRef.current = [];
      };
    }

    const t1 = setTimeout(() => setPhase('zoom-lens'), 2000);
    const t2 = setTimeout(() => {
      startSearchPan();
      setSearching(true);
    }, 2200);

    const t3 = setTimeout(() => {
      searchLoopRef.current = false;
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];

      setPanDir(null);
      setPanSpeed(null);
      setStreakPhase(null);

      setTransitionMs(3000);
      setTransitionEase(DEFAULT_SKY_TRANSITION_EASE);
      setSkyOffset({ x: FOUND_PAN_DISTANCE, y: -FOUND_PAN_DISTANCE });

      const tFound = setTimeout(() => {
        const triggerFoundPhase = async () => {
          try {
            await ensureTreeData();
          } catch (error) {
            console.error('Failed to prepare tree data:', error);
          } finally {
            if (!cancelled) {
              setSearching(false);
              setFound(true);
              setPhase('found');
            }
          }
        };
        triggerFoundPhase();
      }, 1500);
      timersRef.current.push(tFound);
    }, 17500);

    return () => {
      cancelled = true;
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [startSearchPan, ensureTreeData, isDirectOpen]);

  const streakClass = panDir ? `streaking-${panDir}` : '';
  const phaseClass = streakPhase ? `streak-${streakPhase}` : '';
  const speedClass = panSpeed && panSpeed <= 2750 ? 'streak-fast' : panSpeed ? 'streak-slow' : '';
  const needsZoomLens = phase === 'found' || phase === 'zoom-lens';
  const sceneClass = `${phase}${isDirectOpen ? ' direct-open' : ''}${needsZoomLens ? ' zoom-lens' : ''}${phase === 'zoom-lens' && !searching ? ' pre-search' : ''}${(searching || found) ? ' search-active' : ''}`;

  return (
    <div className="telescope-overlay">
      <div className={`telescope-scene-wrap ${sceneClass}`}>
        <div
          className={`telescope-sky-bg ${streakClass} ${speedClass} ${phaseClass}`}
          style={{
            transform: `translate(${skyOffset.x}%, ${skyOffset.y}%)`,
            transition: transitionMs > 0 ? `transform ${transitionMs}ms ${transitionEase}` : 'none',
          }}
        >
          {nebulas.map((nebula) => (
            <div
              key={`neb-${nebula.id}`}
              className="telescope-nebula"
              style={{
                left: `${nebula.x}%`,
                top: `${nebula.y}%`,
                width: `${nebula.width}px`,
                height: `${nebula.height}px`,
                background: `radial-gradient(ellipse at center, ${nebula.color}, transparent 70%)`,
                filter: `blur(${nebula.blur}px)`,
                animationDuration: `${nebula.pulseDuration}s`,
                animationDelay: `${nebula.delay}s`,
                '--rotation': `${nebula.rotation}deg`,
              }}
            />
          ))}

          {lensStars.map((star) => (
            <div
              key={star.id}
              className={`lens-star ${constellationZoom ? 'fade-out-zoom' : ''}`}
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: `${star.size}px`,
                height: `${star.size}px`,
                animationDuration: `${star.pulseDuration}s`,
                animationDelay: `${star.delay}s`,
              }}
            />
          ))}

          {geminiStars.map((gemini) => (
            <div
              key={`gem-${gemini.id}`}
              className={`gemini-star ${constellationZoom ? 'fade-out-zoom' : ''}`}
              style={{
                left: `${gemini.x}%`,
                top: `${gemini.y}%`,
                width: `${gemini.size}px`,
                height: `${gemini.size}px`,
                animationDuration: `${gemini.pulseDuration}s`,
                animationDelay: `${gemini.delay}s`,
                '--gem-opacity': gemini.opacity,
                '--gem-rotation': `${gemini.rotation}deg`,
              }}
            />
          ))}
        </div>

        <div className={`telescope-darkness-mask active ${constellationZoom ? 'expand-out' : ''}`} />
        <div className={`telescope-circle ${constellationZoom ? 'expand-out-circle' : ''}`} />
        <div className={`telescope-circle-inner ${constellationZoom ? 'expand-out-circle-inner' : ''}`} />

        {found && previewConstellation && (
          <div className={`found-constellation ${constellationPaused ? 'paused' : ''} ${constellationZoom ? 'zoom-in' : ''}`}>
            <div className="found-constellation-center">
              <svg className="constellation-svg-found" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
                {previewConstellation.links.map((link, index) => (
                  <line
                    key={`found-link-${link.id}`}
                    x1={link.x1}
                    y1={link.y1}
                    x2={link.x2}
                    y2={link.y2}
                    className="constellation-line-found"
                    style={{ animationDelay: `${index * 35}ms` }}
                  />
                ))}
                {previewConstellation.nodes.map((node, index) => (
                  <path
                    key={`found-node-${node.id}`}
                    d={geminiStarPath(node.x, node.y, node.size)}
                    className="constellation-dot-found"
                    style={{ animationDelay: `${index * 28}ms` }}
                  />
                ))}
              </svg>
            </div>
          </div>
        )}

        {searching && !found && (
          <div className="lens-search-text">
            <svg className="lens-search-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="6" y="2" width="12" height="2" rx="0.5" fill="currentColor" />
              <rect x="6" y="20" width="12" height="2" rx="0.5" fill="currentColor" />
              <path d="M8 4 L12 11 L16 4" fill="none" strokeLinejoin="round" />
              <path d="M8 20 L12 13 L16 20" fill="none" strokeLinejoin="round" />
              <circle cx="12" cy="17" r="1.5" fill="currentColor" opacity="0.6">
                <animate attributeName="cy" values="6;17" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.8;0.6" dur="2s" repeatCount="indefinite" />
              </circle>
            </svg>
            <span>Searching for a constellation...</span>
          </div>
        )}

        {found && (
          <div className="lens-found-text">
            <span>Constellation Found!</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default TelescopeView;
