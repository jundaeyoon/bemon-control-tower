import { useEffect, useRef } from 'react';
import rough from 'roughjs';
import { Handle, Position } from '@xyflow/react';

const W = 172;
const H = 62;
const H_STYLE = { opacity: 0, width: 1, height: 1, background: 'transparent', border: 'none' };

export default function BranchNode({ data, selected }) {
  const canvasRef = useRef(null);
  const { label, color, handlePosition = Position.Left } = data;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const rc = rough.canvas(canvas);
    rc.rectangle(5, 5, W - 10, H - 10, {
      fill: color,
      fillStyle: 'solid',
      stroke: selected ? '#fff' : '#4A3728',
      strokeWidth: selected ? 2.8 : 2,
      roughness: 2.5,
      bowing: 2,
      seed: label.charCodeAt(0),
    });
  }, [color, label, selected]);

  return (
    <div style={{ position: 'relative', width: W, height: H, cursor: 'pointer' }}>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', display: 'block' }}
      />
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none',
      }}>
        <span style={{
          color: '#fff',
          fontWeight: 700,
          fontSize: 14,
          fontFamily: "'Pretendard', sans-serif",
          fontWeight: 400,
          letterSpacing: 1,
          textShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }}>
          {label}
        </span>
      </div>
      <Handle type="target" position={handlePosition}          style={H_STYLE} />
      <Handle type="source" position={handlePosition} id="s"   style={H_STYLE} />
    </div>
  );
}
