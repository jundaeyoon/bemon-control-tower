import { useEffect, useRef, useState } from 'react';
import rough from 'roughjs';
import styles from './RoughButton.module.css';

export default function RoughButton({
  children,
  variant = 'primary', // primary | secondary | ghost
  size = 'md',          // sm | md | lg
  onClick,
  disabled = false,
  fullWidth = false,
  type = 'button',
  className = '',
  style = {},
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);

  const VARIANT_STYLES = {
    primary:   { fill: 'var(--color-mustard)',       stroke: '#B8903A', strokeWidth: 1.8 },
    secondary: { fill: 'var(--color-green-khaki)',    stroke: '#4E5E42', strokeWidth: 1.8 },
    ghost:     { fill: 'rgba(0,0,0,0)',               stroke: 'var(--color-text-sub)', strokeWidth: 1.4 },
    danger:    { fill: 'var(--color-warning)',        stroke: '#B8603A', strokeWidth: 1.8 },
  };

  const SIZE_PADDING = {
    sm: { px: 14, py: 7 },
    md: { px: 20, py: 10 },
    lg: { px: 28, py: 14 },
  };

  const draw = () => {
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
    const vs = VARIANT_STYLES[variant] ?? VARIANT_STYLES.primary;
    const pad = 1.5;

    let fillColor = vs.fill;
    if (disabled) fillColor = '#D0CFC8';
    else if (pressed) fillColor = vs.fill === 'rgba(0,0,0,0)' ? 'rgba(0,0,0,0.04)' : adjustBrightness(vs.fill, -15);
    else if (hovered) fillColor = vs.fill === 'rgba(0,0,0,0)' ? 'rgba(0,0,0,0.03)' : adjustBrightness(vs.fill, 8);

    rc.rectangle(pad, pad, w - pad * 2, h - pad * 2, {
      fill: fillColor,
      fillStyle: 'solid',
      stroke: disabled ? '#B0AFA8' : vs.stroke,
      strokeWidth: vs.strokeWidth,
      roughness: 1.6,
      bowing: 0.7,
      seed: 5,
    });
  };

  useEffect(() => {
    draw();
    const observer = new ResizeObserver(draw);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant, disabled, pressed, hovered]);

  const sizeClass = styles[`size_${size}`];
  const textColor = variant === 'ghost'
    ? 'var(--color-text-main)'
    : variant === 'primary' || variant === 'secondary' || variant === 'danger'
      ? '#fff'
      : 'var(--color-text-main)';

  return (
    <button
      ref={containerRef}
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${styles.btn} ${sizeClass} ${fullWidth ? styles.fullWidth : ''} ${className}`}
      style={{ color: disabled ? '#888' : textColor, ...style }}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => !disabled && setPressed(true)}
      onMouseUp={() => setPressed(false)}
    >
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
      <span className={styles.label}>{children}</span>
    </button>
  );
}

function adjustBrightness(cssColor, amount) {
  // Simple: return the color as-is for CSS variables; direct colors get adjusted
  if (cssColor.startsWith('var(') || cssColor.startsWith('rgba')) return cssColor;
  return cssColor;
}
