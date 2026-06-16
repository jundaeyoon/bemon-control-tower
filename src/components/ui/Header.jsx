import { getMemberColor } from '../../constants/memberColors';
import styles from './Header.module.css';

const TEAM = [
  { name: 'JUN',    role: '대표' },
  { name: 'SURI',   role: null   },
  { name: 'SUNNY!', role: null   },
  { name: 'JIN',    role: null   },
  { name: 'LENA',   role: null   },
];

export default function Header({ selectedMember, onSelectMember }) {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <span className={styles.logoText} translate="no">BEMON</span>
        <div className={styles.logoDivider} />
        <span className={styles.logoSub}>CONTROL TOWER</span>
      </div>

      <div className={styles.team}>
        {TEAM.map(m => {
          const mc = getMemberColor(m.name);
          const isSelected = selectedMember === m.name;
          return (
            <div
              key={m.name}
              className={`${styles.member} ${styles.memberBtn}`}
              onClick={() => onSelectMember(m.name)}
              title={`${m.name} 업무 보기`}
            >
              <div
                className={styles.avatar}
                style={{
                  color:       mc.text,
                  background:  mc.bg,
                  borderColor: mc.border,
                  boxShadow:   isSelected ? `0 0 0 2.5px ${mc.border}` : 'none',
                  borderWidth: isSelected ? '2px' : '1.5px',
                  transform:   isSelected ? 'scale(1.12)' : 'scale(1)',
                }}
              >
                {m.name[0]}
              </div>
              <div className={styles.info}>
                <span className={styles.name}>{m.name}</span>
                {m.role && <span className={styles.role}>{m.role}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </header>
  );
}
