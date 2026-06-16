import { useEffect, useRef } from 'react';
import rough from 'roughjs';
import { Handle, Position } from '@xyflow/react';

const H_STYLE = { opacity: 0, width: 1, height: 1, background: 'transparent', border: 'none' };

export default function CenterNode() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const rc = rough.canvas(canvas);
    rc.circle(75, 75, 134, {
      fill: '#6B7C45',
      fillStyle: 'solid',
      stroke: '#4A3728',
      strokeWidth: 2.5,
      roughness: 2.8,
      bowing: 2.5,
      seed: 11,
    });
  }, []);

  return (
    <div style={{ position: 'relative', width: 150, height: 150 }}>
      <canvas
        ref={canvasRef}
        width={150}
        height={150}
        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', display: 'block' }}
      />
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none',
      }}>
        <span style={{
          color: '#fff',
          fontWeight: 800,
          fontSize: 22,
          letterSpacing: 4,
          fontFamily: "'Pretendard', sans-serif",
          fontWeight: 400,
          textShadow: '0 1px 3px rgba(0,0,0,0.25)',
        }}>
          BEMON
        </span>
      </div>
      <Handle type="source" position={Position.Top}    style={H_STYLE} />
      <Handle type="source" position={Position.Right}  style={H_STYLE} />
      <Handle type="source" position={Position.Bottom} style={H_STYLE} />
      <Handle type="source" position={Position.Left}   style={H_STYLE} />
    </div>
  );
}
