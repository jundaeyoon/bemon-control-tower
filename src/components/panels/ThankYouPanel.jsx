import { useState } from 'react';
import SlidePanel from './SlidePanel';
import AddThankYouModal from '../modals/AddThankYouModal';
import styles from './ThankYouPanel.module.css';

const POSTIT_COLORS = {
  'JUN':    '#FDDDD3',
  'SURI':   '#D8E6C0',
  'SUNNY!': '#FDE9A0',
  'LENA':   '#C8E8F8',
};

function getPostitColor(to_member) {
  return POSTIT_COLORS[to_member] ?? '#FEFEFE';
}

function getRotation(id) {
  const code = (id.charCodeAt(0) ?? 0) + (id.charCodeAt(id.length - 1) ?? 0);
  return ((code % 7) - 3) * 0.65;
}

function fmtDate(str) {
  const d = new Date(str);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

function getMvp(thanks) {
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthly = thanks.filter(t => t.created_at?.startsWith(thisMonth));
  if (monthly.length === 0) return null;
  const heartMap = {};
  monthly.forEach(t => {
    heartMap[t.to_member] = (heartMap[t.to_member] ?? 0) + (t.hearts ?? 0);
  });
  const top = Object.entries(heartMap).sort((a, b) => b[1] - a[1])[0];
  if (!top || top[1] === 0) return null;
  return { member: top[0], hearts: top[1] };
}

export default function ThankYouPanel({ thankHook, onClose }) {
  const { thanks, toggleHeart, addThank } = thankHook;
  const [expandedId,   setExpandedId]   = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const mvp = getMvp(thanks);

  return (
    <SlidePanel title="땡큐 베리 머치" emoji="🙏" onClose={onClose} width={480}>
      <div className={styles.wrap}>
        <button className={styles.addBtn} onClick={() => setShowAddModal(true)}>
          ✏️ 감사 메시지 남기기
        </button>

        {thanks.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>🙏</span>
            <p className={styles.emptyTitle}>아직 감사 메시지가 없어요</p>
            <p className={styles.emptyHint}>첫 번째 감사 메시지를 남겨보세요!</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {thanks.map(t => {
              const color    = getPostitColor(t.to_member);
              const rotate   = getRotation(t.id);
              const expanded = expandedId === t.id;
              return (
                <div
                  key={t.id}
                  className={`${styles.postit} ${expanded ? styles.postitOpen : ''}`}
                  style={{ background: color, transform: `rotate(${rotate}deg)` }}
                  onClick={() => setExpandedId(expanded ? null : t.id)}
                >
                  <div className={styles.postitSpacer} />
                  <div className={styles.postitContent}>
                    <p className={styles.toName}>To. {t.to_member}</p>
                    <p className={styles.message}>{t.message}</p>
                    <div className={styles.postitFooter}>
                      <span className={styles.dateText}>{fmtDate(t.created_at)}</span>
                      <span className={styles.anonTag}>익명 🙈</span>
                      <button
                        className={styles.heartBtn}
                        onClick={e => { e.stopPropagation(); toggleHeart(t.id); }}
                      >
                        ❤️ {t.hearts ?? 0}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {mvp && (
          <div className={styles.mvp}>
            <div className={styles.mvpBadge}>🌟 이달의 MVP</div>
            <div className={styles.mvpName}>{mvp.member}</div>
            <div className={styles.mvpHearts}>❤️ {mvp.hearts}개의 감사를 받았어요</div>
          </div>
        )}
      </div>

      {showAddModal && (
        <AddThankYouModal
          onAdd={addThank}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </SlidePanel>
  );
}
