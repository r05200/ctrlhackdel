import React, { useState, useEffect, useRef, useCallback } from 'react';
import { generateCustomTree } from '../services/api';

const DIRECTIONS = ['left', 'right', 'up', 'down'];
const FOUND_ZOOM_MS = 1800;
const FOUND_PAN_DISTANCE = 0;

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

function generateLensStars(count) {
  const stars = [];
  for (let i = 0; i < count; i += 1) {
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
}

function generateGeminiStars(count) {
  const stars = [];
  const nearViewportCount = Math.max(6, Math.floor(count * 0.65));

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

  for (let i = nearViewportCount; i < count; i += 1) {
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

function TelescopeView({ query, onComplete }) {
  const [phase, setPhase] = useState('pan-up');
  const [lensStars] = useState(() => generateLensStars(200));
  const [geminiStars] = useState(() => generateGeminiStars(12));
  const [nebulas] = useState(() => generateNebulas(6));
  const [searching, setSearching] = useState(false);
  const [found, setFound] = useState(false);
  const [skyOffset, setSkyOffset] = useState({ x: 0, y: 0 });
  const [panDir, setPanDir] = useState(null);
  const [panSpeed, setPanSpeed] = useState(null);
  const [transitionMs, setTransitionMs] = useState(0);
  const [streakPhase, setStreakPhase] = useState(null);
  const [constellationZoom, setConstellationZoom] = useState(false);
  const [generatedTree, setGeneratedTree] = useState(null);

  const timersRef = useRef([]);
  const searchLoopRef = useRef(true);
  const completionQueuedRef = useRef(false);
  const generatedTreeRef = useRef(null);

  useEffect(() => {
    generatedTreeRef.current = generatedTree;
  }, [generatedTree]);

  const ensureTreeData = useCallback(async () => {
    let tree = generatedTreeRef.current;
    if (!tree && query) {
      tree = await generateCustomTree(query);
      generatedTreeRef.current = tree;
      setGeneratedTree(tree);
    }
    return tree;
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    if (!query) return undefined;

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
  }, [query]);

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

  // When found, trigger completion
  useEffect(() => {
    if (!found || !query) return undefined;
    if (completionQueuedRef.current) return undefined;
    completionQueuedRef.current = true;

    let cancelled = false;

    const completeSearch = async () => {
      try {
        const tree = await ensureTreeData();
        if (cancelled) return;
        if (onComplete) {
          setTimeout(() => {
            if (!cancelled) onComplete(tree);
          }, FOUND_ZOOM_MS + 400);
        }
      } catch (error) {
        console.error('Error generating tree:', error);
        if (onComplete) onComplete(null);
      }
    };

    completeSearch();
    return () => { cancelled = true; };
  }, [found, query, onComplete, ensureTreeData]);

  useEffect(() => {
    if (!found) completionQueuedRef.current = false;
  }, [found]);

  // When found, start zoom immediately
  useEffect(() => {
    if (!found) {
      setConstellationZoom(false);
      return undefined;
    }
    const zoomTimer = setTimeout(() => {
      setConstellationZoom(true);
    }, 300);
    return () => clearTimeout(zoomTimer);
  }, [found]);

  // Main timeline
  useEffect(() => {
    let cancelled = false;

    const t1 = setTimeout(() => setPhase('zoom-lens'), 3000);
    const t2 = setTimeout(() => {
      setSearching(true);
      startSearchPan();
    }, 5500);

    const t3 = setTimeout(() => {
      searchLoopRef.current = false;
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];

      setPanDir(null);
      setPanSpeed(null);
      setStreakPhase(null);

      setTransitionMs(3000);
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
    };
  }, [startSearchPan, ensureTreeData]);

  const streakClass = panDir ? `streaking-${panDir}` : '';
  const phaseClass = streakPhase ? `streak-${streakPhase}` : '';
  const speedClass = panSpeed && panSpeed <= 2750 ? 'streak-fast' : panSpeed ? 'streak-slow' : '';
  const sceneClass = `${phase}${phase === 'found' ? ' zoom-lens' : ''}`;

  return (
    <div className="telescope-overlay">
      <div className={`telescope-scene-wrap ${sceneClass}`}>
        <div
          className={`telescope-sky-bg ${streakClass} ${speedClass} ${phaseClass}`}
          style={{
            transform: `translate(${skyOffset.x}%, ${skyOffset.y}%)`,
            transition: transitionMs > 0 ? `transform ${transitionMs}ms cubic-bezier(0.7, 0, 0.12, 1)` : 'none',
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
              className="lens-star"
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
              className="gemini-star"
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

        <div className={`telescope-darkness-mask ${(searching || found) ? 'active' : ''} ${constellationZoom ? 'expand-out' : ''}`} />
        <div className={`telescope-circle ${constellationZoom ? 'expand-out-circle' : ''}`} />
        <div className={`telescope-circle-inner ${constellationZoom ? 'expand-out-circle-inner' : ''}`} />

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
            <span>Searching for constellation...</span>
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
