import React, { useEffect, useRef, useState } from 'react';
import {
  MAIN_STAR_COUNT,
  MAIN_GEMINI_COUNT,
  createMainStar,
  createMainGeminiStar,
} from '../utils/starField';

const METEOR_ANGLE_DEG = 22.6;
const METEOR_ANGLE_RAD = (METEOR_ANGLE_DEG * Math.PI) / 180;
const METEOR_INITIAL_DELAY = 3.0; // seconds
const HIDE_MIN_MS = 250;
const HIDE_VAR_MS = 540;
const CYCLES_PER_RESPAWN = 4;
const RESPAWN_FADE_IN_DELAY_MS = 45;
const LAST_CYCLE_HIDE_PHASE_IN = 1.0;
const LAST_CYCLE_HIDE_PHASE_OUT = 1.0;
const MAIN_PULSE_SETTLE_BUFFER_MS = 220;
const MAIN_PULSE_MIN_DELAY_MS = 900;

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

function StarryBackground({
  hideMeteors = false,
  enableGeminiStars = false,
  panUpTransition = false,
  showStars = true,
  mainEntrySequence = 0,
  initialStarField = null,
  starColor = '#ffffff',
}) {
  const [mainStars, setMainStars] = useState([]);
  const [geminiStars, setGeminiStars] = useState([]);

  const [meteors, setMeteors] = useState([]);
  const meteorIdRef = useRef(0);
  const meteorTimersRef = useRef({});
  const starTimersRef = useRef({});
  const geminiTimersRef = useRef({});
  const dotPulseActiveRef = useRef(false);
  const geminiPulseActiveRef = useRef(false);
  const dotPulseStartTimerRef = useRef(null);
  const geminiPulseStartTimerRef = useRef(null);

  const clearStarTimers = (ref) => {
    Object.values(ref.current).forEach(clearTimeout);
    ref.current = {};
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      const m = [];
      for (let i = 0; i < 8; i++) {
        const newMeteor = createMeteor(meteorIdRef.current++);
        m.push(newMeteor);
        const totalDuration = (newMeteor.delay + newMeteor.duration) * 1000;
        meteorTimersRef.current[newMeteor.id] = setTimeout(() => {
          regenerateMeteor(newMeteor.id);
        }, totalDuration);
      }
      setMeteors(m);
    }, METEOR_INITIAL_DELAY * 1000);
    return () => {
      clearTimeout(timer);
      Object.values(meteorTimersRef.current).forEach(clearTimeout);
    };
  }, []);

  const regenerateMeteor = (oldId) => {
    const newMeteor = createMeteor(meteorIdRef.current++);
    setMeteors(prev => prev.map(m => m.id === oldId ? newMeteor : m));
    const totalDuration = (newMeteor.delay + newMeteor.duration) * 1000;
    meteorTimersRef.current[newMeteor.id] = setTimeout(() => {
      regenerateMeteor(newMeteor.id);
    }, totalDuration);
  };

  useEffect(() => {
    dotPulseActiveRef.current = false;
    clearTimeout(dotPulseStartTimerRef.current);
    clearStarTimers(starTimersRef);

    if (!showStars) {
      setMainStars([]);
      return undefined;
    }

    const initialStars = initialStarField?.stars?.length
      ? initialStarField.stars.map((star) => ({ ...star, phase: 'landing', hidden: false }))
      : Array.from({ length: MAIN_STAR_COUNT }, (_, i) => createMainStar(i));
    setMainStars(initialStars);
    const landingCompleteMs = initialStars.reduce((maxMs, star) => (
      Math.max(maxMs, Math.round((star.landingDelay || 0) + (star.landingDuration || 0)))
    ), 0);
    const pulseStartDelayMs = Math.max(
      MAIN_PULSE_MIN_DELAY_MS,
      landingCompleteMs + MAIN_PULSE_SETTLE_BUFFER_MS,
    );

    const clearTimersForStar = (starId) => {
      ['hide', 'respawn', 'show'].forEach((stage) => {
        const key = `${stage}-${starId}`;
        if (starTimersRef.current[key]) {
          clearTimeout(starTimersRef.current[key]);
          delete starTimersRef.current[key];
        }
      });
    };

    const scheduleDotRespawn = (star) => {
      if (!dotPulseActiveRef.current) return;

      clearTimersForStar(star.id);
      const hidePhase = star.pulseMode === 'out' ? LAST_CYCLE_HIDE_PHASE_OUT : LAST_CYCLE_HIDE_PHASE_IN;
      const visibleMs = Math.round(star.pulseDuration * ((CYCLES_PER_RESPAWN - 1) + hidePhase) * 1000);
      starTimersRef.current[`hide-${star.id}`] = setTimeout(() => {
        if (!dotPulseActiveRef.current) return;
        setMainStars(prev => prev.map(s => (
          s.id === star.id ? { ...s, hidden: true } : s
        )));

        const hiddenMs = HIDE_MIN_MS + Math.floor(Math.random() * HIDE_VAR_MS);
        starTimersRef.current[`respawn-${star.id}`] = setTimeout(() => {
          if (!dotPulseActiveRef.current) return;
          const next = createMainStar(star.id);
          const respawned = { ...next, phase: 'pulse', pulseMode: 'in', hidden: true, pulseDelay: 0 };
          setMainStars(prev => prev.map(s => (s.id === star.id ? respawned : s)));

          starTimersRef.current[`show-${star.id}`] = setTimeout(() => {
            if (!dotPulseActiveRef.current) return;
            setMainStars(prev => prev.map(s => (
              s.id === star.id ? { ...s, hidden: false } : s
            )));
            scheduleDotRespawn({ ...respawned, hidden: false });
          }, RESPAWN_FADE_IN_DELAY_MS);
        }, hiddenMs);
      }, visibleMs);
    };

    dotPulseStartTimerRef.current = setTimeout(() => {
      dotPulseActiveRef.current = true;
      setMainStars(prev => prev.map(star => ({ ...star, phase: 'pulse', hidden: false })));
      initialStars.forEach((star) => scheduleDotRespawn({ ...star, phase: 'pulse', hidden: false }));
    }, pulseStartDelayMs);

    return () => {
      dotPulseActiveRef.current = false;
      clearTimeout(dotPulseStartTimerRef.current);
      clearStarTimers(starTimersRef);
    };
  }, [showStars, mainEntrySequence, initialStarField]);

  useEffect(() => {
    geminiPulseActiveRef.current = false;
    clearTimeout(geminiPulseStartTimerRef.current);
    clearStarTimers(geminiTimersRef);

    if (!showStars || !enableGeminiStars) {
      setGeminiStars([]);
      return undefined;
    }

    const initialStars = initialStarField?.gemini?.length
      ? initialStarField.gemini.map((star) => ({ ...star, phase: 'landing', hidden: false }))
      : Array.from({ length: MAIN_GEMINI_COUNT }, (_, i) => createMainGeminiStar(i));
    setGeminiStars(initialStars);
    const landingCompleteMs = initialStars.reduce((maxMs, star) => (
      Math.max(maxMs, Math.round((star.landingDelay || 0) + (star.landingDuration || 0)))
    ), 0);
    const pulseStartDelayMs = Math.max(
      MAIN_PULSE_MIN_DELAY_MS,
      landingCompleteMs + MAIN_PULSE_SETTLE_BUFFER_MS,
    );

    const clearTimersForStar = (starId) => {
      ['hide', 'respawn', 'show'].forEach((stage) => {
        const key = `${stage}-${starId}`;
        if (geminiTimersRef.current[key]) {
          clearTimeout(geminiTimersRef.current[key]);
          delete geminiTimersRef.current[key];
        }
      });
    };

    const scheduleGeminiRespawn = (star) => {
      if (!geminiPulseActiveRef.current) return;

      clearTimersForStar(star.id);
      const hidePhase = star.pulseMode === 'out' ? LAST_CYCLE_HIDE_PHASE_OUT : LAST_CYCLE_HIDE_PHASE_IN;
      const visibleMs = Math.round(star.pulseDuration * ((CYCLES_PER_RESPAWN - 1) + hidePhase) * 1000);
      geminiTimersRef.current[`hide-${star.id}`] = setTimeout(() => {
        if (!geminiPulseActiveRef.current) return;
        setGeminiStars(prev => prev.map(s => (
          s.id === star.id ? { ...s, hidden: true } : s
        )));

        const hiddenMs = HIDE_MIN_MS + Math.floor(Math.random() * HIDE_VAR_MS);
        geminiTimersRef.current[`respawn-${star.id}`] = setTimeout(() => {
          if (!geminiPulseActiveRef.current) return;
          const next = createMainGeminiStar(star.id);
          const respawned = { ...next, phase: 'pulse', pulseMode: 'in', hidden: true, pulseDelay: 0 };
          setGeminiStars(prev => prev.map(s => (s.id === star.id ? respawned : s)));

          geminiTimersRef.current[`show-${star.id}`] = setTimeout(() => {
            if (!geminiPulseActiveRef.current) return;
            setGeminiStars(prev => prev.map(s => (
              s.id === star.id ? { ...s, hidden: false } : s
            )));
            scheduleGeminiRespawn({ ...respawned, hidden: false });
          }, RESPAWN_FADE_IN_DELAY_MS);
        }, hiddenMs);
      }, visibleMs);
    };

    geminiPulseStartTimerRef.current = setTimeout(() => {
      geminiPulseActiveRef.current = true;
      setGeminiStars(prev => prev.map(star => ({ ...star, phase: 'pulse', hidden: false })));
      initialStars.forEach((star) => scheduleGeminiRespawn({ ...star, phase: 'pulse', hidden: false }));
    }, pulseStartDelayMs);

    return () => {
      geminiPulseActiveRef.current = false;
      clearTimeout(geminiPulseStartTimerRef.current);
      clearStarTimers(geminiTimersRef);
    };
  }, [showStars, enableGeminiStars, mainEntrySequence, initialStarField]);

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
      {showStars && mainStars.map((star) => (
        <div
          key={star.id}
          className={`${star.phase === 'landing' ? 'star-landing' : 'bg-twinkle-star'} ${star.hidden ? 'is-hidden' : ''}`}
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animationName: star.phase === 'pulse'
              ? (star.pulseMode === 'out' ? 'star-pulse-out-forever' : 'star-pulse-in-forever')
              : undefined,
            animationTimingFunction: star.phase === 'pulse' ? 'linear' : undefined,
            animationDuration: star.phase === 'landing' ? `${star.landingDuration}ms` : `${star.pulseDuration}s`,
            animationDelay: star.phase === 'landing' ? `${star.landingDelay}ms` : `${star.pulseDelay}s`,
            '--travel-down': `${star.travelDown}px`,
            '--streak-len': `${star.streakLen}px`,
            '--star-opacity': star.opacity,
            opacity: star.phase === 'landing' ? undefined : (star.hidden ? 0 : star.opacity),
          }}
        />
      ))}
      {showStars && enableGeminiStars && geminiStars.map((star) => (
        <div
          key={`main-gemini-${star.id}`}
          className={`bg-gemini-star ${star.hidden ? 'is-hidden' : ''} ${star.phase === 'landing' ? 'main-landing' : 'is-visible'}`}
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animationName: star.phase === 'pulse'
              ? (star.pulseMode === 'out' ? 'bg-gemini-pulse-out' : 'bg-gemini-pulse-in')
              : undefined,
            animationTimingFunction: star.phase === 'pulse' ? 'linear' : undefined,
            animationDuration: star.phase === 'landing' ? undefined : `${star.pulseDuration}s`,
            animationDelay: star.phase === 'landing' ? undefined : `${star.pulseDelay}s`,
            '--bg-gem-opacity': star.opacity,
            '--bg-gem-rotation': `${star.rotation}deg`,
            '--travel-down': `${star.travelDown}px`,
            '--land-delay': `${star.landingDelay}ms`,
            '--land-duration': `${star.landingDuration}ms`,
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
