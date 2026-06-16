import { useState } from 'react';
import RoughButton from '../rough/RoughButton';
import { getMemberColor } from '../../constants/memberColors';
import styles from './TodoDetailModal.module.css';

const MEMBERS = ['JUN', 'SURI', 'SUNNY!', 'JIN', 'LENA'];

const STATUS_OPTIONS = [
  { id: 'todo',  label: '할일',   color: '#9C9C94' },
  { id: 'doing', label: '진행중', color: '#C06850' },
  { id: 'done',  label: '완료',   color: '#4E5E42' },
];

export default function TodoDetailModal({ todo, onSave, onDelete, onClose }) {
  const [assignee, setAssignee] = useState(todo.assignee ?? null);
  const [status,   setStatus]   = useState(todo.status ?? 'todo');
  const [memo,     setMemo]     = useState(todo.memo ?? '');

  const handleSave = () => {
    onSave(todo.id, { assignee, status, memo });
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm('이 할일을 삭제할까요?')) {
      onDelete(todo.id);
      onClose();
    }
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h3 className={styles.title}>{todo.content}</h3>

        <div className={styles.field}>
          <span className={styles.label}>담당자</span>
          <div className={styles.memberGroup}>
            {MEMBERS.map(m => {
              const mc = getMemberColor(m);
              const active = assignee === m;
              return (
                <button
                  key={m}
                  className={`${styles.memberBtn} ${active ? styles.memberActive : ''}`}
                  style={{
                    borderColor: active ? mc.border : 'var(--color-border)',
                    color:       active ? mc.text   : 'var(--color-text-sub)',
                    background:  active ? mc.bg     : 'transparent',
                  }}
                  onClick={() => setAssignee(prev => prev === m ? null : m)}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>

        <div className={styles.field}>
          <span className={styles.label}>진행상태</span>
          <div className={styles.statusGroup}>
            {STATUS_OPTIONS.map(s => (
              <button
                key={s.id}
                className={styles.statusBtn}
                style={{
                  borderColor: s.color,
                  color:      status === s.id ? '#fff' : s.color,
                  background: status === s.id ? s.color : 'transparent',
                }}
                onClick={() => setStatus(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.field}>
          <span className={styles.label}>메모</span>
          <textarea
            className={styles.memoTextarea}
            value={memo}
            placeholder="관련 메모를 입력하세요..."
            onChange={e => setMemo(e.target.value)}
          />
        </div>

        <div className={styles.actions}>
          <RoughButton variant="danger" size="sm" onClick={handleDelete}>삭제</RoughButton>
          <div className={styles.actionRight}>
            <RoughButton variant="ghost" size="sm" onClick={onClose}>취소</RoughButton>
            <RoughButton variant="secondary" size="sm" onClick={handleSave}>저장</RoughButton>
          </div>
        </div>
      </div>
    </div>
  );
}
