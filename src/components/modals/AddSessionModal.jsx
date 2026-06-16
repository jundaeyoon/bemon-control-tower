import { useState, useEffect, useRef } from 'react';
import RoughInput  from '../rough/RoughInput';
import RoughButton from '../rough/RoughButton';
import styles from './AddProjectModal.module.css';

export default function AddSessionModal({ onAdd, onClose }) {
  const [title, setTitle] = useState('');
  const [date,  setDate]  = useState(new Date().toISOString().slice(0, 10));
  const inputRef = useRef(null);

  useEffect(() => {
    const el = inputRef.current?.querySelector('input');
    el?.focus();
  }, []);

  const handleSubmit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    onAdd({ title: trimmed, date });
    onClose();
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') handleSubmit();
    if (e.key === 'Escape') onClose();
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()} onKeyDown={handleKey}>
        <h3 className={styles.title}>새 브레인스토밍 세션</h3>

        <div ref={inputRef}>
          <RoughInput
            label="세션 제목"
            placeholder="예: 6월 3주차 회의"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>

        <RoughInput
          label="날짜"
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
        />

        <div className={styles.actions}>
          <RoughButton variant="ghost" onClick={onClose}>취소</RoughButton>
          <RoughButton variant="secondary" onClick={handleSubmit} disabled={!title.trim()}>추가</RoughButton>
        </div>
      </div>
    </div>
  );
}
