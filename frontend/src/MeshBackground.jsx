import React from 'react';
import './MeshBackground.css';

export default function MeshBackground() {
  return (
    <div className="mesh-bg-wrapper">
      <svg className="mesh-bg-svg" viewBox="0 0 1200 900" width="100%" height="100%" preserveAspectRatio="none">
        <defs>
          <radialGradient id="mesh1" cx="20%" cy="30%" r="60%">
            <stop offset="0%" stopColor="#60a5fa">
              <animate attributeName="stop-color" values="#60a5fa;#2563eb;#60a5fa" dur="12s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="#2563eb">
              <animate attributeName="stop-color" values="#2563eb;#38bdf8;#2563eb" dur="12s" repeatCount="indefinite" />
            </stop>
          </radialGradient>
          <radialGradient id="mesh2" cx="80%" cy="20%" r="70%">
            <stop offset="0%" stopColor="#0ea5e9">
              <animate attributeName="stop-color" values="#0ea5e9;#1e40af;#0ea5e9" dur="10s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="#38bdf8">
              <animate attributeName="stop-color" values="#38bdf8;#2563eb;#38bdf8" dur="10s" repeatCount="indefinite" />
            </stop>
          </radialGradient>
          <radialGradient id="mesh3" cx="60%" cy="80%" r="80%">
            <stop offset="0%" stopColor="#1e40af">
              <animate attributeName="stop-color" values="#1e40af;#60a5fa;#1e40af" dur="14s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="#0ea5e9">
              <animate attributeName="stop-color" values="#0ea5e9;#38bdf8;#0ea5e9" dur="14s" repeatCount="indefinite" />
            </stop>
          </radialGradient>
        </defs>
        <rect x="-100" y="-100" width="1400" height="1100" fill="url(#mesh1)" opacity="0.7">
          <animate attributeName="x" values="-100;0;-100" dur="18s" repeatCount="indefinite" />
          <animate attributeName="y" values="-100;0;-100" dur="18s" repeatCount="indefinite" />
        </rect>
        <rect x="-100" y="-100" width="1400" height="1100" fill="url(#mesh2)" opacity="0.6">
          <animate attributeName="x" values="-100;100;-100" dur="20s" repeatCount="indefinite" />
          <animate attributeName="y" values="-100;100;-100" dur="20s" repeatCount="indefinite" />
        </rect>
        <rect x="-100" y="-100" width="1400" height="1100" fill="url(#mesh3)" opacity="0.5">
          <animate attributeName="x" values="-100;-80;-100" dur="22s" repeatCount="indefinite" />
          <animate attributeName="y" values="-100;80;-100" dur="22s" repeatCount="indefinite" />
        </rect>
      </svg>
    </div>
  );
}
