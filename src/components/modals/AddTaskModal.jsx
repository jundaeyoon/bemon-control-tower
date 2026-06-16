import { useState, useEffect, useRef } from 'react';
import RoughInput  from '../rough/RoughInput';
import RoughButton from '../rough/RoughButton';
import { getMemberColor } from '../../constants/memberColors';
import styles from './AddTaskModal.module.css';

const MEMBERS = ['JUN', 'SURI', 'SUNNY!', 'ZIN', 'LENA'];

export default function AddTaskModal({ projectName, onAdd, onClose }) {
  const [name,     setName]     = useState('');
  const [assignee, setAssignee] = useState('JUN');
  const [deadline, setDeadline] = useState('');
  const [progress, setProgress] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    const el = inputRef.current?.querySelector('input');
    el?.focus();
  }, []);

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd({ name: trimmed, assignee, deadline, progress: Number(progress) });
    onClose();
  };

  const handleKey = (e) => {
    if (e.key === 'Escape') onClose();
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()} onKeyDown={handleKey}>
        <div className={styles.header}>
          <h3 className={styles.title}>새 작업</h3>
          {projectName && <span className={styles.projectBadge}>{projectName}</span>}
        </div>

        <div ref={inputRef}>
          <RoughInput
            label="작업 이름"
            placeholder="예: 로고 시안 제작"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <span className={styles.label}>담당자</span>
          <div className={styles.memberGroup}>
            {MEMBERS.map(m => {
              const mc = getMemberColor(m);
              return (
              <button
                key={m}
                className={`${styles.memberBtn} ${assignee === m ? styles.memberActive : ''}`}
                style={{
                  borderColor: assignee === m ? mc.border : 'var(--color-border)',
                  color:       assignee === m ? mc.text   : 'var(--color-text-sub)',
                  background:  assignee === m ? mc.bg     : 'transparent',
                }}
                onClick={() => setAssignee(m)}
              >
                {m}
              </button>
              );
            })}
          </div>
        </div>

        <div className={styles.row}>
          <RoughInput
            label="마감일"
            type="date"
            value={deadline}
            onChange={e => setDeadline(e.target.value)}
          />
          <div className={styles.progressField}>
            <span className={styles.label}>진행률</span>
            <div className={styles.progressRow}>
              <input
                type="range"
                min={0}
                max={100}
                value={progress}
                onChange={e => setProgress(e.target.value)}
                className={styles.slider}
              />
              <span className={styles.progressVal} style={{ color: getMemberColor(assignee).text }}>
                {progress}%
              </span>
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <RoughButton variant="ghost" onClick={onClose}>취소</RoughButton>
          <RoughButton variant="secondary" onClick={handleSubmit} disabled={!name.trim()}>추가</RoughButton>
        </div>
      </div>
    </div>
  );
}
