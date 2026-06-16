import { Handle, Position } from '@xyflow/react';
import { useEffect, useRef, useState } from 'react';
import rough from 'roughjs';
import RoughStrikethrough from '../../rough/RoughStrikethrough';
import { useMindmapActions } from '../../../contexts/MindmapActionsContext';
import { getMemberColor } from '../../../constants/memberColors';
import styles from './TaskNode.module.css';

export const TASK_W = 255;
export const TASK_H = 70;

const HANDLE = { opacity: 0, background: 'transparent', border: 'none', width: 6, height: 6, minWidth: 0, minHeight: 0 };

export default function TaskNode({ data }) {
  const canvasRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const actions = useMindmapActions();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = TASK_W * dpr;
    canvas.height = TASK_H * dpr;
    canvas.style.width  = `${TASK_W}px`;
    canvas.style.height = `${TASK_H}px`;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, TASK_W, TASK_H);

    const rc = rough.canvas(canvas);
    const pad = 2;
    const seed = (data.name ?? 't').charCodeAt(0);

    rc.rectangle(pad, pad, TASK_W - pad * 2, TASK_H - pad * 2, {
      fill: data.completed ? 'rgba(168,168,168,0.22)' : (hovered ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.78)'),
      fillStyle: 'solid',
      stroke: data.completed ? '#BBBBB0' : (hovered ? 'rgba(26,26,26,0.20)' : 'rgba(26,26,26,0.12)'),
      strokeWidth: hovered ? 1.6 : 1.2,
      roughness: 1.1,
      bowing: 0.4,
      seed,
    });
  }, [hovered, data.completed, data.name]);

  const handleCheck = (e) => {
    e.stopPropagation();
    actions?.onToggleTask(data.projectId, data.id);
  };

  const mc = getMemberColor(data.assignee);

  return (
    <div
      className={`${styles.node} ${hovered ? styles.hovered : ''} ${data.completed ? styles.done : ''}`}
      style={{ width: TASK_W, height: TASK_H }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
      <div className={styles.content}>

        {/* Complete toggle */}
        <button
          className={`${styles.check} ${data.completed ? styles.checkDone : ''}`}
          style={{ borderColor: mc.border, color: data.completed ? mc.text : 'transparent' }}
          onClick={handleCheck}
          title={data.completed ? '완료 취소' : '완료'}
        >
          {data.completed && '✓'}
        </button>

        {/* Name + strikethrough */}
        <div className={styles.body}>
          <RoughStrikethrough done={data.completed}>
            <span className={styles.name}>{data.name}</span>
          </RoughStrikethrough>
          <div className={styles.meta}>
            {data.deadline && <span className={styles.deadline}>{data.deadline?.slice(5)}</span>}
            {data.progress != null && (
              <span className={styles.progress} style={{ color: mc.text }}>{data.progress}%</span>
            )}
            {data.images?.length > 0 && (
              <span className={styles.imageCount}>📎 {data.images.length}</span>
            )}
          </div>
        </div>

        {/* Assignee: circle initial + name */}
        {data.assignee && (
          <div className={styles.assignee}>
            <div className={styles.avatar} style={{ background: mc.bg, color: mc.text, borderColor: mc.border }}>
              {data.assignee[0]}
            </div>
            <span className={styles.assigneeName}>{data.assignee}</span>
          </div>
        )}
      </div>

      <Handle type="target" position={Position.Right} id="tr" style={HANDLE} />
    </div>
  );
}
