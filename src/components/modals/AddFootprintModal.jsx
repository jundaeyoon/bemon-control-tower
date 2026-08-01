import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import RoughInput  from '../rough/RoughInput';
import RoughButton from '../rough/RoughButton';
import { CATEGORIES, getCategoryColor } from '../../constants/footprintCategories';
import baseStyles from './AddProjectModal.module.css';

export default function AddFootprintModal({ onAdd, onClose, currentUser }) {
  const [title,       setTitle]       = useState('');
  const [date,        setDate]        = useState(new Date().toISOString().slice(0, 10));
  const [category,    setCategory]    = useState(null);
  const [achievement, setAchievement] = useState('');
  const [timing,      setTiming]      = useState('');
  const [item,        setItem]        = useState('');
  const [saving,      setSaving]      = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const el = inputRef.current?.querySelector('input');
    el?.focus();
  }, []);

  const hasFeedbackInput = achievement.trim() || timing.trim() || item.trim();
  const needsAuthor = hasFeedbackInput && !currentUser;
  const canSubmit = title.trim() && date && category && !needsAuthor && !saving;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    await onAdd({
      title: title.trim(),
      date,
      category,
      achievement: achievement.trim(),
      timing: timing.trim(),
      item: item.trim(),
    });
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

        <RoughInput
          label="성과 (선택)"
          placeholder="예: 매출 목표 초과 달성"
          value={achievement}
          onChange={e => setAchievement(e.target.value)}
        />

        <RoughInput
          label="시기 (선택)"
          placeholder="예: 너무 늦었다, 3월 중순이 적기"
          value={timing}
          onChange={e => setTiming(e.target.value)}
        />

        <RoughInput
          label="아이템 (선택)"
          placeholder="예: 가격이 너무 비쌌다는 반응"
          value={item}
          onChange={e => setItem(e.target.value)}
        />

        {needsAuthor && (
          <p className={baseStyles.label} style={{ color: 'var(--color-warning)' }}>
            성과/시기/아이템을 입력하려면 먼저 상단에서 피드백 작성자 이름을 선택해주세요.
          </p>
        )}

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
