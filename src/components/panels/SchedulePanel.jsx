import { schedule } from '../../data/mockData';
import styles from './SchedulePanel.module.css';

const MEMBER_COLOR = {
  JUN:    '#6B7C5C',
  SURI:   '#C06850',
  'SUNNY!': '#D4A843',
  JIN:    '#6B7C5C',
};

export default function SchedulePanel() {
  return (
    <div className={styles.wrap}>
      {schedule.map(ev => (
        <div key={ev.id} className={styles.card}>
          <div className={styles.dateBlock}>
            <span className={styles.date}>{ev.date.slice(5)}</span>
            <span className={styles.time}>{ev.time}</span>
          </div>
          <div className={styles.body}>
            <span className={styles.title}>{ev.title}</span>
            <div className={styles.attendees}>
              {ev.attendees.map(a => (
                <span
                  key={a}
                  className={styles.chip}
                  style={{ color: MEMBER_COLOR[a], borderColor: `${MEMBER_COLOR[a]}55`, background: `${MEMBER_COLOR[a]}11` }}
                >
                  {a}
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
