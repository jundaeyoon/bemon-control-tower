import { useEffect, useRef, useState } from 'react';
import rough from 'roughjs';
import styles from './RoughInput.module.css';

export default function RoughInput({
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  autoComplete,
  name,
  id,
  required,
  className = '',
}) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const [focused, setFocused] = useState(false);

  const draw = (isFocused, hasError) => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const w = wrap.offsetWidth;
    const h = wrap.offsetHeight;

    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    canvas.width = w * dpr;
    canvas.height = h * dpr;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const rc = rough.canvas(canvas);
    const pad = 1.5;

    const strokeColor = hasError
      ? 'var(--color-warning)'
      : isFocused
        ? 'var(--color-mustard)'
        : 'rgba(26,26,26,0.2)';

    rc.rectangle(pad, pad, w - pad * 2, h - pad * 2, {
      fill: '#FAFAF8',
      fillStyle: 'solid',
      stroke: strokeColor,
      strokeWidth: isFocused ? 2 : 1.4,
      roughness: 1.3,
      bowing: 0.5,
      seed: 8,
    });
  };

  useEffect(() => {
    draw(focused, !!error);
    const observer = new ResizeObserver(() => draw(focused, !!error));
    if (wrapRef.current) observer.observe(wrapRef.current);
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focused, error]);

  return (
    <div className={`${styles.field} ${className}`}>
      {label && (
        <label htmlFor={id ?? name} className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      <div ref={wrapRef} className={styles.inputWrap}>
        <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
        <input
          id={id ?? name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={(e) => { setFocused(false); onBlur?.(e); }}
          onFocus={() => setFocused(true)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          className={styles.input}
        />
      </div>
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}
