import React, { useState, useEffect, useRef } from 'react';

function SplashScreen({ onComplete }) {
  const [showHint, setShowHint] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const [showSecondText, setShowSecondText] = useState(false);
  const [exiting, setExiting] = useState(false);

  const timersRef = useRef([]);

  useEffect(() => {
    const timer = setTimeout(() => setShowHint(true), 10000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
    };
  }, []);

  const startExit = () => {
    setExiting(true);
    const t = setTimeout(() => onComplete(), 1500);
    timersRef.current.push(t);
  };

  const skipToSecondText = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setFadingOut(true);
    const t1 = setTimeout(() => {
      setFadingOut(false);
      setShowSecondText(true);
      const t2 = setTimeout(startExit, 3000);
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
    if (!clicked) return "Ready to start learning?";
    if (showSecondText) return "The stars will guide your way";
    return "Let's begin your learning journey";
  };

  return (
    <div
      className={`splash-screen ${exiting ? 'splash-exit' : ''}`}
      onClick={handleClick}
    >
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
