import { Handle, Position } from '@xyflow/react';
import { useEffect, useRef, useState } from 'react';
import rough from 'roughjs';
import styles from './QuestNode.module.css';

export const QUEST_W = 190;
export const QUEST_H = 62;

const HANDLE = { opacity: 0, background: 'transparent', border: 'none', width: 8, height: 8, minWidth: 0, minHeight: 0 };

const FILL       = 'rgba(180,130,30,0.62)';
const FILL_HOVER = 'rgba(180,130,30,0.84)';
const STROKE     = '#B8903A';

function fmtMonth(ym) {
  const [y, m] = ym.split('-');
  return `${y}.${parseInt(m)}`;
}

export default function QuestNode({ data }) {
  const canvasRef = useRef(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = QUEST_W * dpr;
    canvas.height = QUEST_H * dpr;
    canvas.style.width  = `${QUEST_W}px`;
    canvas.style.height = `${QUEST_H}px`;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, QUEST_W, QUEST_H);

    const rc = rough.canvas(canvas);
    const pad = 3;
    const seed = (data.yearMonth ?? 'q').charCodeAt(2) + 10;

    rc.rectangle(pad, pad, QUEST_W - pad * 2, QUEST_H - pad * 2, {
      fill: hovered ? FILL_HOVER : FILL,
      fillStyle: 'solid',
      stroke: STROKE,
      strokeWidth: hovered ? 2.0 : 1.5,
      roughness: 1.3,
      bowing: 0.5,
      seed,
    });
    // 내부 이중 테두리 (ProjectNode 스타일)
    rc.rectangle(pad + 3, pad + 3, QUEST_W - (pad + 3) * 2, QUEST_H - (pad + 3) * 2, {
      fill: 'none',
      stroke: `${STROKE}33`,
      strokeWidth: 0.7,
      roughness: 1.6,
      bowing: 0.6,
      seed: seed + 5,
    });
  }, [hovered, data.yearMonth]);

  return (
    <div
      className={`${styles.node} ${hovered ? styles.hovered : ''}`}
      style={{ width: QUEST_W, height: QUEST_H }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />

      <div className={styles.content}>
        <span className={styles.date}>{fmtMonth(data.yearMonth)}</span>
        <span className={styles.label}>{data.quest}</span>
      </div>

      <Handle type="target" position={Position.Top}    id="tt" style={HANDLE} />
      <Handle type="source" position={Position.Bottom} id="sb" style={HANDLE} />
    </div>
  );
}
