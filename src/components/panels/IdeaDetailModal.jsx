import { useState } from 'react';
import RoughButton from '../rough/RoughButton';
import { getMemberColor } from '../../constants/memberColors';
import styles from './TodoDetailModal.module.css';

const MEMBERS = ['JUN', 'SURI', 'SUNNY!', 'ZIN', 'LENA'];

export default function IdeaDetailModal({ idea, onSave, onDelete, onClose }) {
  const [title,   setTitle]   = useState(idea.title ?? '');
  const [content, setContent] = useState(idea.content ?? '');
  const [author,  setAuthor]  = useState(idea.author ?? null);

  const handleSave = () => {
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    if (!trimmedTitle && !trimmedContent) return;
    onSave(idea.id, { title: trimmedTitle, content: trimmedContent, author });
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm('이 아이디어를 삭제할까요?')) {
      onDelete(idea.id);
      onClose();
    }
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h3 className={styles.title}>
          <span style={{ color: '#16a34a' }}>👍 {idea.votes ?? 0}</span>
          {idea.downvotes != null && (
            <span style={{ color: '#dc2626', marginLeft: 12 }}>👎 {idea.downvotes}</span>
          )}
        </h3>

        <div className={styles.field}>
          <span className={styles.label}>제목</span>
          <input
            className={styles.titleInput}
            value={title}
            placeholder="아이디어 제목을 입력하세요..."
            onChange={e => setTitle(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <span className={styles.label}>아이디어 내용</span>
          <textarea
            className={styles.memoTextarea}
            value={content}
            placeholder="아이디어 상세 내용을 입력하세요..."
            onChange={e => setContent(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <span className={styles.label}>작성자</span>
          <div className={styles.memberGroup}>
            {MEMBERS.map(m => {
              const mc = getMemberColor(m);
              const active = author === m;
              return (
                <button
                  key={m}
                  className={`${styles.memberBtn} ${active ? styles.memberActive : ''}`}
                  style={{
                    borderColor: active ? mc.border : 'var(--color-border)',
                    color:       active ? mc.text   : 'var(--color-text-sub)',
                    background:  active ? mc.bg     : 'transparent',
                  }}
                  onClick={() => setAuthor(prev => prev === m ? null : m)}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>

        <div className={styles.actions}>
          <RoughButton variant="danger" size="sm" onClick={handleDelete}>삭제</RoughButton>
          <div className={styles.actionRight}>
            <RoughButton variant="ghost" size="sm" onClick={onClose}>취소</RoughButton>
            <RoughButton variant="secondary" size="sm" onClick={handleSave} disabled={!title.trim() && !content.trim()}>저장</RoughButton>
          </div>
        </div>
      </div>
    </div>
  );
}
