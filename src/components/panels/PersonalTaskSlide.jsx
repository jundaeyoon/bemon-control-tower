import { useState } from 'react';
import { createPortal } from 'react-dom';
import SlidePanel from './SlidePanel';

export default function PersonalTaskSlide({ task, mc, onUpdate, onToggle, onClose }) {
  const [content,  setContent]  = useState(task.content);
  const [deadline, setDeadline] = useState(task.deadline ?? '');

  const handleSave = () => {
    onUpdate(task.id, { content: content.trim() || task.content, deadline: deadline || null });
    onClose();
  };

  return createPortal(
    <SlidePanel title="개인 업무" emoji="👤" onClose={onClose} width={400}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <button
          onClick={() => onToggle(task.id)}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 16px',
            border: `2px solid ${task.completed ? mc.border : 'var(--color-border)'}`,
            borderRadius: 10,
            background: task.completed ? mc.bg : 'transparent',
            cursor: 'pointer',
            fontFamily: 'var(--font-family)',
            fontSize: 14, fontWeight: 600,
            color: task.completed ? mc.text : 'var(--color-text-sub)',
            transition: 'all 0.15s',
          }}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>{task.completed ? '✓' : '○'}</span>
          {task.completed ? '완료됨 — 클릭하면 취소' : '완료로 표시'}
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-sub)', fontFamily: 'var(--font-family)', letterSpacing: '0.02em' }}>
            업무 내용
          </label>
          <textarea
            rows={4}
            value={content}
            onChange={e => setContent(e.target.value)}
            style={{
              resize: 'vertical',
              border: '1.5px solid var(--color-border)', borderRadius: 8,
              padding: '10px 12px', fontSize: 14,
              fontFamily: 'var(--font-family)', color: 'var(--color-text-main)',
              background: 'var(--color-card-bg)', outline: 'none', lineHeight: 1.5,
              boxSizing: 'border-box', width: '100%',
            }}
            onFocus={e => { e.target.style.borderColor = mc.border; }}
            onBlur={e => { e.target.style.borderColor = 'var(--color-border)'; }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-sub)', fontFamily: 'var(--font-family)', letterSpacing: '0.02em' }}>
            마감일
          </label>
          <input
            type="date"
            value={deadline}
            onChange={e => setDeadline(e.target.value)}
            style={{
              border: '1.5px solid var(--color-border)', borderRadius: 8,
              padding: '8px 12px', fontSize: 14,
              fontFamily: 'var(--font-family)', color: 'var(--color-text-main)',
              background: 'var(--color-card-bg)', outline: 'none', cursor: 'pointer',
            }}
          />
        </div>

        <button
          onClick={handleSave}
          style={{
            padding: '12px 0', background: mc.border, color: '#fff',
            border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 800,
            fontFamily: 'var(--font-family)', cursor: 'pointer',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.82'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
        >저장</button>
      </div>
    </SlidePanel>,
    document.body
  );
}
