import { useEffect, useRef } from 'react';
import rough from 'roughjs';

export function useRough(drawFn, deps = []) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const rc = rough.canvas(canvas);

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, rect.width, rect.height);
    drawFn(rc, ctx, rect.width, rect.height);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return canvasRef;
}

export const ROUGH_DEFAULTS = {
  roughness: 1.4,
  strokeWidth: 1.5,
  bowing: 0.8,
  seed: 42,
};

export const ROUGH_HEAVY = {
  roughness: 2.2,
  strokeWidth: 2,
  bowing: 1.2,
  seed: 77,
};

export const ROUGH_LIGHT = {
  roughness: 0.8,
  strokeWidth: 1.2,
  bowing: 0.5,
  seed: 12,
};
