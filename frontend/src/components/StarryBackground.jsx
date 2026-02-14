import React, { useEffect, useState, useRef } from 'react';
import FIXED_STARS from '../data/stars';

const METEOR_ANGLE_DEG = 22.6;
const METEOR_ANGLE_RAD = (METEOR_ANGLE_DEG * Math.PI) / 180;
const METEOR_INITIAL_DELAY = 3.0; // seconds

function createMeteor(id) {
  // Get screen dimensions
  const screenW = window.innerWidth;
  const screenH = window.innerHeight;

  const fromTop = Math.random() > 0.5;

  // Random start position along top 80% or left 80% edge
  let startX, startY;
  if (fromTop) {
    // Spawn from top 80% of screen width
    startX = -100 + Math.random() * (screenW * 0.8 + 100);
    startY = -50 - Math.random() * 50; // -50 to -100
  } else {
    // Spawn from left 80% of screen height
    startX = -50 - Math.random() * 50; // -50 to -100
    startY = -100 + Math.random() * (screenH * 0.8 + 100);
  }

  // At 22.6°, the meteor moves at angle from the horizontal
  // dx per unit distance = cos(22.6°), dy per unit distance = sin(22.6°)
  // We need to find how far it must travel to go offscreen (bottom-right)
  const cosA = Math.cos(METEOR_ANGLE_RAD);
  const sinA = Math.sin(METEOR_ANGLE_RAD);

  // Calculate distance needed to exit the screen
  // Meteor needs to reach either right edge or bottom edge
  const distToRight = cosA > 0 ? (screenW - startX + 200) / cosA : Infinity;
  const distToBottom = sinA > 0 ? (screenH - startY + 200) / sinA : Infinity;
  const totalDist = Math.min(distToRight, distToBottom);

  // Calculate the actual x and y travel distances
  const travelX = totalDist * cosA;
  const travelY = totalDist * sinA;

  // Base duration with +/-10% speed variation
  const baseDuration = 6;
  const speedVariation = 0.9 + Math.random() * 0.2; // 0.9 to 1.1 (±10%)
  const duration = baseDuration * speedVariation;

  return {
    id,
    duration,
    delay: (METEOR_INITIAL_DELAY * 0.9) + Math.random() * (18 * 0.9),
    initialOpacity: 0.3 + Math.random() * 0.7,
    scale: 0.5 + Math.random() * 0.9,
    startX,
    startY,
    travelX,
    travelY,
  };
}

function StarryBackground({ hideMeteors = false, splashDone = false }) {
  const [phase, setPhase] = useState('hidden'); // 'hidden' -> 'landing' -> 'static' -> 'twinkle'
  const [visibleStars, setVisibleStars] = useState(FIXED_STARS); // Only render stars in viewport

  // When splashDone flips to true, start the landing animation
  useEffect(() => {
    if (!splashDone) return;
    setPhase('landing');
    const t1 = setTimeout(() => setPhase('static'), 800);
    const t2 = setTimeout(() => setPhase('twinkle'), 1000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [splashDone]);

  // Filter visible stars: only render stars within screen bounds with padding
  useEffect(() => {
    const filterVisibleStars = () => {
      const padding = 10; // 10% padding outside screen
      setVisibleStars(FIXED_STARS.filter(star => {
        return star.x >= -padding && star.x <= 100 + padding &&
               star.y >= -padding && star.y <= 100 + padding;
      }));
    };
    filterVisibleStars();
  }, []);

  const [meteors, setMeteors] = useState([]);
  const meteorIdRef = useRef(0);
  const timerRefs = useRef({});

  // Delay meteor generation until after sidebar animations complete
  useEffect(() => {
    const timer = setTimeout(() => {
      const m = [];
      for (let i = 0; i < 8; i++) {
        const newMeteor = createMeteor(meteorIdRef.current++);
        m.push(newMeteor);
        // Set up regeneration timer for this meteor
        const totalDuration = (newMeteor.delay + newMeteor.duration) * 1000;
        timerRefs.current[newMeteor.id] = setTimeout(() => {
          regenerateMeteor(newMeteor.id);
        }, totalDuration);
      }
      setMeteors(m);
    }, METEOR_INITIAL_DELAY * 1000);
    return () => {
      clearTimeout(timer);
      // Clear all regeneration timers on unmount
      Object.values(timerRefs.current).forEach(clearTimeout);
    };
  }, []);

  // Function to regenerate a single meteor with new random spawn
  const regenerateMeteor = (oldId) => {
    const newMeteor = createMeteor(meteorIdRef.current++);
    setMeteors(prev => prev.map(m => m.id === oldId ? newMeteor : m));
    
    // Set up next regeneration for this new meteor
    const totalDuration = (newMeteor.delay + newMeteor.duration) * 1000;
    timerRefs.current[newMeteor.id] = setTimeout(() => {
      regenerateMeteor(newMeteor.id);
    }, totalDuration);
  };

  return (
    <div className="starry-background">
      {/* Fixed stars — landing streak -> static -> subtle twinkle */}
      {phase !== 'hidden' && visibleStars.map((star, i) => (
        <div
          key={star.id}
          className={phase === 'landing' ? 'star-landing' : 'bg-twinkle-star'}
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            ...(phase === 'landing' ? {
              '--travel-down': `${300 + (i % 5) * 50}px`,
              '--streak-len': `${12 + (i % 6) * 5}px`,
            } : phase === 'twinkle' ? {
              animation: `star-twinkle-forever ${3 + (i % 5)}s ease-in-out infinite`,
              animationDelay: `${(i * 0.15) % 4}s`,
            } : {}),
          }}
        />
      ))}
      {!hideMeteors && meteors.map(m => (
        <div
          key={m.id}
          className="meteor"
          style={{
            top: `${m.startY}px`,
            left: `${m.startX}px`,
            animationDelay: `${m.delay}s`,
            animationDuration: `${m.duration}s`,
            '--travel-x': `${m.travelX}px`,
            '--travel-y': `${m.travelY}px`,
            '--scale': m.scale,
            '--initial-opacity': m.initialOpacity,
          }}
        />
      ))}
    </div>
  );
}

export default StarryBackground;
