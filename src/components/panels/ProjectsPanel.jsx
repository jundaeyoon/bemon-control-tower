import { projects } from '../../data/mockData';
import styles from './ProjectsPanel.module.css';

const STATUS = {
  '진행중': { color: '#B8903A', bg: 'rgba(180,130,30,0.10)' },
  '완료':   { color: '#4E7E4E', bg: 'rgba(78,126,78,0.10)'  },
  '대기':   { color: '#888888', bg: 'rgba(136,136,136,0.10)' },
};

const MEMBER = {
  JUN:    '#6B7C5C',
  SURI:   '#C06850',
  'SUNNY!': '#D4A843',
  ZIN:    '#6B7C5C',
};

export default function ProjectsPanel() {
  return (
    <div className={styles.wrap}>
      {projects.map(p => (
        <div key={p.id} className={styles.card}>
          <div className={styles.cardHead}>
            <span className={styles.name}>{p.name}</span>
            <span
              className={styles.badge}
              style={{ color: STATUS[p.status]?.color, background: STATUS[p.status]?.bg }}
            >
              {p.status}
            </span>
          </div>

          <div className={styles.progressRow}>
            <div className={styles.track}>
              <div
                className={styles.fill}
                style={{
                  width: `${p.progress}%`,
                  background: STATUS[p.status]?.color,
                }}
              />
            </div>
            <span className={styles.pct}>{p.progress}%</span>
          </div>

          <div className={styles.meta}>
            <span style={{ color: MEMBER[p.assignee] }}>● {p.assignee}</span>
            <span className={styles.deadline}>📅 {p.deadline}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
