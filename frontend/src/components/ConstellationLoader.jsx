import React from 'react';
import { motion } from 'framer-motion';
import './ConstellationLoader.css';

const ConstellationLoader = () => {
  // Generate random stars for background
  const stars = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 0.5,
    opacity: Math.random() * 0.5 + 0.3,
    duration: Math.random() * 3 + 2
  }));

  // Generate orbiting particles
  const particles = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    angle: (i / 8) * 360,
    size: Math.random() * 8 + 4
  }));

  return (
    <div className="constellation-loader">
      {/* Background stars */}
      <div className="loader-stars">
        {stars.map(star => (
          <motion.div
            key={`star-${star.id}`}
            className="loader-star"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
              opacity: star.opacity
            }}
            animate={{
              opacity: [star.opacity * 0.3, star.opacity, star.opacity * 0.3]
            }}
            transition={{
              duration: star.duration,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        ))}
      </div>

      {/* Main loader content */}
      <div className="loader-content">
        {/* Central orb */}
        <motion.div
          className="loader-central-orb"
          animate={{
            scale: [1, 1.2, 1],
            boxShadow: [
              '0 0 20px rgba(167, 139, 250, 0.5)',
              '0 0 40px rgba(167, 139, 250, 0.8)',
              '0 0 20px rgba(167, 139, 250, 0.5)'
            ]
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />

        {/* Orbiting particles */}
        {particles.map(particle => (
          <motion.div
            key={`particle-${particle.id}`}
            className="loader-particle"
            style={{
              width: particle.size,
              height: particle.size
            }}
            animate={{
              rotate: 360,
              x: `calc(${Math.cos(particle.angle * Math.PI / 180) * 80}px)`,
              y: `calc(${Math.sin(particle.angle * Math.PI / 180) * 80}px)`
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'linear'
            }}
          />
        ))}

        {/* Ring effect */}
        <motion.div
          className="loader-ring"
          animate={{
            rotate: 360,
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            rotate: { duration: 4, repeat: Infinity, ease: 'linear' },
            opacity: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }
          }}
        />

        {/* Text */}
        <div className="loader-text-wrapper">
          <motion.h2
            className="loader-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Generating Your Constellation
          </motion.h2>
          
          <motion.div
            className="loader-dots"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <motion.span
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              ·
            </motion.span>
            <motion.span
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
            >
              ·
            </motion.span>
            <motion.span
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
            >
              ·
            </motion.span>
          </motion.div>

          <motion.p
            className="loader-subtitle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            Mapping concepts into your skill tree...
          </motion.p>
        </div>
      </div>

      {/* Ambient glow */}
      <div className="loader-glow"></div>
    </div>
  );
};

export default ConstellationLoader;
