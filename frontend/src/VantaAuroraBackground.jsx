import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import CLOUDS from 'vanta/dist/vanta.clouds.min';

export default function VantaAuroraBackground() {
  const vantaRef = useRef(null);
  const vantaEffect = useRef(null);

  useEffect(() => {
    if (!vantaEffect.current) {
      vantaEffect.current = CLOUDS({
        el: vantaRef.current,
        THREE: THREE,
        mouseControls: false,
        touchControls: false,
        gyroControls: false,
        minHeight: 200.00,
        minWidth: 200.00,
        scale: 1.0,
        scaleMobile: 1.0,
        skyColor: 0x0a1747, // deeper blue
        cloudColor: 0x2563eb, // mesh blue
        cloudShadowColor: 0x60a5fa, // lighter blue
        sunColor: 0x2563eb, // blue
        sunGlareColor: 0x38bdf8, // blue highlight
        sunlightColor: 0x2563eb, // blue
        speed: 0.45, // slower, smoother
        zoom: 1.35, // more zoomed in, less pattern
        cloudShadow: 0.7, // more blending
        cloudShadowColor: 0x60a5fa,
        colorMode: "lerpGradient",
      });
    }
    return () => {
      if (vantaEffect.current) {
        vantaEffect.current.destroy();
        vantaEffect.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={vantaRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
