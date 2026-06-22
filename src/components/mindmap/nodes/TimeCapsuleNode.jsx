import { Handle, Position } from '@xyflow/react';
import { useEffect, useRef, useState } from 'react';
import rough from 'roughjs';
import styles from './TimeCapsuleNode.module.css';

export const CAPSULE_W = 120;
export const CAPSULE_H = 150;

// Invisible handle style (no visual, just required by ReactFlow)
const HANDLE = { opacity: 0, background: 'transparent', border: 'none', width: 8, height: 8, minWidth: 0, minHeight: 0 };

function getNearestDday(capsules) {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const future = capsules
    .filter(c => new Date(c.open_date) >= now)
    .sort((a, b) => new Date(a.open_date) - new Date(b.open_date));
  if (!future.length) return null;
  const diff = Math.round((new Date(future[0].open_date) - now) / 86400000);
  if (diff === 0) return '🎉 오늘 개봉';
  return `D-${diff}`;
}

export default function TimeCapsuleNode({ data }) {
  const canvasRef = useRef(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = CAPSULE_W * dpr;
    canvas.height = CAPSULE_H * dpr;
    canvas.style.width  = `${CAPSULE_W}px`;
    canvas.style.height = `${CAPSULE_H}px`;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, CAPSULE_W, CAPSULE_H);

    const rc    = rough.canvas(canvas);
    const cx    = CAPSULE_W / 2; // 60
    const eW    = CAPSULE_W - 22; // ellipse width  = 98
    const eH    = 74;             // ellipse height (ry=37)
    const lidY  = 44;             // lid center Y
    const baseY = 108;            // base center Y

    // 1. Body fill (plain rect to plug gap between ellipses)
    ctx.fillStyle = hovered ? 'rgba(239,159,39,0.90)' : '#EF9F27';
    ctx.fillRect(11, lidY, eW, baseY - lidY);

    // 2. Base ellipse — body color
    rc.ellipse(cx, baseY, eW, eH, {
      fill:      hovered ? 'rgba(239,159,39,0.90)' : '#EF9F27',
      fillStyle: 'solid',
      stroke:    '#854F0B',
      strokeWidth: 1.8,
      roughness: 2.5,
      bowing:    2,
      seed:      42,
    });

    // 3. Side lines (straight connecting part)
    rc.line(11, lidY, 11, baseY, { stroke: '#854F0B', strokeWidth: 1.8, roughness: 2.0, bowing: 1.5, seed: 43 });
    rc.line(CAPSULE_W - 11, lidY, CAPSULE_W - 11, baseY, { stroke: '#854F0B', strokeWidth: 1.8, roughness: 2.0, bowing: 1.5, seed: 44 });

    // 4. Lid ellipse — cream color, drawn on top
    rc.ellipse(cx, lidY, eW, eH, {
      fill:      hovered ? 'rgba(250,238,218,0.96)' : '#FAEEDA',
      fillStyle: 'solid',
      stroke:    '#854F0B',
      strokeWidth: 1.8,
      roughness: 2.5,
      bowing:    2,
      seed:      40,
    });
  }, [hovered]);

  const dday = getNearestDday(data.capsules ?? []);

  return (
    <div
      className={`${styles.node} ${hovered ? styles.hovered : ''}`}
      style={{ width: CAPSULE_W, height: CAPSULE_H }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />

      {/* Text overlaid on lid (top area) */}
      <div className={styles.lid}>
        <span className={styles.emoji}>⏳</span>
        <span className={styles.label}>베몽 타임캡슐</span>
      </div>

      {/* D-day in body area */}
      {dday && (
        <div className={styles.dday}>{dday}</div>
      )}

      <Handle type="source" position={Position.Top}    id="top"    style={HANDLE} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={HANDLE} />
    </div>
  );
}
