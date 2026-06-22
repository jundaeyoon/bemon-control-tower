import { Handle, Position } from '@xyflow/react';
import { useEffect, useRef, useState } from 'react';
import rough from 'roughjs';
import styles from './HubNode.module.css';

const W = 148;
const H = 108;

const HANDLE = {
  opacity: 0,
  background: 'transparent',
  border: 'none',
  width: 8,
  height: 8,
  minWidth: 0,
  minHeight: 0,
};

export default function HubNode({ data }) {
  const canvasRef = useRef(null);
  const [hovered, setHovered] = useState(false);

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

    rc.ellipse(W / 2, H / 2, W * 0.96, H * 0.96, {
      fill: 'rgba(107,124,92,0.07)',
      fillStyle: 'solid',
      stroke: 'none',
      roughness: 3.0,
      seed: 2,
    });

    rc.ellipse(W / 2, H / 2, W * 0.76, H * 0.78, {
      fill: hovered ? 'rgba(107,124,92,0.22)' : 'rgba(107,124,92,0.11)',
      fillStyle: 'solid',
      stroke: '#6B7C5C',
      strokeWidth: hovered ? 2.8 : 2.2,
      roughness: 1.7,
      bowing: 0.9,
      seed: 5,
    });

    rc.ellipse(W / 2, H / 2, W * 0.72, H * 0.74, {
      fill: 'none',
      stroke: 'rgba(107,124,92,0.3)',
      strokeWidth: 1.0,
      roughness: 2.2,
      bowing: 1.2,
      seed: 9,
    });
  }, [hovered]);

  return (
    <div
      className={`${styles.node} ${hovered ? styles.hovered : ''} ${data.isExpanded ? styles.expanded : ''}`}
      style={{ width: W, height: H, cursor: 'pointer' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
      <div className={styles.content}>
        <span className={styles.label} translate="no">BEMON</span>
        <span className={styles.sublabel} translate="no">{data.sublabel}</span>
      </div>
      {data.badgeCount > 0 && (
        <div className={styles.badge}>{data.badgeCount > 9 ? '9+' : data.badgeCount}</div>
      )}

      <Handle type="source" position={Position.Left}   id="left"   style={HANDLE} />
      <Handle type="source" position={Position.Right}  id="right"  style={HANDLE} />
      <Handle type="source" position={Position.Top}    id="top"    style={HANDLE} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={HANDLE} />
      <Handle type="target" position={Position.Left}   id="tl"     style={HANDLE} />
      <Handle type="target" position={Position.Right}  id="tr"     style={HANDLE} />
    </div>
  );
}
