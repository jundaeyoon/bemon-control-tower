import { Handle, Position } from '@xyflow/react';
import { useEffect, useRef, useState } from 'react';
import rough from 'roughjs';
import { useMindmapActions } from '../../../contexts/MindmapActionsContext';
import { getMemberColor, getMemberInitial } from '../../../constants/memberColors';
import styles from './ProjectNode.module.css';

export const PROJECT_W = 170;
export const PROJECT_H = 54;

const HANDLE = { opacity: 0, background: 'transparent', border: 'none', width: 8, height: 8, minWidth: 0, minHeight: 0 };

const FILL       = 'rgba(180,100,75,0.62)';
const FILL_HOVER = 'rgba(180,100,75,0.80)';
const STROKE     = '#C06850';

export default function ProjectNode({ data }) {
  const canvasRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const actions = useMindmapActions();

  const pmMc = data.pm ? getMemberColor(data.pm) : null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = PROJECT_W * dpr;
    canvas.height = PROJECT_H * dpr;
    canvas.style.width  = `${PROJECT_W}px`;
    canvas.style.height = `${PROJECT_H}px`;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, PROJECT_W, PROJECT_H);

    const rc = rough.canvas(canvas);
    const pad = 3;
    const seed = (data.name ?? 'p').charCodeAt(0);

    rc.rectangle(pad, pad, PROJECT_W - pad * 2, PROJECT_H - pad * 2, {
      fill: hovered ? FILL_HOVER : FILL,
      fillStyle: 'solid',
      stroke: STROKE,
      strokeWidth: hovered || data.isExpanded ? 2.0 : 1.5,
      roughness: 1.3,
      bowing: 0.5,
      seed,
    });
    rc.rectangle(pad + 3, pad + 3, PROJECT_W - (pad + 3) * 2, PROJECT_H - (pad + 3) * 2, {
      fill: 'none',
      stroke: `${STROKE}33`,
      strokeWidth: 0.7,
      roughness: 1.6,
      bowing: 0.6,
      seed: seed + 5,
    });
  }, [hovered, data.isExpanded, data.name]);

  return (
    <div
      className={`${styles.node} ${hovered ? styles.hovered : ''}`}
      style={{ width: PROJECT_W, height: PROJECT_H }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />

      <div className={styles.content}>
        <div className={styles.topRow}>
          <span className={styles.label}>{data.name}</span>
          {data.tasks?.length > 0 && (
            <span className={styles.count}>{data.tasks.filter(t => t.completed).length}/{data.tasks.length}</span>
          )}
          <span className={`${styles.chevron} ${data.isExpanded ? styles.chevronOpen : ''}`}>‹</span>
        </div>
        {pmMc && (
          <div className={styles.pmRow}>
            <div
              className={styles.pmAvatar}
              style={{ background: pmMc.bg, color: pmMc.text, borderColor: pmMc.border }}
            >
              {getMemberInitial(data.pm)}
            </div>
            <span className={styles.pmName}>{data.pm}</span>
          </div>
        )}
      </div>

      <button
        className={styles.addBtn}
        onClick={e => { e.stopPropagation(); actions?.onRequestAddTask(data.id); }}
        title="작업 추가"
      >+</button>

      {hovered && (
        <>
          <button
            className={styles.editBtn}
            onClick={e => { e.stopPropagation(); actions?.onEditProject(data.id); }}
            title="프로젝트 수정"
          >✎</button>
          <button
            className={styles.deleteBtn}
            onClick={e => {
              e.stopPropagation();
              if (window.confirm(`"${data.name}" 프로젝트를 삭제할까요?`)) {
                actions?.onDeleteProject(data.id);
              }
            }}
            title="프로젝트 삭제"
          >✕</button>
        </>
      )}

      <Handle type="target" position={Position.Right} id="tr" style={HANDLE} />
      <Handle type="source" position={Position.Left}  id="sl" style={HANDLE} />
    </div>
  );
}
