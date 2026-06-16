import { useMemo } from 'react';
import rough from 'roughjs';

// Generate rough SVG path data from source to target
function makeRoughPaths(x1, y1, x2, y2, color, seed) {
  try {
    const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const rc = rough.svg(svgEl);

    // Compute a gentle perpendicular bow for organic feel
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const bow = Math.min(len * 0.12, 28);
    const perpX = (-dy / len) * bow;
    const perpY = (dx / len) * bow;

    // Midpoint with bow offset (deterministic based on seed parity)
    const bowDir = seed % 2 === 0 ? 1 : -1;
    const mx = (x1 + x2) / 2 + perpX * bowDir;
    const my = (y1 + y2) / 2 + perpY * bowDir;

    const group = rc.curve(
      [[x1, y1], [mx, my], [x2, y2]],
      {
        stroke: color,
        strokeWidth: 1.9,
        roughness: 1.6,
        bowing: 1.1,
        seed,
        fill: 'none',
        fillStyle: 'solid',
      }
    );

    return Array.from(group.children).map(child => ({
      d:           child.getAttribute('d') ?? '',
      stroke:      child.getAttribute('stroke') ?? color,
      strokeWidth: child.getAttribute('stroke-width') ?? '1.9',
      fill:        'none',
      opacity:     child.getAttribute('opacity') ?? '1',
    }));
  } catch {
    return [];
  }
}

export default function RoughEdge({
  id,
  sourceX, sourceY,
  targetX, targetY,
  data,
}) {
  const color = data?.color ?? 'rgba(26,26,26,0.25)';
  const seed  = data?.seed  ?? 1;

  const paths = useMemo(
    () => makeRoughPaths(sourceX, sourceY, targetX, targetY, color, seed),
    // Recalculate only when geometry changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sourceX, sourceY, targetX, targetY, color, seed]
  );

  return (
    <g id={id} style={{ pointerEvents: 'none' }}>
      {paths.map((p, i) => (
        <path
          key={i}
          d={p.d}
          stroke={p.stroke}
          strokeWidth={p.strokeWidth}
          fill="none"
          opacity={p.opacity}
          strokeLinecap="round"
        />
      ))}
    </g>
  );
}
