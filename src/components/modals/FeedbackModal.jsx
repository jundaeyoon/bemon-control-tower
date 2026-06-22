import { createPortal } from 'react-dom';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import RoughButton from '../rough/RoughButton';
import styles from './FeedbackModal.module.css';

export default function FeedbackModal({ projectId, projectName, onClose }) {
  const [achievement, setAchievement] = useState('');
  const [preparation, setPreparation] = useState('');
  const [fun,         setFun]         = useState('');
  const [saving,      setSaving]      = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await supabase.from('project_feedbacks').insert({
      project_id:  projectId,
      achievement: achievement.trim(),
      preparation: preparation.trim(),
      fun:         fun.trim(),
    });
    setSaving(false);
    onClose();
  };

  const handleKey = (e) => {
    if (e.key === 'Escape') onClose();
  };

  return createPortal(
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()} onKeyDown={handleKey}>
        <h3 className={styles.title}>🎊 {projectName}</h3>
        <p className={styles.subtitle}>프로젝트 완료 회고를 남겨보세요</p>

        <div className={styles.fields}>
          <label className={styles.fieldLabel}>🏆 성과 — 이번 프로젝트에서 잘 된 것은?</label>
          <textarea
            className={styles.textarea}
            value={achievement}
            onChange={e => setAchievement(e.target.value)}
            placeholder="한 문장으로 적어보세요..."
            rows={2}
          />

          <label className={styles.fieldLabel}>🎯 준비 — 다음엔 더 준비할 것은?</label>
          <textarea
            className={styles.textarea}
            value={preparation}
            onChange={e => setPreparation(e.target.value)}
            placeholder="한 문장으로 적어보세요..."
            rows={2}
          />

          <label className={styles.fieldLabel}>🎉 재미 — 가장 재미있었던 순간은?</label>
          <textarea
            className={styles.textarea}
            value={fun}
            onChange={e => setFun(e.target.value)}
            placeholder="한 문장으로 적어보세요..."
            rows={2}
          />
        </div>

        <div className={styles.actions}>
          <RoughButton variant="ghost" onClick={onClose}>취소</RoughButton>
          <RoughButton variant="secondary" onClick={handleSave} disabled={saving}>
            {saving ? '저장 중...' : '저장하기'}
          </RoughButton>
        </div>
      </div>
    </div>,
    document.body
  );
}
