import { getMemberInitial } from '../constants/memberColors';
import styles from './Header.module.css';

const TEAM = [
  { name: 'JUN', role: '대표', color: '#6B7C45' },
  { name: 'SURI', role: '', color: '#E8896A' },
  { name: 'SUNNY!', role: '', color: '#4A3728' },
];

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <span className={styles.logoText}>BEMON</span>
        <span className={styles.logoDivider} />
        <span className={styles.logoSub}>Control Tower</span>
      </div>
      <div className={styles.team}>
        {TEAM.map((m) => (
          <div key={m.name} className={styles.member}>
            <div className={styles.avatar} style={{ background: m.color }}>
              {getMemberInitial(m.name)}
            </div>
            <div className={styles.memberInfo}>
              <span className={styles.memberName}>{m.name}</span>
              {m.role && <span className={styles.memberRole}>{m.role}</span>}
            </div>
          </div>
        ))}
      </div>
    </header>
  );
}
