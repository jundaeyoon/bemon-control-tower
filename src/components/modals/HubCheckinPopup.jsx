import { useState } from 'react';
import { createPortal } from 'react-dom';
import { usePersonalTasks } from '../../hooks/usePersonalTasks';
import { getMemberColor, getMemberInitial } from '../../constants/memberColors';
import PersonalTaskSlide from '../panels/PersonalTaskSlide';
import styles from './HubCheckinPopup.module.css';

const MEMBERS = ['JUN', 'SURI', 'SUNNY!', 'LENA'];

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

function MemberView({ member, projects, onClose, onOpenTask }) {
  const mc = getMemberColor(member);
  const personalHook = usePersonalTasks(member);
  const [activePersonalId, setActivePersonalId] = useState(null);
  const [completedOpen, setCompletedOpen] = useState(false);

  const myProjectTasks = projects.flatMap(p =>
    (p.tasks ?? [])
      .filter(t => t.assignee === member)
      .map(t => ({ ...t, projectName: p.name, projectId: p.id }))
  );

  const activeProjectTasks = myProjectTasks.filter(t => !t.completed);
  const completedProjectTasks = myProjectTasks.filter(t => t.completed);
  const activePersonalTasks = personalHook.tasks.filter(t => !t.completed);
  const completedPersonalTasks = personalHook.tasks.filter(t => t.completed);

  const hasAnything = activeProjectTasks.length > 0 || activePersonalTasks.length > 0;
  const completedCount = completedProjectTasks.length + completedPersonalTasks.length;

  const livePersonalTask = activePersonalId
    ? (personalHook.tasks.find(t => t.id === activePersonalId) ?? null)
    : null;

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
        {!hasAnything && completedCount === 0 && (
          <div className={styles.empty}>오늘은 여유롭네요! 🎉</div>
        )}
        {!hasAnything && completedCount > 0 && (
          <div className={styles.empty}>진행중인 업무가 없어요! 🎉</div>
        )}
        {activeProjectTasks.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>📋 프로젝트 태스크</div>
            {activeProjectTasks.map(t => (
              <div
                key={t.id}
                className={`${styles.taskRow} ${styles.taskRowClickable}`}
                onClick={() => onOpenTask && onOpenTask(t.id, t.projectId)}
              >
                <span className={styles.taskName}>{t.name}</span>
                <span className={styles.projectTag}>{t.projectName}</span>
                <DeadlineTag deadline={t.deadline} />
              </div>
            ))}
          </div>
        )}
        {activePersonalTasks.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>👤 개인 업무</div>
            {activePersonalTasks.map(t => (
              <div
                key={t.id}
                className={`${styles.taskRow} ${styles.taskRowClickable}`}
                onClick={() => setActivePersonalId(t.id)}
              >
                <span className={styles.taskName}>{t.content}</span>
                <DeadlineTag deadline={t.deadline} />
              </div>
            ))}
          </div>
        )}
        {completedCount > 0 && (
          <div className={styles.section}>
            <div
              className={styles.completedHeader}
              onClick={() => setCompletedOpen(o => !o)}
            >
              <span className={styles.sectionTitle}>✅ 완료된 업무 ({completedCount}개)</span>
              <span className={`${styles.completedChevron} ${completedOpen ? styles.completedChevronOpen : ''}`}>▾</span>
            </div>
            {completedOpen && (
              <div className={styles.completedList}>
                {completedProjectTasks.map(t => (
                  <div
                    key={t.id}
                    className={`${styles.taskRow} ${styles.done} ${styles.taskRowClickable}`}
                    onClick={() => onOpenTask && onOpenTask(t.id, t.projectId)}
                  >
                    <span className={styles.taskName}>{t.name}</span>
                    <span className={styles.projectTag}>{t.projectName}</span>
                  </div>
                ))}
                {completedPersonalTasks.map(t => (
                  <div
                    key={t.id}
                    className={`${styles.taskRow} ${styles.done} ${styles.taskRowClickable}`}
                    onClick={() => setActivePersonalId(t.id)}
                  >
                    <span className={styles.taskName}>{t.content}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <button className={styles.confirmBtn} onClick={onClose}>확인 완료!</button>

      {livePersonalTask && (
        <PersonalTaskSlide
          task={livePersonalTask}
          mc={mc}
          onUpdate={personalHook.updateTask}
          onToggle={personalHook.toggleTask}
          onClose={() => setActivePersonalId(null)}
        />
      )}
    </>
  );
}

export default function HubCheckinPopup({ projects, onClose, onOpenTask }) {
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
                  onClick={() => { localStorage.setItem('bemon_checkin_member', m); setSelected(m); }}
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
          <MemberView
            member={selected}
            projects={projects}
            onClose={onClose}
            onOpenTask={onOpenTask}
          />
        )}
      </div>
    </div>,
    document.body
  );
}
