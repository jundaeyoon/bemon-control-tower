import { useEffect } from 'react';
import { getMemberColor, getMemberInitial } from '../../constants/memberColors';
import styles from './MemberTasksModal.module.css';

function getDaysLeft(deadline) {
  if (!deadline) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(deadline);
  return Math.round((due - today) / 86400000);
}

function DeadlineBadge({ deadline }) {
  const d = getDaysLeft(deadline);
  if (d === null) return null;
  const label = d === 0 ? 'D-Day' : d > 0 ? `D-${d}` : `D+${Math.abs(d)}`;
  const overdue = d < 0;
  return (
    <span className={`${styles.deadline} ${overdue ? styles.deadlineOverdue : ''}`}>
      {label}
    </span>
  );
}

function TaskRow({ task, mc }) {
  return (
    <div className={`${styles.taskRow} ${task.completed ? styles.taskDone : ''}`}>
      <span className={styles.bullet}>└</span>
      <span className={styles.taskName}>{task.name}</span>
      {!task.completed && task.progress != null && task.progress > 0 && (
        <span className={styles.progress} style={{ color: mc.text }}>{task.progress}%</span>
      )}
      {task.completed ? (
        <span className={styles.completedBadge} style={{ color: mc.text }}>완료</span>
      ) : (
        task.deadline && <DeadlineBadge deadline={task.deadline} />
      )}
    </div>
  );
}

export default function MemberTasksModal({ member, projects, onClose }) {
  const mc = getMemberColor(member);

  const projectTasks = projects
    .map(proj => ({
      id:    proj.id,
      name:  proj.name,
      tasks: proj.tasks.filter(t => t.assignee === member),
    }))
    .filter(p => p.tasks.length > 0);

  const totalCount     = projectTasks.reduce((s, p) => s + p.tasks.length, 0);
  const completedCount = projectTasks.reduce((s, p) => s + p.tasks.filter(t => t.completed).length, 0);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={styles.header} style={{ borderTopColor: mc.border }}>
          <div className={styles.memberRow}>
            <div
              className={styles.avatar}
              style={{ background: mc.bg, color: mc.text, borderColor: mc.border }}
            >
              {getMemberInitial(member)}
            </div>
            <div className={styles.memberText}>
              <span className={styles.memberName} style={{ color: mc.text }}>{member}</span>
              <span className={styles.suffix}>의 업무</span>
            </div>
            {totalCount > 0 && (
              <span className={styles.countBadge} style={{ background: mc.bg, color: mc.text }}>
                {completedCount}/{totalCount}
              </span>
            )}
          </div>
          <button className={styles.closeBtn} onClick={onClose} title="닫기">✕</button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {projectTasks.length === 0 ? (
            <p className={styles.empty}>담당 업무가 없습니다</p>
          ) : (
            projectTasks.map(proj => (
              <div
                key={proj.id}
                className={styles.projectGroup}
                style={{ '--accent': mc.border }}
              >
                <div className={styles.projectLabel}>
                  <span className={styles.projIcon}>📂</span>
                  <span className={styles.projectName}>{proj.name}</span>
                  <span className={styles.projCount} style={{ color: mc.text }}>
                    {proj.tasks.filter(t => t.completed).length}/{proj.tasks.length}
                  </span>
                </div>
                {proj.tasks.map(task => (
                  <TaskRow key={task.id} task={task} mc={mc} />
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
