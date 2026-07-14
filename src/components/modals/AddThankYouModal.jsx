import { useState } from 'react';
import { createPortal } from 'react-dom';
import RoughButton from '../rough/RoughButton';
import baseStyles from './AddProjectModal.module.css';
import styles from './AddThankYouModal.module.css';

const MEMBERS = ['JUN', 'SURI', 'SUNNY!', 'LENA', '팀 전체'];

export default function AddThankYouModal({ onAdd, onClose }) {
  const [to,   setTo]   = useState(null);
  const [msg,  setMsg]  = useState('');
  const [busy, setBusy] = useState(false);

  const handleSend = async () => {
    if (!to || !msg.trim()) return;
    setBusy(true);
    await onAdd(to, msg.trim());
    setBusy(false);
    onClose();
  };

  return createPortal(
    <div className={baseStyles.backdrop} onClick={onClose}>
      <div className={baseStyles.modal} onClick={e => e.stopPropagation()}>
        <p className={styles.anonNotice}>이 메시지는 익명으로 전달됩니다 🙏</p>

        <h3 className={baseStyles.title}>감사 메시지 남기기</h3>

        <div className={baseStyles.field}>
          <span className={baseStyles.label}>받는 사람</span>
          <div className={baseStyles.memberGroup}>
            {MEMBERS.map(m => (
              <button
                key={m}
                className={`${baseStyles.memberBtn} ${to === m ? baseStyles.memberActive : ''}`}
                style={to === m ? { borderColor: '#E8896A', color: '#C05A30', background: 'rgba(232,137,106,0.12)' } : {}}
                onClick={() => setTo(prev => prev === m ? null : m)}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className={baseStyles.field}>
          <span className={baseStyles.label}>메시지</span>
          <textarea
            className={baseStyles.descTextarea}
            value={msg}
            placeholder="감사한 마음을 전해보세요 ☺️"
            onChange={e => setMsg(e.target.value)}
            rows={4}
          />
        </div>

        <div className={baseStyles.actions}>
          <RoughButton variant="ghost" onClick={onClose}>취소</RoughButton>
          <RoughButton
            variant="secondary"
            onClick={handleSend}
            disabled={!to || !msg.trim() || busy}
          >
            {busy ? '전송 중...' : '보내기 ❤️'}
          </RoughButton>
        </div>
      </div>
    </div>,
    document.body
  );
}
