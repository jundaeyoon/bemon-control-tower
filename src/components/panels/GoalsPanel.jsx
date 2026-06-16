import { goals } from '../../data/mockData';
import styles from './GoalsPanel.module.css';

const MEMBER_COLOR = {
  JUN: '#6B7C5C', SURI: '#C06850', 'SUNNY!': '#D4A843', JIN: '#6B7C5C',
};

function getProgressColor(pct) {
  if (pct >= 80) return '#4E7E4E';
  if (pct >= 40) return '#B8903A';
  return '#C06850';
}

export default function GoalsPanel() {
  return (
    <div className={styles.wrap}>
      {goals.map(g => {
        const color = getProgressColor(g.progress);
        return (
          <div key={g.id} className={styles.card}>
            <div className={styles.head}>
              <span className={styles.title}>{g.title}</span>
              <span className={styles.owner} style={{ color: MEMBER_COLOR[g.owner] }}>
                {g.owner}
              </span>
            </div>

            <div className={styles.progressRow}>
              <div className={styles.track}>
                <div
                  className={styles.fill}
                  style={{ width: `${g.progress}%`, background: color }}
                />
              </div>
              <span className={styles.pct} style={{ color }}>{g.progress}%</span>
            </div>

            <div className={styles.meta}>
              <span className={styles.current}>{g.current}</span>
              <span className={styles.separator}>→</span>
              <span className={styles.target}>{g.target}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
