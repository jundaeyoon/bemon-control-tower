import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import RoughInput  from '../rough/RoughInput';
import RoughButton from '../rough/RoughButton';
import baseStyles from './AddProjectModal.module.css';
import styles from './WikiDocModal.module.css';

// 새 문서 작성 / 기존 문서 수정을 모두 처리한다.
// initialDoc이 있으면 수정 모드, 없으면 작성 모드.
export default function WikiDocModal({ initialDoc = null, existingCategories = [], currentUser, onSave, onClose }) {
  const isEdit = !!initialDoc;

  const [title,    setTitle]    = useState(initialDoc?.title ?? '');
  const [category, setCategory] = useState(initialDoc?.category ?? '');
  const [content,  setContent]  = useState(initialDoc?.content ?? '');
  const [saving,   setSaving]   = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const el = inputRef.current?.querySelector('input');
    el?.focus();
  }, []);

  const canSubmit = title.trim() && category.trim() && content.trim() && currentUser && !saving;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    await onSave({ title: title.trim(), category: category.trim(), content: content.trim() });
    setSaving(false);
    onClose();
  };

  const handleKey = (e) => {
    if (e.key === 'Escape') onClose();
  };

  return createPortal(
    <div className={baseStyles.backdrop} onClick={onClose}>
      <div className={baseStyles.modal} onClick={e => e.stopPropagation()} onKeyDown={handleKey}>
        <h3 className={baseStyles.title}>{isEdit ? '✏️ 문서 수정' : '🔖 새 문서 작성'}</h3>

        <div ref={inputRef}>
          <RoughInput
            label="제목"
            placeholder="예: Cafe24 사용법"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>

        <RoughInput
          label="카테고리"
          placeholder="예: 배송 규칙, CS 대응법..."
          value={category}
          onChange={e => setCategory(e.target.value)}
        />
        {existingCategories.length > 0 && (
          <div className={styles.suggestRow}>
            <span className={styles.suggestLabel}>기존 카테고리:</span>
            {existingCategories.map(cat => (
              <button
                key={cat}
                type="button"
                className={styles.suggestChip}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        <div className={baseStyles.field}>
          <span className={baseStyles.label}>본문</span>
          <textarea
            className={styles.contentTextarea}
            placeholder="내용을 자유롭게 작성해주세요. 줄바꿈도 그대로 저장됩니다."
            value={content}
            onChange={e => setContent(e.target.value)}
          />
        </div>

        {!currentUser && (
          <p className={styles.authorNotice}>
            {isEdit ? '수정자' : '작성자'}를 기록하려면 먼저 상단에서 팀원 이름을 선택해주세요.
          </p>
        )}

        <div className={baseStyles.actions}>
          <RoughButton variant="ghost" onClick={onClose}>취소</RoughButton>
          <RoughButton variant="secondary" onClick={handleSubmit} disabled={!canSubmit}>
            {saving ? '저장 중...' : isEdit ? '수정 완료' : '작성 완료'}
          </RoughButton>
        </div>
      </div>
    </div>,
    document.body
  );
}
