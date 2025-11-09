// src/App.jsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import './styles.css';
import { fnv1a, mulberry32 } from './seed.js';
import { generateFromSeedString } from './gen.js';
import { mountRenderer } from './render/renderer.js';

const VERSION_SALT = 'v1';

export default function App() {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const [seed, setSeed] = useState(() => Math.random().toString(36).slice(2, 10));

  const computeParams = useCallback((s) => {
    const h = fnv1a(`${VERSION_SALT}:${s}`);
    const rand = mulberry32(h);
    return generateFromSeedString(s, VERSION_SALT, rand);
  }, []);

  const regen = useCallback((s) => {
    setSeed(s);
    const out = computeParams(s);
    sceneRef.current?.regenerate(out);
  }, [computeParams]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const scene = mountRenderer(canvasRef.current);
    sceneRef.current = scene;
    regen(seed);
    return () => {
      scene.dispose?.();
      sceneRef.current = null;
    };
  }, []); // mount once

  const onNewSeed = () => {
    const s = Math.random().toString(36).slice(2, 10);
    regen(s);
  };

  const copySeed = async () => {
    try {
      await navigator.clipboard.writeText(seed);
    } catch {}
  };

  return (
    <div className="app">
      <canvas ref={canvasRef} className="canvas" />
      <div className="hud">
        <button className="seed" onClick={copySeed} aria-label="Copy seed">{seed}</button>
        <button className="new" onClick={onNewSeed} aria-label="New seed">New Seed</button>
      </div>
    </div>
  );
}
