import { useEffect, useRef, useState } from 'react';
import rough from 'roughjs';
import styles from './RoughCard.module.css';

export default function RoughCard({
  children,
  className = '',
  style = {},
  fill = '#FAFAF8',
  stroke = '#1A1A1A',
  hoverFill,
  hoverStroke,
  strokeWidth = 1.5,
  roughness = 1.2,
  onClick,
  hoverable = false,
  padding = '24px',
  seed,
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [hovered, setHovered] = useState(false);

  const drawCard = (isHovered) => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const w = container.offsetWidth;
    const h = container.offsetHeight;

    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    canvas.width = w * dpr;
    canvas.height = h * dpr;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const rc = rough.canvas(canvas);
    const pad = 2;

    const resolvedFill = isHovered && hoverable
      ? (hoverFill ?? fill)
      : fill;

    const resolvedStroke = isHovered && hoverable
      ? (hoverStroke ?? stroke)
      : stroke;

    rc.rectangle(pad, pad, w - pad * 2, h - pad * 2, {
      fill: resolvedFill,
      fillStyle: 'solid',
      stroke: resolvedStroke,
      strokeWidth: isHovered && hoverable ? strokeWidth + 0.3 : strokeWidth,
      roughness: roughness,
      bowing: 0.6,
      seed: seed ?? 1,
    });
  };

  useEffect(() => {
    drawCard(hovered);

    const observer = new ResizeObserver(() => drawCard(hovered));
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hovered, fill, stroke, hoverFill, hoverStroke, roughness, strokeWidth]);

  return (
    <div
      ref={containerRef}
      className={`${styles.card} ${hoverable ? styles.hoverable : ''} ${className}`}
      style={{ padding, ...style }}
      onClick={onClick}
      onMouseEnter={() => hoverable && setHovered(true)}
      onMouseLeave={() => hoverable && setHovered(false)}
    >
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
}
