import React from 'react';
import './AnimatedMeshGradient.css';

// SVG mesh gradient (blue shades), now with richer gradients and more color stops
const meshGradient = `
<svg width="100%" height="100%" viewBox="0 0 1200 900" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
  <defs>
    <radialGradient id="paint0" cx="0.3" cy="0.2" r="0.8">
      <stop offset="0%" stop-color="#60a5fa" />
      <stop offset="50%" stop-color="#38bdf8" />
      <stop offset="100%" stop-color="#2563eb" />
    </radialGradient>
    <radialGradient id="paint1" cx="0.8" cy="0.25" r="0.6">
      <stop offset="0%" stop-color="#0ea5e9" />
      <stop offset="60%" stop-color="#38bdf8" />
      <stop offset="100%" stop-color="#1e40af" />
    </radialGradient>
    <radialGradient id="paint2" cx="0.6" cy="0.8" r="0.7">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="50%" stop-color="#60a5fa" />
      <stop offset="100%" stop-color="#0ea5e9" />
    </radialGradient>
    <radialGradient id="paint3" cx="0.2" cy="0.7" r="0.6">
      <stop offset="0%" stop-color="#2563eb" />
      <stop offset="70%" stop-color="#60a5fa" />
      <stop offset="100%" stop-color="#0ea5e9" />
    </radialGradient>
    <radialGradient id="paint4" cx="0.7" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="#1e40af" />
      <stop offset="60%" stop-color="#2563eb" />
      <stop offset="100%" stop-color="#38bdf8" />
    </radialGradient>
  </defs>
  <rect width="1200" height="900" fill="#071a40"/>
  <ellipse cx="400" cy="250" rx="400" ry="300" fill="url(#paint0)"/>
  <ellipse cx="950" cy="200" rx="370" ry="250" fill="url(#paint1)"/>
  <ellipse cx="800" cy="700" rx="350" ry="300" fill="url(#paint2)"/>
  <ellipse cx="250" cy="700" rx="350" ry="250" fill="url(#paint3)"/>
  <ellipse cx="950" cy="500" rx="300" ry="200" fill="url(#paint4)"/>
</svg>
`;

export default function AnimatedMeshGradient() {
  return (
    <div className="animated-mesh-bg">
      <div
        className="mesh-svg-bg"
        dangerouslySetInnerHTML={{ __html: meshGradient }}
        aria-hidden="true"
      />
      <div className="mesh-anim-overlay" />
    </div>
  );
}
