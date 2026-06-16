import { projects, schedule, brainstorm, goals } from '../data/mockData';
import styles from './SidePanel.module.css';

const PANEL_CONFIG = {
  projects:    { title: '📂 프로젝트',     accentColor: '#E8896A' },
  schedule:    { title: '📅 스케줄',       accentColor: '#4A3728' },
  brainstorm:  { title: '💡 브레인스토밍', accentColor: '#6B7C45' },
  goals:       { title: '🎯 목표',         accentColor: '#E8896A' },
};

const STATUS_COLOR = { '진행중': '#E8896A', '완료': '#6B7C45', '대기': '#aaa' };

function ProjectsContent() {
  return (
    <div className={styles.content}>
      {projects.map(p => (
        <div key={p.id} className={styles.card}>
          <div className={styles.cardRow}>
            <span className={styles.cardTitle}>{p.name}</span>
            <span className={styles.badge} style={{ background: STATUS_COLOR[p.status] }}>{p.status}</span>
          </div>
          <div className={styles.cardMeta}>
            <span>👤 {p.assignee}</span>
            <span>📅 {p.deadline}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ScheduleContent() {
  return (
    <div className={styles.content}>
      {schedule.map(s => (
        <div key={s.id} className={styles.card}>
          <div className={styles.cardRow}>
            <span className={styles.cardTitle}>{s.title}</span>
            <span className={styles.timeChip}>{s.time}</span>
          </div>
          <div className={styles.cardMeta}>
            <span>📅 {s.date}</span>
          </div>
          <div className={styles.chips}>
            {s.attendees.map(a => (
              <span key={a} className={styles.personChip}>{a}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function BrainstormContent() {
  const sorted = [...brainstorm].sort((a, b) => b.votes - a.votes);
  return (
    <div className={styles.content}>
      {sorted.map((b, i) => (
        <div key={b.id} className={styles.card}>
          <div className={styles.cardRow}>
            <span className={styles.rankBadge}>#{i + 1}</span>
            <span className={styles.cardTitle} style={{ flex: 1 }}>{b.idea}</span>
            <span className={styles.voteChip}>👍 {b.votes}</span>
          </div>
          <div className={styles.cardMeta}>
            <span className={styles.categoryChip}>{b.category}</span>
            <span>💭 {b.author}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function GoalsContent() {
  return (
    <div className={styles.content}>
      {goals.map(g => (
        <div key={g.id} className={styles.card}>
          <div className={styles.cardRow}>
            <span className={styles.cardTitle}>{g.title}</span>
            <span className={styles.ownerChip}>{g.owner}</span>
          </div>
          <div className={styles.progressRow}>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${g.progress}%` }} />
            </div>
            <span className={styles.progressPct}>{g.progress}%</span>
          </div>
          <div className={styles.cardMeta}>
            <span>목표 {g.target}</span>
            <span>현재 {g.current}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

const CONTENT_MAP = { projects: ProjectsContent, schedule: ScheduleContent, brainstorm: BrainstormContent, goals: GoalsContent };

export default function SidePanel({ activePanel, onClose }) {
  const config = activePanel ? PANEL_CONFIG[activePanel] : null;
  const Content = activePanel ? CONTENT_MAP[activePanel] : null;

  return (
    <div className={`${styles.panel} ${activePanel ? styles.open : ''}`}>
      {config && (
        <>
          <div className={styles.panelHeader} style={{ borderTopColor: config.accentColor }}>
            <span className={styles.panelTitle}>{config.title}</span>
            <button className={styles.closeBtn} onClick={onClose} aria-label="닫기">✕</button>
          </div>
          {Content && <Content />}
        </>
      )}
    </div>
  );
}
