import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import RoughInput  from '../rough/RoughInput';
import RoughButton from '../rough/RoughButton';
import { CATEGORIES, getCategoryColor } from '../../constants/footprintCategories';
import baseStyles from './AddProjectModal.module.css';

export default function AddFootprintModal({ onAdd, onClose }) {
  const [title,       setTitle]       = useState('');
  const [date,        setDate]        = useState(new Date().toISOString().slice(0, 10));
  const [category,    setCategory]    = useState(null);
  const [description, setDescription] = useState('');
  const [saving,      setSaving]      = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const el = inputRef.current?.querySelector('input');
    el?.focus();
  }, []);

  const canSubmit = title.trim() && date && category && !saving;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    await onAdd({ title: title.trim(), date, category, description: description.trim() || null });
    setSaving(false);
    onClose();
  };

  const handleKey = (e) => {
    if (e.key === 'Escape') onClose();
  };

  return createPortal(
    <div className={baseStyles.backdrop} onClick={onClose}>
      <div className={baseStyles.modal} onClick={e => e.stopPropagation()} onKeyDown={handleKey}>
        <h3 className={baseStyles.title}>🐾 새 발자국 남기기</h3>

        <div ref={inputRef}>
          <RoughInput
            label="제목"
            placeholder="예: 2026 여름 시즌 오픈"
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

        <div className={baseStyles.field}>
          <span className={baseStyles.label}>카테고리</span>
          <div className={baseStyles.memberGroup}>
            {CATEGORIES.map(cat => {
              const cc = getCategoryColor(cat);
              const active = category === cat;
              return (
                <button
                  key={cat}
                  className={`${baseStyles.memberBtn} ${active ? baseStyles.memberActive : ''}`}
                  style={{
                    borderColor: active ? cc.border : 'var(--color-border)',
                    color:       active ? cc.text   : 'var(--color-text-sub)',
                    background:  active ? cc.bg     : 'transparent',
                  }}
                  onClick={() => setCategory(cat)}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        <div className={baseStyles.field}>
          <span className={baseStyles.label}>설명 (선택)</span>
          <textarea
            className={baseStyles.descTextarea}
            value={description}
            placeholder="간단한 설명을 남겨보세요..."
            onChange={e => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        <div className={baseStyles.actions}>
          <RoughButton variant="ghost" onClick={onClose}>취소</RoughButton>
          <RoughButton variant="secondary" onClick={handleSubmit} disabled={!canSubmit}>
            {saving ? '저장 중...' : '추가'}
          </RoughButton>
        </div>
      </div>
    </div>,
    document.body
  );
}
