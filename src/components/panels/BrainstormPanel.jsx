import { brainstorm } from '../../data/mockData';
import styles from './BrainstormPanel.module.css';

const sorted = [...brainstorm].sort((a, b) => b.votes - a.votes);

const CAT_COLOR = {
  '제품':    { color: '#C06850', bg: 'rgba(192,104,80,0.10)' },
  '마케팅':  { color: '#B8903A', bg: 'rgba(180,130,30,0.10)' },
  '고객관리': { color: '#6B7C5C', bg: 'rgba(107,124,92,0.10)' },
  '이벤트':  { color: '#7A6A9C', bg: 'rgba(122,106,156,0.10)' },
  '디지털':  { color: '#4A90C4', bg: 'rgba(74,144,196,0.10)'  },
};

const MEMBER_COLOR = {
  JUN: '#6B7C5C', SURI: '#C06850', 'SUNNY!': '#D4A843', JIN: '#6B7C5C',
};

export default function BrainstormPanel() {
  return (
    <div className={styles.wrap}>
      {sorted.map((item, i) => {
        const cat = CAT_COLOR[item.category] ?? { color: '#888', bg: 'rgba(136,136,136,0.10)' };
        return (
          <div key={item.id} className={styles.card}>
            <div className={styles.rank}>#{i + 1}</div>
            <div className={styles.body}>
              <div className={styles.row}>
                <span className={styles.idea}>{item.idea}</span>
                <span className={styles.badge} style={{ color: cat.color, background: cat.bg }}>
                  {item.category}
                </span>
              </div>
              <div className={styles.foot}>
                <span style={{ color: MEMBER_COLOR[item.author] }}>● {item.author}</span>
                <span className={styles.votes}>👍 {item.votes}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
