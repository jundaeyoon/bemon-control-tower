import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { getMemberColor, getMemberInitial } from '../../constants/memberColors';
import styles from './BemonDashboardPopup.module.css';

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

function toDateStr(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatKorDate(date) {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 ${DAYS[date.getDay()]}요일`;
}

function getUrgency(deadline) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d     = new Date(deadline); d.setHours(0, 0, 0, 0);
  const diff  = Math.round((d - today) / 86400000);
  if (diff <= 0) return { label: '오늘 마감', type: 'danger' };
  if (diff <= 2) return { label: `${diff}일 후 마감`, type: 'warn' };
  return { label: '여유있음', type: 'ok' };
}

function getQuestRate(goals) {
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const goal  = goals.find(g => g.year_month === thisMonth);
  const conds = goal?.clear_conditions ?? [];
  if (conds.length === 0) return null;
  const totalTarget  = conds.reduce((s, c) => s + (c.target  ?? 100), 0);
  const totalCurrent = conds.reduce((s, c) => s + Math.min(c.current ?? 0, c.target ?? 100), 0);
  return Math.round((totalCurrent / totalTarget) * 100);
}

export default function BemonDashboardPopup({ projects, goals, thanks, onClose, anchor }) {
  const popupRef = useRef(null);
  const [popupStyle, setPopupStyle] = useState({ left: -9999, top: -9999, transform: 'none' });

  useLayoutEffect(() => {
    const el = popupRef.current;
    if (!el) return;
    const W      = el.offsetWidth;
    const H      = el.offsetHeight;
    const margin = 12;
    const cx     = anchor ? anchor.x : window.innerWidth  / 2;
    const topY   = anchor ? anchor.y + 60 : margin;
    const left   = Math.min(Math.max(cx - W / 2, margin), window.innerWidth  - W - margin);
    const top    = Math.min(Math.max(topY,        margin), window.innerHeight - H - margin);
    setPopupStyle({ left, top, transform: 'none' });
  }, [anchor]);

  const today    = new Date();
  const todayStr = toDateStr(today);

  const allTasks = projects.flatMap(p => (p.tasks ?? []).map(t => ({ ...t, projectName: p.name })));

  const todayTaskCount   = allTasks.filter(t => t.deadline === todayStr && !t.completed).length;
  const todayThanksCount = thanks.filter(t => t.created_at?.startsWith(todayStr)).length;
  const questRate        = getQuestRate(goals);

  const urgentTasks = allTasks
    .filter(t => {
      if (!t.deadline || t.completed) return false;
      const d = new Date(t.deadline); d.setHours(0, 0, 0, 0);
      const n = new Date();           n.setHours(0, 0, 0, 0);
      return Math.round((d - n) / 86400000) <= 2;
    })
    .map(t => ({ ...t, urgency: getUrgency(t.deadline) }))
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

  return createPortal(
    <div className={styles.popup} ref={popupRef} style={popupStyle}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <div className={styles.greeting}>안녕하세요, BEMON 팀 👋</div>
          <div className={styles.dateStr}>{formatKorDate(today)}</div>
        </div>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>
      </div>

      {/* 3 Summary Cards */}
      <div className={styles.cards}>
        <div className={styles.card}>
          <div className={styles.cardEmoji}>🎯</div>
          <div className={styles.cardValue}>
            {questRate !== null ? `${questRate}%` : '—'}
          </div>
          <div className={styles.cardLabel}>이달 퀘스트</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardEmoji}>⚡</div>
          <div className={`${styles.cardValue} ${todayTaskCount > 0 ? styles.danger : ''}`}>
            {todayTaskCount}
          </div>
          <div className={styles.cardLabel}>오늘 마감</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardEmoji}>🙏</div>
          <div className={`${styles.cardValue} ${todayThanksCount > 0 ? styles.accent : ''}`}>
            {todayThanksCount}
          </div>
          <div className={styles.cardLabel}>새 감사 메시지</div>
        </div>
      </div>

      {/* Urgent task list */}
      {urgentTasks.length > 0 ? (
        <div className={styles.taskSection}>
          <div className={styles.taskListTitle}>⚡ 마감 임박 태스크</div>
          <div className={styles.taskList}>
            {urgentTasks.map(t => {
              const mc = getMemberColor(t.assignee);
              return (
                <div key={t.id} className={styles.taskRow}>
                  <div
                    className={styles.avatar}
                    style={{ background: mc.bg, color: mc.text, border: `1.5px solid ${mc.border}` }}
                  >
                    {getMemberInitial(t.assignee)}
                  </div>
                  <div className={styles.taskInfo}>
                    <div className={styles.taskName}>{t.name}</div>
                    <div className={styles.taskProject}>{t.projectName}</div>
                  </div>
                  <div className={`${styles.urgencyBadge} ${styles[t.urgency.type]}`}>
                    {t.urgency.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className={styles.allClear}>
          🎉 3일 이내 마감 태스크가 없어요!
        </div>
      )}
    </div>,
    document.body
  );
}
