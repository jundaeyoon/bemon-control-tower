import { useState } from 'react';
import styles from './PriorityModal.module.css';

export default function PriorityModal({ member, mc, items, onSave, onClose }) {
  const [order,     setOrder]     = useState(items);
  const [dragIndex, setDragIndex] = useState(null);
  const [dirty,     setDirty]     = useState(false);
  const [saving,    setSaving]    = useState(false);

  const handleDragStart = (index) => (e) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (index) => (e) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    setOrder(prev => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(index, 0, moved);
      return next;
    });
    setDragIndex(index);
    setDirty(true);
  };

  const handleDragEnd = () => setDragIndex(null);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(order);
      setDirty(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.title}>🔥 {member}의 우선순위</span>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.hint}>드래그해서 순서를 바꿔보세요. 맨 위가 1순위예요.</div>

        <div className={styles.list}>
          {order.length === 0 ? (
            <p className={styles.empty}>진행중인 업무가 없습니다</p>
          ) : (
            order.map((item, i) => (
              <div
                key={item.key}
                className={`${styles.row} ${dragIndex === i ? styles.rowDragging : ''}`}
                draggable
                onDragStart={handleDragStart(i)}
                onDragOver={handleDragOver(i)}
                onDragEnd={handleDragEnd}
              >
                <span className={styles.rank} style={{ background: mc.border }}>{i + 1}</span>
                <span className={styles.handle}>⠿</span>
                <div className={styles.textGroup}>
                  <span className={styles.name}>{item.title}</span>
                  {item.projectName && (
                    <span className={styles.projectTag}>📂 {item.projectName}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onClose}>닫기</button>
          <button
            className={styles.saveBtn}
            style={{ background: mc.border }}
            onClick={handleSave}
            disabled={saving || !dirty}
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}
