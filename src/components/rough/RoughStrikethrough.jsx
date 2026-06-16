import { useEffect, useRef } from 'react';
import rough from 'roughjs';
import styles from './RoughStrikethrough.module.css';

export default function RoughStrikethrough({ children, done = false }) {
  const textRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const text = textRef.current;
    const canvas = canvasRef.current;
    if (!text || !canvas || !done) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = text.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    canvas.width = w * dpr;
    canvas.height = h * dpr;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const rc = rough.canvas(canvas);
    const midY = h / 2;

    // Double line strikethrough — hand-drawn feel
    rc.line(0, midY - 1, w, midY + 1, {
      stroke: 'var(--color-mustard)',
      strokeWidth: 2.2,
      roughness: 2.0,
      bowing: 1.5,
      seed: 3,
    });
    rc.line(2, midY + 2, w - 2, midY + 3, {
      stroke: 'var(--color-mustard)',
      strokeWidth: 1.2,
      roughness: 2.5,
      bowing: 2.0,
      seed: 9,
    });
  }, [done]);

  return (
    <span className={`${styles.wrap} ${done ? styles.done : ''}`}>
      <span ref={textRef} className={styles.text}>{children}</span>
      {done && (
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          aria-hidden="true"
        />
      )}
    </span>
  );
}
