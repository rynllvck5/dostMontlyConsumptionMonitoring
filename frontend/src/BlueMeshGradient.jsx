import React, { useRef, useEffect, useState } from 'react';

// Utility to generate a random float in a range
const rand = (min, max) => Math.random() * (max - min) + min;

// Generate a random smooth path for an orb
function generatePath(duration, width, height, steps = 6) {
  // Generate random points
  const points = Array.from({ length: steps }, () => [rand(0, width), rand(0, height)]);
  // Loop back to start for seamlessness
  points.push(points[0]);
  // Return a function that interpolates between points
  return t => {
    const total = points.length - 1;
    const seg = Math.floor(t * total);
    const localT = (t * total) - seg;
    const [x1, y1] = points[seg];
    const [x2, y2] = points[seg + 1];
    return {
      x: x1 + (x2 - x1) * localT,
      y: y1 + (y2 - y1) * localT
    };
  };
}

const ORBS = [
  // Large, elongated, much slower
  { size: 540, from: '#60a5fa', to: '#22d3ee', blur: '5xl', opacity: 0.32, duration: 60 },
  { size: 480, from: '#3b82f6', to: '#6366f1', blur: '4xl', opacity: 0.38, duration: 78 },
  { size: 420, from: '#38bdf8', to: '#2563eb', blur: '5xl', opacity: 0.36, duration: 68 },
  // Medium
  { size: 312, from: '#bae6fd', to: '#1e40af', blur: '3xl', opacity: 0.28, duration: 54 },
  { size: 270, from: '#818cf8', to: '#3b82f6', blur: '3xl', opacity: 0.33, duration: 63 },
  { size: 250, from: '#7dd3fc', to: '#60a5fa', blur: '2xl', opacity: 0.28, duration: 50 },
  // Small
  { size: 210, from: '#38bdf8', to: '#22d3ee', blur: '2xl', opacity: 0.24, duration: 44 },
  { size: 170, from: '#6366f1', to: '#bae6fd', blur: 'xl', opacity: 0.27, duration: 59 },
  { size: 240, from: '#7dd3fc', to: '#1e40af', blur: '2xl', opacity: 0.2, duration: 77 },
  { size: 140, from: '#a5f3fc', to: '#2563eb', blur: 'lg', opacity: 0.22, duration: 40 },
  { size: 120, from: '#60a5fa', to: '#6366f1', blur: 'lg', opacity: 0.23, duration: 42 }
];

export default function BlueMeshGradient({ children }) {
  const containerRef = useRef(null);
  const [orbs, setOrbs] = useState([]);
  const [dimensions, setDimensions] = useState({ width: 1920, height: 1080 });

  // On mount, set container size and generate random paths
  useEffect(() => {
    function updateDims() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setDimensions({ width: w, height: h });
    }
    updateDims();
    window.addEventListener('resize', updateDims);
    return () => window.removeEventListener('resize', updateDims);
  }, []);

  useEffect(() => {
    // For each orb, generate a unique smooth path
    setOrbs(
      ORBS.map(orb => ({
        ...orb,
        path: generatePath(orb.duration, dimensions.width, dimensions.height, 6 + Math.floor(rand(0, 2)))
      }))
    );
    // eslint-disable-next-line
  }, [dimensions.width, dimensions.height]);

  // Animate all orbs
  const [, setTick] = useState(0);
  useEffect(() => {
    let running = true;
    function animate() {
      setTick(t => t + 1);
      if (running) requestAnimationFrame(animate);
    }
    animate();
    return () => { running = false; };
  }, []);

  const now = Date.now();

  return (
    <div className="min-h-screen w-full relative overflow-hidden" ref={containerRef}>
      {/* Main gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-blue-600 to-blue-900"></div>
      {/* Mesh overlay elements with random, smooth movement */}
      <div className="absolute inset-0">
        {orbs.map((orb, i) => {
          // Much slower movement
          const t = ((now / 1000) % (orb.duration * 2.8)) / (orb.duration * 2.8);
          const { x, y } = orb.path ? orb.path(t) : { x: 0, y: 0 };

          // Animate SVG filter seed/frequency for morphing (slower)
          const morphSeed = (now / (16000 + i * 2345)) % 100;
          const freq = 0.008 + 0.007 * Math.sin(now / (18000 + i * 533));
          const filterId = `morphFilter${i}`;
          const gradId = `orbGrad${i}`;

          return (
            <svg
              key={i}
              width={orb.size * 2.2}
              height={orb.size}
              style={{
                position: 'absolute',
                left: x - orb.size * 1.1,
                top: y - orb.size / 2,
                opacity: orb.opacity,
                pointerEvents: 'none',
                zIndex: 1,
                filter: `blur(${orb.size / 4}px)`
              }}
            >
              <defs>
                <radialGradient id={gradId} cx="30%" cy="50%" r="90%">
                  <stop offset="0%" stopColor={orb.from} />
                  <stop offset="100%" stopColor={orb.to} />
                </radialGradient>
                <filter id={filterId} x="-30%" y="-30%" width="180%" height="180%">
                  <feTurbulence type="turbulence" baseFrequency={freq} numOctaves="2" seed={morphSeed} result="turb" />
                  <feDisplacementMap in2="turb" in="SourceGraphic" scale={orb.size / 2.2} xChannelSelector="R" yChannelSelector="G" />
                </filter>
              </defs>
              <ellipse
                cx={orb.size * 1.1}
                cy={orb.size / 2}
                rx={orb.size * 1.05}
                ry={orb.size / 2.25}
                fill={`url(#${gradId})`}
                filter={`url(#${filterId})`}
              />
            </svg>
          );
        })}
      </div>
      {/* Children (login card, etc.) */}
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        {children}
      </div>
    </div>
  );
}
