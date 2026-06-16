import { Handle, Position } from '@xyflow/react';
import { useEffect, useRef, useState } from 'react';
import rough from 'roughjs';
import { useMindmapActions } from '../../../contexts/MindmapActionsContext';
import styles from './SessionNode.module.css';

export const SESSION_W = 190;
export const SESSION_H = 58;

const HANDLE = { opacity: 0, background: 'transparent', border: 'none', width: 8, height: 8, minWidth: 0, minHeight: 0 };

const FILL       = 'rgba(80,100,65,0.62)';
const FILL_HOVER = 'rgba(80,100,65,0.80)';
const STROKE     = '#4E5E42';

export default function SessionNode({ data }) {
  const canvasRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const actions = useMindmapActions();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = SESSION_W * dpr;
    canvas.height = SESSION_H * dpr;
    canvas.style.width  = `${SESSION_W}px`;
    canvas.style.height = `${SESSION_H}px`;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, SESSION_W, SESSION_H);

    const rc = rough.canvas(canvas);
    const pad = 3;
    const seed = (data.title ?? 's').charCodeAt(0);

    rc.rectangle(pad, pad, SESSION_W - pad * 2, SESSION_H - pad * 2, {
      fill: hovered ? FILL_HOVER : FILL,
      fillStyle: 'solid',
      stroke: STROKE,
      strokeWidth: hovered ? 2.0 : 1.5,
      roughness: 1.3,
      bowing: 0.5,
      seed,
    });
  }, [hovered, data.title]);

  return (
    <div
      className={`${styles.node} ${hovered ? styles.hovered : ''}`}
      style={{ width: SESSION_W, height: SESSION_H }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />

      <div className={styles.content}>
        <span className={styles.date}>{data.date}</span>
        <span className={styles.label}>{data.title}</span>
      </div>

      {hovered && (
        <button
          className={styles.deleteBtn}
          onClick={e => {
            e.stopPropagation();
            if (window.confirm(`"${data.title}" 세션을 삭제할까요?`)) {
              actions?.onDeleteSession(data.id);
            }
          }}
          title="세션 삭제"
        >✕</button>
      )}

      <Handle type="target" position={Position.Top}    id="tt" style={HANDLE} />
      <Handle type="source" position={Position.Bottom} id="sb" style={HANDLE} />
    </div>
  );
}
