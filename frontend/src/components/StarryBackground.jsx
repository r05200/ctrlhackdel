import React, { useEffect, useState, useRef } from 'react';

const MAX_STARS = 15;
const METEOR_ANGLE_DEG = 22.6;
const METEOR_ANGLE_RAD = (METEOR_ANGLE_DEG * Math.PI) / 180;
// Delay meteors until after main screen is fully visible
const METEOR_INITIAL_DELAY = 1.5; // seconds

function createStar(id) {
  const pulseDuration = 3 + Math.random() * 3;
  const pulseCount = 3 + Math.floor(Math.random() * 4);
  const totalLife = pulseDuration * pulseCount;
  return {
    id,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 0.5,
    pulseDuration,
    totalLife,
    createdAt: Date.now(),
  };
}

function createMeteor(id) {
  // Get screen dimensions
  const screenW = window.innerWidth;
  const screenH = window.innerHeight;

  const fromTop = Math.random() > 0.5;

  // Random start position along top edge or left edge (just offscreen)
  let startX, startY;
  if (fromTop) {
    startX = Math.random() * screenW;
    startY = -20;
  } else {
    startX = -20;
    startY = Math.random() * screenH;
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

  return {
    id,
    duration: 5 + Math.random() * 3,
    delay: METEOR_INITIAL_DELAY + Math.random() * 12,
    initialOpacity: 0.3 + Math.random() * 0.7,
    scale: 0.5 + Math.random() * 0.9,
    startX,
    startY,
    travelX,
    travelY,
  };
}

function StarryBackground() {
  const nextId = useRef(0);
  const [twinkleStars, setTwinkleStars] = useState(() => {
    const stars = [];
    for (let i = 0; i < MAX_STARS; i++) {
      const star = createStar(nextId.current++);
      star.createdAt = Date.now() + Math.random() * 10000;
      stars.push(star);
    }
    return stars;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setTwinkleStars(prev => {
        const now = Date.now();
        return prev.map(star => {
          const elapsed = (now - star.createdAt) / 1000;
          if (elapsed > star.totalLife) {
            return createStar(nextId.current++);
          }
          return star;
        });
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const [meteors] = useState(() => {
    const m = [];
    for (let i = 0; i < 12; i++) {
      m.push(createMeteor(i));
    }
    return m;
  });

  return (
    <div className="starry-background">
      {twinkleStars.map(star => (
        <div
          key={star.id}
          className="bg-twinkle-star"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            '--pulse-duration': `${star.pulseDuration}s`,
            '--total-life': `${star.totalLife}s`,
            animation: `star-pulse ${star.pulseDuration}s ease-in-out infinite, star-lifecycle ${star.totalLife}s ease-in-out forwards`,
          }}
        />
      ))}
      {meteors.map(m => (
        <div
          key={m.id}
          className="meteor"
          style={{
            top: `${m.startY}px`,
            left: `${m.startX}px`,
            animationDelay: `${m.delay}s`,
            animationDuration: `${m.duration}s`,
            opacity: m.initialOpacity,
            '--travel-x': `${m.travelX}px`,
            '--travel-y': `${m.travelY}px`,
            '--scale': m.scale,
          }}
        />
      ))}
    </div>
  );
}

export default StarryBackground;
