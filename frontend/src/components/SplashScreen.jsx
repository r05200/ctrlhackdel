import React, { useState, useEffect, useRef, useMemo } from 'react';
import FIXED_STARS from '../data/stars';

const PAN_FLYBY_COUNT = 100; // extra streaking stars during pan

function SplashScreen({ onComplete }) {
  const [showHint, setShowHint] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const [showSecondText, setShowSecondText] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [showStars, setShowStars] = useState(false);
  
  const timersRef = useRef([]);

  // Generate random flyby stars for the pan
  const panFlybyStars = useMemo(() => {
    return Array.from({ length: PAN_FLYBY_COUNT }, (_, i) => ({
      id: `pan-flyby-${i}`,
      x: Math.random() * 98,
      size: 0.5 + Math.random() * 2.0,
      delay: Math.random() * 1.4,
      duration: 0.6 + Math.random() * 1.0,
      streakLen: 15 + Math.random() * 45,
    }));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setShowHint(true), 10000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    return () => {
      // Clear all timers on unmount
      timersRef.current.forEach(clearTimeout);
    };
  }, []);

  const startExit = () => {
    setExiting(true);
    const t = setTimeout(() => onComplete(), 2000);
    timersRef.current.push(t);
  };

  const skipToSecondText = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    
    setFadingOut(true);
    const t1 = setTimeout(() => {
      setFadingOut(false);
      setShowSecondText(true);
      const t2 = setTimeout(startExit, 4000);
      timersRef.current.push(t2);
    }, 1000);
    timersRef.current.push(t1);
  };

  const skipToExit = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    startExit();
  };

  const handleClick = () => {
    if (exiting) return;
    
    if (!clicked) {
      setClicked(true);
      setShowStars(true);

      const t1 = setTimeout(() => setFadingOut(true), 5000);
      const t2 = setTimeout(() => {
        setFadingOut(false);
        setShowSecondText(true);
      }, 6000);
      const t3 = setTimeout(startExit, 10000);
      
      timersRef.current.push(t1, t2, t3);
    } else if (!showSecondText && !fadingOut) {
      skipToSecondText();
    } else if (showSecondText && !exiting) {
      skipToExit();
    }
  };

  const getText = () => {
    if (!clicked) return "Ready to start learning?";
    if (showSecondText) return "The stars will guide your way";
    return "Let's begin your learning journey";
  };

  return (
    <div
      className={`splash-screen ${exiting ? 'splash-exit' : ''}`}
      onClick={handleClick}
    >
      {/* Use FIXED_STARS — same positions as main screen */}
      {showStars && FIXED_STARS.map((star, i) => (
        <div
          key={star.id}
          className={`splash-star-gradual ${exiting ? 'star-look-up' : ''}`}
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animationDelay: exiting ? '0s' : `${(i / FIXED_STARS.length) * 6}s`,
            '--star-streak': `${Math.max(star.size * 8, 15)}px`,
          }}
        />
      ))}
      {/* Streaking stars during pan — fly down through viewport */}
      {exiting && panFlybyStars.map((star) => (
        <div
          key={star.id}
          className="pan-streak-star"
          style={{
            left: `${star.x}%`,
            top: `${-5 + Math.random() * 40}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animationDelay: `${star.delay}s`,
            animationDuration: `${star.duration}s`,
            '--streak-len': `${star.streakLen}px`,
          }}
        />
      ))}
      {/* FIXED_STARS streaking down to land at their positions */}
      {exiting && FIXED_STARS.map((star, i) => (
        <div
          key={`land-${star.id}`}
          className="pan-landing-star"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            '--travel-down': `${300 + (i % 5) * 60}px`,
            '--streak-len': `${12 + (i % 6) * 5}px`,
            animationDelay: `${0.3 + Math.random() * 0.5}s`,
          }}
        />
      ))}
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
