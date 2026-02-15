import React, { useEffect, useState, useRef } from 'react';
import FIXED_STARS from '../data/stars';

const METEOR_ANGLE_DEG = 22.6;
const METEOR_ANGLE_RAD = (METEOR_ANGLE_DEG * Math.PI) / 180;
const METEOR_INITIAL_DELAY = 3.0; // seconds
const MAIN_GEMINI_COUNT = 10;
const GEMINI_HIDE_MIN_MS = 260;
const GEMINI_HIDE_VAR_MS = 360;
const GEMINI_MIN_CYCLES = 2;
const GEMINI_CYCLE_VAR = 3;

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

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function createMainGeminiStar(id) {
  return {
    id,
    x: randomBetween(-8, 108),
    y: randomBetween(-8, 108),
    size: randomBetween(9, 17), // roughly half telescope Gemini stars
    rotation: randomBetween(-22, 22),
    pulseDuration: randomBetween(2.8, 4.8),
    delay: randomBetween(0, 2.8),
    opacity: randomBetween(0.4, 0.8),
    visible: true,
  };
}

function StarryBackground({
  hideMeteors = false,
  enableGeminiStars = false,
  panUpTransition = false,
  starColor = '#ffffff',
}) {
  const [visibleStars, setVisibleStars] = useState(FIXED_STARS);
  const [geminiStars, setGeminiStars] = useState([]);

  // Filter visible stars: only render stars within screen bounds with padding
  useEffect(() => {
    const padding = 10;
    setVisibleStars(FIXED_STARS.filter(star =>
      star.x >= -padding && star.x <= 100 + padding &&
      star.y >= -padding && star.y <= 100 + padding
    ));
  }, []);

  const [meteors, setMeteors] = useState([]);
  const meteorIdRef = useRef(0);
  const timerRefs = useRef({});
  const geminiTimersRef = useRef({});

  useEffect(() => {
    const timer = setTimeout(() => {
      const m = [];
      for (let i = 0; i < 8; i++) {
        const newMeteor = createMeteor(meteorIdRef.current++);
        m.push(newMeteor);
        const totalDuration = (newMeteor.delay + newMeteor.duration) * 1000;
        timerRefs.current[newMeteor.id] = setTimeout(() => {
          regenerateMeteor(newMeteor.id);
        }, totalDuration);
      }
      setMeteors(m);
    }, METEOR_INITIAL_DELAY * 1000);
    return () => {
      clearTimeout(timer);
      Object.values(timerRefs.current).forEach(clearTimeout);
    };
  }, []);

  const regenerateMeteor = (oldId) => {
    const newMeteor = createMeteor(meteorIdRef.current++);
    setMeteors(prev => prev.map(m => m.id === oldId ? newMeteor : m));
    const totalDuration = (newMeteor.delay + newMeteor.duration) * 1000;
    timerRefs.current[newMeteor.id] = setTimeout(() => {
      regenerateMeteor(newMeteor.id);
    }, totalDuration);
  };

  useEffect(() => {
    Object.values(geminiTimersRef.current).forEach(clearTimeout);
    geminiTimersRef.current = {};

    if (!enableGeminiStars) {
      setGeminiStars([]);
      return undefined;
    }

    let isCancelled = false;
    const initialStars = Array.from({ length: MAIN_GEMINI_COUNT }, (_, i) => createMainGeminiStar(i));
    setGeminiStars(initialStars);

    const scheduleRespawn = (starId, pulseDurationSec) => {
      const cycles = GEMINI_MIN_CYCLES + Math.floor(Math.random() * GEMINI_CYCLE_VAR);
      const visibleMs = Math.round(pulseDurationSec * cycles * 1000);

      geminiTimersRef.current[`hide-${starId}`] = setTimeout(() => {
        if (isCancelled) return;
        setGeminiStars(prev => prev.map(star => (
          star.id === starId ? { ...star, visible: false } : star
        )));
        const hiddenMs = GEMINI_HIDE_MIN_MS + Math.floor(Math.random() * GEMINI_HIDE_VAR_MS);
        geminiTimersRef.current[`show-${starId}`] = setTimeout(() => {
          if (isCancelled) return;
          const next = createMainGeminiStar(starId);
          setGeminiStars(prev => prev.map(star => (
            star.id === starId ? next : star
          )));
          scheduleRespawn(starId, next.pulseDuration);
        }, hiddenMs);
      }, visibleMs);
    };

    initialStars.forEach(star => scheduleRespawn(star.id, star.pulseDuration));

    return () => {
      isCancelled = true;
      Object.values(geminiTimersRef.current).forEach(clearTimeout);
      geminiTimersRef.current = {};
    };
  }, [enableGeminiStars]);

  const starColorRgb = (() => {
    const hex = String(starColor || '').trim();
    const normalized = /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : '#ffffff';
    const r = parseInt(normalized.slice(1, 3), 16);
    const g = parseInt(normalized.slice(3, 5), 16);
    const b = parseInt(normalized.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
  })();

  return (
    <div
      className={`starry-background ${panUpTransition ? 'pan-up-transition' : ''}`}
      style={{
        '--bg-star-color': starColor,
        '--bg-star-rgb': starColorRgb
      }}
    >
      {/* Stars always visible in twinkle mode */}
      {visibleStars.map((star, i) => (
        <div
          key={star.id}
          className="bg-twinkle-star"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animation: `star-twinkle-forever ${3 + (i % 5)}s ease-in-out infinite`,
            animationDelay: `${(i * 0.15) % 4}s`,
          }}
        />
      ))}
      {enableGeminiStars && geminiStars.map(star => (
        <div
          key={`main-gemini-${star.id}`}
          className={`bg-gemini-star ${star.visible ? 'is-visible' : 'is-hidden'}`}
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animationDuration: `${star.pulseDuration}s`,
            animationDelay: `${star.delay}s`,
            '--bg-gem-opacity': star.opacity,
            '--bg-gem-rotation': `${star.rotation}deg`,
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
