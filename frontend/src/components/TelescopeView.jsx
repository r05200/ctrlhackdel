import React, { useState, useEffect, useRef, useCallback } from 'react';

const DIRECTIONS = ['left', 'right', 'up', 'down'];

// Dummy constellation data
const DUMMY_CONSTELLATION = {
  stars: [
    { x: 45, y: 40, size: 3 },
    { x: 48, y: 35, size: 2.5 },
    { x: 52, y: 33, size: 3.5 },
    { x: 55, y: 37, size: 2.5 },
    { x: 53, y: 42, size: 3 },
    { x: 50, y: 45, size: 2.8 },
    { x: 47, y: 43, size: 3.2 },
  ],
  lines: [
    [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 0],
  ],
  centerOffset: { x: 0, y: 5 } // Where constellation is located relative to current view
};

function generateLensStars(count) {
  // Generate stars across an oversized field so panning never runs out
  const stars = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      id: i,
      x: Math.random() * 200 - 50,  // -50% to 150% — large field
      y: Math.random() * 200 - 50,
      size: Math.random() * 2.5 + 1.2,
      pulseDuration: 3 + Math.random() * 3,
      delay: Math.random() * 4,
    });
  }
  return stars;
}

function TelescopeView({ query }) {
  const [phase, setPhase] = useState('pan-up');
  const [lensStars] = useState(() => generateLensStars(200));
  const [searching, setSearching] = useState(false);
  const [found, setFound] = useState(false);
  const [shakeClass, setShakeClass] = useState('');
  const [skyOffset, setSkyOffset] = useState({ x: 0, y: 0 });
  const [panDir, setPanDir] = useState(null);
  const [panSpeed, setPanSpeed] = useState(null);
  const [transitionMs, setTransitionMs] = useState(0);
  const [streakPhase, setStreakPhase] = useState(null);
  const timersRef = useRef([]);
  const searchLoopRef = useRef(true); // Control search loop

  // Kick off the searching panning loop
  const startSearchPan = useCallback(() => {
    const dir = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
    const dur = 2500 + Math.floor(Math.random() * 2500); // 2500–5000ms
    const dist = 6 + Math.floor(Math.random() * 7); // 6–12% pan distance

    // Timing: 27.5% accel, 37.5% cruise, 35% decel
    const accelEnd = dur * 0.275;
    const cruiseEnd = dur * 0.65;

    setPanDir(dir);
    setPanSpeed(dur);
    setTransitionMs(dur);

    // Phase 1: Accelerating — streaks building
    setStreakPhase('accel');

    // Phase 2: Cruising — full streaks
    const tCruise = setTimeout(() => setStreakPhase('cruise'), accelEnd);

    // Phase 3: Decelerating — streaks shrinking
    const tDecel = setTimeout(() => setStreakPhase('decel'), cruiseEnd);

    // Move the sky offset in the chosen direction with bounds checking
    setSkyOffset(prev => {
      let newX = prev.x;
      let newY = prev.y;
      
      switch (dir) {
        case 'left':  newX = prev.x + dist; break;
        case 'right': newX = prev.x - dist; break;
        case 'up':    newY = prev.y + dist; break;
        case 'down':  newY = prev.y - dist; break;
      }
      
      // Clamp offsets to keep viewport within star field bounds
      // Stars span -50% to 150%, safe pan range is approximately -40% to 40%
      const MAX_OFFSET = 40;
      newX = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, newX));
      newY = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, newY));
      
      return { x: newX, y: newY };
    });

    // After the pan finishes, clear everything
    const tEnd = setTimeout(() => {
      setPanDir(null);
      setPanSpeed(null);
      setStreakPhase(null);
    }, dur);

    // Schedule the next pan after current duration + 4s delay
    const tNext = setTimeout(() => {
      if (searchLoopRef.current) {
        startSearchPan();
      }
    }, dur + 4000);

    timersRef.current.push(tCruise, tDecel, tEnd, tNext);
  }, []);

  // Random hand-shake effect on the circle
  useEffect(() => {
    if (!searching) return;
    const runShake = () => {
      setShakeClass('hand-shake');
      const clear = setTimeout(() => setShakeClass(''), 100);
      const next = setTimeout(runShake, 1500 + Math.random() * 2500);
      timersRef.current.push(clear, next);
    };
    const init = setTimeout(runShake, 2000);
    timersRef.current.push(init);
  }, [searching]);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('zoom-lens'), 3000);
    const t2 = setTimeout(() => {
      setSearching(true);
      startSearchPan();
    }, 5500);
    
    // After 12 seconds of searching, find the constellation
    const t3 = setTimeout(() => {
      searchLoopRef.current = false; // Stop search loop
      timersRef.current.forEach(clearTimeout); // Clear all pending pans
      timersRef.current = [];
      
      // Clear any ongoing pan state
      setPanDir(null);
      setPanSpeed(null);
      setStreakPhase(null);
      
      // Move to constellation location with smooth transition
      setTransitionMs(3000);
      setSkyOffset(DUMMY_CONSTELLATION.centerOffset);
      
      // Set found state and change phase
      setTimeout(() => {
        setFound(true);
        setPhase('found');
      }, 1500); // Show "Found!" halfway through zoom
      
    }, 17500); // 5.5s delay + 12s searching

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      timersRef.current.forEach(clearTimeout);
    };
  }, [startSearchPan]);

  // Build streak class for the sky
  const streakClass = panDir ? `streaking-${panDir}` : '';
  const phaseClass = streakPhase ? `streak-${streakPhase}` : '';
  const speedClass = panSpeed && panSpeed <= 2750 ? 'streak-fast' : panSpeed ? 'streak-slow' : '';

  return (
    <div className="telescope-overlay">
      <div className={`telescope-scene-wrap ${phase}`}>
        {/* Night sky — moves via inline transform, stars are children so they follow */}
        <div
          className={`telescope-sky-bg ${streakClass} ${speedClass} ${phaseClass}`}
          style={{
            transform: `translate(${skyOffset.x}%, ${skyOffset.y}%)`,
            transition: transitionMs > 0
              ? `transform ${transitionMs}ms cubic-bezier(0.7, 0, 0.12, 1)`
              : 'none',
          }}
        >
          {lensStars.map(star => (
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
          
          {/* Constellation overlay — appears when found */}
          {found && (
            <div className="found-constellation">
              <svg className="constellation-svg-found" viewBox="0 0 100 100">
                {DUMMY_CONSTELLATION.lines.map(([i, j], idx) => {
                  const star1 = DUMMY_CONSTELLATION.stars[i];
                  const star2 = DUMMY_CONSTELLATION.stars[j];
                  return (
                    <line
                      key={idx}
                      x1={star1.x}
                      y1={star1.y}
                      x2={star2.x}
                      y2={star2.y}
                      className="constellation-line-found"
                      style={{ animationDelay: `${idx * 0.15}s` }}
                    />
                  );
                })}
                {DUMMY_CONSTELLATION.stars.map((star, i) => (
                  <circle
                    key={i}
                    cx={star.x}
                    cy={star.y}
                    r={star.size * 0.6}
                    className="constellation-dot-found"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </svg>
            </div>
          )}
        </div>

        {/* Circle with hand-shake — expands out when found */}
        <div className={`telescope-circle ${shakeClass} ${found ? 'expand-out-circle' : ''}`} />

        {/* Loading text overlay */}
        {searching && !found && (
          <div className="lens-search-text">
            <svg className="lens-search-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="6" y="2" width="12" height="2" rx="0.5" fill="currentColor"/>
              <rect x="6" y="20" width="12" height="2" rx="0.5" fill="currentColor"/>
              <path d="M8 4 L12 11 L16 4" fill="none" strokeLinejoin="round"/>
              <path d="M8 20 L12 13 L16 20" fill="none" strokeLinejoin="round"/>
              <circle cx="12" cy="17" r="1.5" fill="currentColor" opacity="0.6">
                <animate attributeName="cy" values="6;17" dur="2s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.8;0.6" dur="2s" repeatCount="indefinite"/>
              </circle>
            </svg>
            <span>Searching for constellation...</span>
          </div>
        )}
        
        {/* Found text */}
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
