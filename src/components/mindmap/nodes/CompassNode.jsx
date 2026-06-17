import { Handle, Position } from '@xyflow/react';
import { useEffect, useRef, useState } from 'react';
import rough from 'roughjs';
import styles from './CompassNode.module.css';

export const COMPASS_W = 190;
export const COMPASS_H = 58;

const HANDLE = {
  opacity: 0,
  background: 'transparent',
  border: 'none',
  width: 8,
  height: 8,
  minWidth: 0,
  minHeight: 0,
};

const ITEM_CONFIG = {
  mission:     { emoji: '🌍', label: '미션',       fill: 'rgba(75,105,65,0.70)',  fillH: 'rgba(75,105,65,0.88)',  stroke: '#4E7040' },
  team_spirit: { emoji: '🔥', label: 'Team Spirit', fill: 'rgba(180,90,40,0.70)',  fillH: 'rgba(180,90,40,0.88)',  stroke: '#B85828' },
  jun_promise: { emoji: '🌴', label: "JUN의 약속",  fill: 'rgba(0,130,160,0.70)',  fillH: 'rgba(0,130,160,0.88)',  stroke: '#0082A0' },
  vision:      { emoji: '🌟', label: '비전',        fill: 'rgba(90,110,48,0.70)',  fillH: 'rgba(90,110,48,0.88)',  stroke: '#637A35' },
  competency:  { emoji: '💪', label: '핵심역량',    fill: 'rgba(90,110,48,0.65)',  fillH: 'rgba(90,110,48,0.82)',  stroke: '#637A35' },
  values:      { emoji: '⚡', label: '핵심가치',    fill: 'rgba(90,110,48,0.65)',  fillH: 'rgba(90,110,48,0.82)',  stroke: '#637A35' },
};

export default function CompassNode({ data }) {
  const canvasRef = useRef(null);
  const [hovered, setHovered] = useState(false);

  const cfg = ITEM_CONFIG[data.kind] ?? ITEM_CONFIG.vision;
  const preview = data.kind === 'jun_promise'
    ? '하와이 워크샵 약속 🌺'
    : (data.text?.trim()
        ? data.text.trim().slice(0, 28) + (data.text.trim().length > 28 ? '…' : '')
        : null);

  const seed = cfg.label.charCodeAt(0) + 20;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = COMPASS_W * dpr;
    canvas.height = COMPASS_H * dpr;
    canvas.style.width  = `${COMPASS_W}px`;
    canvas.style.height = `${COMPASS_H}px`;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, COMPASS_W, COMPASS_H);

    const rc = rough.canvas(canvas);
    const pad = 3;
    rc.rectangle(pad, pad, COMPASS_W - pad * 2, COMPASS_H - pad * 2, {
      fill: hovered ? cfg.fillH : cfg.fill,
      fillStyle: 'solid',
      stroke: cfg.stroke,
      strokeWidth: hovered ? 2.0 : 1.5,
      roughness: 1.2,
      bowing: 0.5,
      seed,
    });
    rc.rectangle(pad + 4, pad + 4, COMPASS_W - (pad + 4) * 2, COMPASS_H - (pad + 4) * 2, {
      fill: 'none',
      stroke: `${cfg.stroke}44`,
      strokeWidth: 0.7,
      roughness: 1.8,
      seed: seed + 3,
    });
  }, [hovered, cfg, seed]);

  return (
    <div
      className={`${styles.node} ${hovered ? styles.hovered : ''}`}
      style={{ width: COMPASS_W, height: COMPASS_H, '--shadow-color': cfg.stroke }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
      <div className={styles.content}>
        <div className={styles.header}>
          <span className={styles.emoji}>{cfg.emoji}</span>
          <span className={styles.label}>{cfg.label}</span>
        </div>
        <span className={`${styles.preview} ${!preview ? styles.empty : ''}`}>
          {preview ?? '아직 비어있어요'}
        </span>
      </div>

      <Handle type="target" position={Position.Top}    id="tt" style={HANDLE} />
      <Handle type="target" position={Position.Left}   id="tl" style={HANDLE} />
      <Handle type="source" position={Position.Bottom} id="sb" style={HANDLE} />
      <Handle type="source" position={Position.Right}  id="sr" style={HANDLE} />
    </div>
  );
}
