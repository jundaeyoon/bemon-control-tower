import { useState } from 'react';
import { createPortal } from 'react-dom';
import { usePersonalTasks } from '../../hooks/usePersonalTasks';
import { getMemberColor, getMemberInitial } from '../../constants/memberColors';
import styles from './HubCheckinPopup.module.css';

const MEMBERS = ['JUN', 'SURI', 'SUNNY!', 'ZIN', 'LENA'];

function deadlineDiff(deadline) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(deadline); d.setHours(0, 0, 0, 0);
  return Math.round((d - today) / 86400000);
}

function DeadlineTag({ deadline }) {
  if (!deadline) return null;
  const diff = deadlineDiff(deadline);
  if (diff <= 0) return <span className={`${styles.deadline} ${styles.deadlineDanger}`}>오늘 마감</span>;
  if (diff <= 3) return <span className={`${styles.deadline} ${styles.deadlineWarn}`}>{diff}일 후</span>;
  return <span className={`${styles.deadline} ${styles.deadlineNormal}`}>{deadline}</span>;
}

function MemberView({ member, projects, onClose }) {
  const mc = getMemberColor(member);
  const { tasks: personalTasks } = usePersonalTasks(member);

  const myProjectTasks = projects.flatMap(p =>
    (p.tasks ?? [])
      .filter(t => t.assignee === member)
      .map(t => ({ ...t, projectName: p.name }))
  );

  const hasAnything = myProjectTasks.length > 0 || personalTasks.length > 0;

  return (
    <>
      <div className={styles.memberHeader}>
        <div
          className={styles.avatar}
          style={{ background: mc.bg, color: mc.text, border: `2px solid ${mc.border}` }}
        >
          {getMemberInitial(member)}
        </div>
        <div className={styles.memberName} style={{ color: mc.text }}>{member}</div>
        <div className={styles.memberSuffix}>의 업무 현황</div>
      </div>

      <div className={styles.taskList}>
        {!hasAnything ? (
          <div className={styles.empty}>오늘은 여유롭네요! 🎉</div>
        ) : (
          <>
            {myProjectTasks.length > 0 && (
              <div className={styles.section}>
                <div className={styles.sectionTitle}>📋 프로젝트 태스크</div>
                {myProjectTasks.map(t => (
                  <div key={t.id} className={`${styles.taskRow} ${t.completed ? styles.done : ''}`}>
                    <span className={styles.taskName}>{t.name}</span>
                    <span className={styles.projectTag}>{t.projectName}</span>
                    <DeadlineTag deadline={t.deadline} />
                  </div>
                ))}
              </div>
            )}
            {personalTasks.length > 0 && (
              <div className={styles.section}>
                <div className={styles.sectionTitle}>👤 개인 업무</div>
                {personalTasks.map(t => (
                  <div key={t.id} className={`${styles.taskRow} ${t.completed ? styles.done : ''}`}>
                    <span className={styles.taskName}>{t.content}</span>
                    <DeadlineTag deadline={t.deadline} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <button className={styles.confirmBtn} onClick={onClose}>확인 완료!</button>
    </>
  );
}

export default function HubCheckinPopup({ projects, onClose }) {
  const [selected, setSelected] = useState(null);

  return createPortal(
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.popup} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          {selected ? (
            <button className={styles.backBtn} onClick={() => setSelected(null)}>←</button>
          ) : (
            <div className={styles.headerSpacer} />
          )}
          <span className={styles.title}>{selected ? '' : '누구시죠?'}</span>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {!selected ? (
          <div className={styles.memberGrid}>
            {MEMBERS.map(m => {
              const mc = getMemberColor(m);
              return (
                <button
                  key={m}
                  className={styles.memberBtn}
                  style={{ background: mc.bg, color: mc.text, borderColor: mc.border }}
                  onClick={() => setSelected(m)}
                >
                  <span className={styles.memberBtnAvatar} style={{ color: mc.text }}>
                    {getMemberInitial(m)}
                  </span>
                  {m}
                </button>
              );
            })}
          </div>
        ) : (
          <MemberView member={selected} projects={projects} onClose={onClose} />
        )}
      </div>
    </div>,
    document.body
  );
}
