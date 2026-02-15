import React, { useState, useEffect, useRef } from 'react';

const SPLASH_STAR_COUNT = 201;
const STAR_SEQUENCE_SPAN_MS = 2600;
const STAR_DELAY_JITTER_MS = 160;
const STAR_ENTRY_MIN_MS = 1200;
const STAR_ENTRY_MAX_MS = 2100;
const EXIT_TEXT_FADE_MS = 320;
const EXIT_PAN_MS = 1335;
const EXIT_DURATION_MS = EXIT_TEXT_FADE_MS + EXIT_PAN_MS;

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function createSplashStar(id, sequenceIndex, immediate = false) {
  const duration = randomBetween(STAR_ENTRY_MIN_MS, STAR_ENTRY_MAX_MS);
  const maxDelay = Math.max(0, STAR_SEQUENCE_SPAN_MS);
  const baseDelay = (sequenceIndex / Math.max(1, SPLASH_STAR_COUNT - 1)) * STAR_SEQUENCE_SPAN_MS;
  const delay = immediate
    ? 0
    : Math.min(maxDelay, baseDelay + randomBetween(0, STAR_DELAY_JITTER_MS));
  const spawnAbove = Math.random() < 0.66;
  return {
    id,
    x: randomBetween(0, 100),
    y: spawnAbove ? randomBetween(-86, -10) : randomBetween(0, 112),
    size: randomBetween(1.1, 4.2),
    opacity: randomBetween(0.35, 0.95),
    delay,
    duration,
    streakLen: randomBetween(72, 180),
  };
}

function SplashScreen({ onComplete }) {
  const [showHint, setShowHint] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const [showSecondText, setShowSecondText] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [panStarted, setPanStarted] = useState(false);
  const [showAllStars, setShowAllStars] = useState(false);
  const [splashStars, setSplashStars] = useState([]);

  const timersRef = useRef([]);

  const clearAllTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  const populateStars = (immediate = false) => {
    const shuffledIds = Array.from({ length: SPLASH_STAR_COUNT }, (_, i) => i)
      .sort(() => Math.random() - 0.5);
    setSplashStars(shuffledIds.map((id, index) => createSplashStar(id, index, immediate)));
  };

  useEffect(() => {
    const timer = setTimeout(() => setShowHint(true), 10000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, []);

  const startExit = () => {
    setShowAllStars(true);
    setExiting(true);
    setPanStarted(false);
    const tPan = setTimeout(() => setPanStarted(true), EXIT_TEXT_FADE_MS);
    const tDone = setTimeout(() => onComplete?.(), EXIT_DURATION_MS);
    timersRef.current.push(tPan, tDone);
  };

  const skipToSecondText = () => {
    clearAllTimers();
    setShowAllStars(true);
    setFadingOut(false);
    setShowSecondText(true);
    const t = setTimeout(startExit, 3000);
    timersRef.current.push(t);
  };

  const skipToExit = () => {
    clearAllTimers();
    setShowAllStars(true);
    startExit();
  };

  const handleClick = () => {
    if (exiting) return;
    if (!clicked) {
      setClicked(true);
      setShowAllStars(false);
      populateStars(false);
      const t1 = setTimeout(() => setFadingOut(true), 4000);
      const t2 = setTimeout(() => {
        setFadingOut(false);
        setShowSecondText(true);
      }, 5000);
      const t3 = setTimeout(startExit, 8000);
      timersRef.current.push(t1, t2, t3);
    } else if (!showSecondText && !fadingOut) {
      skipToSecondText();
    } else if (showSecondText && !exiting) {
      skipToExit();
    }
  };

  const getText = () => {
    if (!clicked) return "Ready to begin learning?";
    if (showSecondText) return "Let the stars guide you";
    return "Let's begin your learning journey";
  };

  return (
    <div
      className={`splash-screen ${exiting ? 'splash-exit' : ''}`}
      onClick={handleClick}
      style={{
        '--exit-text-fade-ms': `${EXIT_TEXT_FADE_MS}ms`,
        '--exit-pan-ms': `${EXIT_PAN_MS}ms`,
      }}
    >
      {clicked && (
        <div className="splash-stars-layer">
          {splashStars.map((star) => (
            <div
              key={`splash-star-${star.id}`}
              className={`${showAllStars ? 'splash-star-visible' : 'splash-star-gradual'} ${panStarted ? 'star-look-up' : ''}`}
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: `${star.size}px`,
                height: `${star.size}px`,
                animationDelay: exiting ? undefined : (showAllStars ? '0ms' : `${star.delay}ms`),
                animationDuration: exiting ? undefined : (showAllStars ? '0ms' : `${star.duration}ms`),
                '--streak-len': `${star.streakLen}px`,
                '--star-opacity': star.opacity,
              }}
            />
          ))}
        </div>
      )}
      <div className="splash-content">
        <h1
          key={showSecondText ? 'second' : clicked ? 'first' : 'initial'}
          className={`splash-title ${!clicked ? 'animate-gentle-pulse' : fadingOut ? 'splash-title-fade-out' : 'splash-title-transition'}`}
        >
          {getText()}
        </h1>
        {!clicked && (
          <p className={`splash-hint ${showHint ? 'splash-hint-visible' : ''}`}>
            click to begin
          </p>
        )}
      </div>
    </div>
  );
}

export default SplashScreen;
