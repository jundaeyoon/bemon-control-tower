import { useState, useEffect, useRef } from 'react';
import RoughInput  from '../rough/RoughInput';
import RoughButton from '../rough/RoughButton';
import { getMemberColor } from '../../constants/memberColors';
import styles from './AddProjectModal.module.css';

const MEMBERS = ['JUN', 'SURI', 'SUNNY!', 'LENA'];

export default function AddProjectModal({ onAdd, onClose }) {
  const [name, setName] = useState('');
  const [pm,   setPm]   = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const el = inputRef.current?.querySelector('input');
    el?.focus();
  }, []);

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd({ name: trimmed, pm });
    onClose();
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') handleSubmit();
    if (e.key === 'Escape') onClose();
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()} onKeyDown={handleKey}>
        <h3 className={styles.title}>새 프로젝트</h3>

        <div ref={inputRef}>
          <RoughInput
            label="프로젝트 이름"
            placeholder="예: 브랜드 캠페인"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <span className={styles.label}>프로젝트 대장 (PM)</span>
          <div className={styles.memberGroup}>
            {MEMBERS.map(m => {
              const mc = getMemberColor(m);
              const active = pm === m;
              return (
                <button
                  key={m}
                  className={`${styles.memberBtn} ${active ? styles.memberActive : ''}`}
                  style={{
                    borderColor: active ? mc.border : 'var(--color-border)',
                    color:       active ? mc.text   : 'var(--color-text-sub)',
                    background:  active ? mc.bg     : 'transparent',
                  }}
                  onClick={() => setPm(prev => prev === m ? null : m)}
                >
                  {m}
                </button>
              );
            })}
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
