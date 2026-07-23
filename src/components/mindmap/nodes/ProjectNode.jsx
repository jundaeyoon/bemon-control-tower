import { Handle, Position } from '@xyflow/react';
import { useEffect, useRef, useState } from 'react';
import rough from 'roughjs';
import { useMindmapActions } from '../../../contexts/MindmapActionsContext';
import { getMemberColor, getMemberInitial } from '../../../constants/memberColors';
import styles from './ProjectNode.module.css';

export const PROJECT_W = 170;
export const PROJECT_H = 54;

const HANDLE = { opacity: 0, background: 'transparent', border: 'none', width: 8, height: 8, minWidth: 0, minHeight: 0 };

const FILL         = 'rgba(230,190,175,0.55)';
const FILL_HOVER   = 'rgba(230,190,175,0.75)';
const STROKE       = '#C06850';
const FILL_DONE    = 'rgba(180,220,182,0.55)';
const FILL_DONE_HV = 'rgba(180,220,182,0.75)';
const STROKE_DONE  = '#388E3C';

export default function ProjectNode({ data }) {
  const canvasRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const actions = useMindmapActions();

  const pmMc = data.pm ? getMemberColor(data.pm) : null;
  const isCompleted = data.tasks?.length > 0 && data.tasks.every(t => t.completed);

  const fill   = isCompleted ? (hovered ? FILL_DONE_HV : FILL_DONE) : (hovered ? FILL_HOVER : FILL);
  const stroke = isCompleted ? STROKE_DONE : STROKE;

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
      fill,
      fillStyle: 'solid',
      stroke,
      strokeWidth: hovered || data.isExpanded ? 2.0 : 1.5,
      roughness: 0.8,
      bowing: 0.25,
      seed,
    });
    rc.rectangle(pad + 3, pad + 3, PROJECT_W - (pad + 3) * 2, PROJECT_H - (pad + 3) * 2, {
      fill: 'none',
      stroke: `${stroke}1f`,
      strokeWidth: 0.6,
      roughness: 1.0,
      bowing: 0.3,
      seed: seed + 5,
    });
  }, [hovered, data.isExpanded, data.name, fill, stroke]);

  return (
    <div
      className={`${styles.node} ${hovered ? styles.hovered : ''}`}
      style={{ width: PROJECT_W, height: PROJECT_H }}
      title={data.description || undefined}
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
        {!pmMc && data.description && (
          <span className={styles.descPreview}>{data.description}</span>
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

      {isCompleted && (
        <>
          <button
            className={styles.feedbackBtn}
            onClick={e => { e.stopPropagation(); actions?.onRequestFeedback(data.id, data.name); }}
            title="프로젝트 피드백 작성"
          >🎊 피드백</button>
          {!data.archived && (
            <button
              className={styles.archiveBtn}
              onClick={e => {
                e.stopPropagation();
                if (window.confirm(`"${data.name}"을 프로젝트 완수!로 이동할까요?`)) {
                  actions?.onArchiveProject(data.id);
                }
              }}
              title="프로젝트 완수! 브랜치로 이동"
            >📦 보관하기</button>
          )}
        </>
      )}

      <Handle type="target" position={Position.Right} id="tr" style={HANDLE} />
      <Handle type="source" position={Position.Left}  id="sl" style={HANDLE} />
    </div>
  );
}
