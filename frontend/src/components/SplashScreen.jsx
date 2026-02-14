import React, { useState, useEffect } from 'react';

function SplashScreen({ onComplete }) {
  const [showHint, setShowHint] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const [showSecondText, setShowSecondText] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [stars, setStars] = useState([]);

  useEffect(() => {
    const timer = setTimeout(() => setShowHint(true), 10000);
    return () => clearTimeout(timer);
  }, []);

  const generateStars = () => {
    const starCount = 50;
    const newStars = [];
    for (let i = 0; i < starCount; i++) {
      newStars.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        // Stagger appearance over 6 seconds so all are visible by second text
        delay: (i / starCount) * 6,
      });
    }
    return newStars;
  };

  const handleClick = () => {
    if (clicked) return;
    setClicked(true);
    setStars(generateStars());

    // At 5 seconds, start fading out first text
    setTimeout(() => {
      setFadingOut(true);
    }, 5000);

    // At 6 seconds, swap to second text
    setTimeout(() => {
      setFadingOut(false);
      setShowSecondText(true);
    }, 6000);

    // At 10 seconds, start exit animation
    setTimeout(() => {
      setExiting(true);
      setTimeout(() => onComplete(), 1600);
    }, 10000);
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
      {stars.map(star => (
        <div
          key={star.id}
          className="splash-star-gradual"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animationDelay: `${star.delay}s`,
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
