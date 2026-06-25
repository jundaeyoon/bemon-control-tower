import { Handle, Position } from '@xyflow/react';
import { useEffect, useRef, useState } from 'react';
import rough from 'roughjs';
import { useMindmapActions } from '../../../contexts/MindmapActionsContext';
import styles from './BranchNode.module.css';

const W = 190;
const H = 84;

const HANDLE = {
  opacity: 0,
  background: 'transparent',
  border: 'none',
  width: 8,
  height: 8,
  minWidth: 0,
  minHeight: 0,
};

const ACCENT_COLORS = {
  mustard: { fill: 'rgba(180,130,30,0.72)',  fillHover: 'rgba(180,130,30,0.86)', stroke: '#B8903A' },
  green:   { fill: 'rgba(80,100,65,0.72)',   fillHover: 'rgba(80,100,65,0.86)',  stroke: '#4E5E42' },
  olive:   { fill: 'rgba(90,110,48,0.72)',   fillHover: 'rgba(90,110,48,0.88)',  stroke: '#637A35' },
  neutral: { fill: 'rgba(110,110,110,0.68)', fillHover: 'rgba(110,110,110,0.82)', stroke: '#888888' },
  salmon:  { fill: 'rgba(180,100,75,0.72)',  fillHover: 'rgba(180,100,75,0.86)', stroke: '#C06850' },
  emerald: { fill: 'rgba(56,142,60,0.72)',   fillHover: 'rgba(56,142,60,0.86)',  stroke: '#388E3C' },
  sky:     { fill: 'rgba(2,132,199,0.72)',   fillHover: 'rgba(2,132,199,0.86)',  stroke: '#0284C7' },
  violet:  { fill: 'rgba(124,58,237,0.72)',  fillHover: 'rgba(124,58,237,0.86)', stroke: '#7C3AED' },
  coral:   { fill: 'rgba(232,137,106,0.72)', fillHover: 'rgba(232,137,106,0.86)', stroke: '#E8896A' },
  hotpink: { fill: 'rgba(236,72,153,0.72)',  fillHover: 'rgba(236,72,153,0.86)',  stroke: '#EC4899' },
  red:     { fill: 'rgba(239,68,68,0.72)',   fillHover: 'rgba(239,68,68,0.88)',   stroke: '#EF4444' },
};

export default function BranchNode({ data }) {
  const canvasRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const actions = useMindmapActions();

  const ac = ACCENT_COLORS[data.accent] ?? ACCENT_COLORS.neutral;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width  = `${W}px`;
    canvas.style.height = `${H}px`;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    const rc = rough.canvas(canvas);
    const pad = 3;

    rc.rectangle(pad, pad, W - pad * 2, H - pad * 2, {
      fill: hovered ? ac.fillHover : ac.fill,
      fillStyle: 'solid',
      stroke: ac.stroke,
      strokeWidth: hovered ? 2.2 : 1.7,
      roughness: 1.4,
      bowing: 0.6,
      seed: data.label.charCodeAt(0),
    });

    rc.rectangle(pad + 4, pad + 4, W - (pad + 4) * 2, H - (pad + 4) * 2, {
      fill: 'none',
      stroke: `${ac.stroke}44`,
      strokeWidth: 0.8,
      roughness: 1.8,
      bowing: 0.8,
      seed: data.label.charCodeAt(0) + 7,
    });
  }, [hovered, ac, data.label]);

  return (
    <div
      className={`${styles.node} ${hovered ? styles.hovered : ''}`}
      style={{ width: W, height: H, cursor: 'pointer' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
      <div className={styles.content}>
        <div className={styles.top}>
          <span className={styles.label}>{data.label}</span>
          <span className={styles.chevron}>
            {data.side === 'left' ? '‹' : '›'}
          </span>
        </div>
      </div>

      {data.addAction && (
        <button
          className={styles.addBtn}
          onClick={e => {
            e.stopPropagation();
            if (data.addAction === 'project') actions?.onRequestAddProject();
            if (data.addAction === 'session') actions?.onRequestAddSession();
            if (data.addAction === 'quest')   actions?.onRequestOpenQuest?.();
            if (data.addAction === 'compass') actions?.onRequestOpenCompass?.();
          }}
          title={
            data.addAction === 'project' ? '프로젝트 추가' :
            data.addAction === 'session' ? '세션 추가' :
            data.addAction === 'compass' ? '나침반 열기' :
            '퀘스트 작성'
          }
        >+</button>
      )}

      <Handle type="target" position={Position.Left}   id="tl" style={HANDLE} />
      <Handle type="target" position={Position.Right}  id="tr" style={HANDLE} />
      <Handle type="source" position={Position.Left}   id="sl" style={HANDLE} />
      <Handle type="source" position={Position.Right}  id="sr" style={HANDLE} />
    </div>
  );
}
