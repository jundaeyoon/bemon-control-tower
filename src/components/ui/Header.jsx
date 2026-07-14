import { getMemberColor, getMemberInitial } from '../../constants/memberColors';
import { useMemberXP, getLevelInfo } from '../../hooks/useMemberXP';
import LevelUpToast from './LevelUpToast';
import styles from './Header.module.css';

const TEAM = [
  { name: 'JUN',    role: '대표' },
  { name: 'SURI',   role: null   },
  { name: 'SUNNY!', role: null   },
  { name: 'LENA',   role: null   },
];

export default function Header({ selectedMember, onSelectMember }) {
  const { xpMap, levelUpEvent, clearLevelUp } = useMemberXP();

  return (
    <>
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
            const xp = xpMap[m.name] ?? 0;
            const info = getLevelInfo(xp);

            return (
              <div
                key={m.name}
                className={`${styles.member} ${styles.memberBtn}`}
                onClick={() => onSelectMember(m.name)}
              >
                {/* 툴팁 */}
                <div className={styles.tooltip}>
                  <span className={styles.tooltipXP}>{xp} XP</span>
                  <span className={styles.tooltipLevel}>
                    Lv.{info.level} {info.emoji} {info.title}
                  </span>
                  {info.next && (
                    <span className={styles.tooltipNext}>
                      다음 레벨까지 {info.next.min - xp} XP
                    </span>
                  )}
                </div>

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
                  {getMemberInitial(m.name)}
                </div>

                <div className={styles.info}>
                  <div className={styles.nameRow}>
                    <span className={styles.name}>{m.name}</span>
                    {m.role && <span className={styles.role}>{m.role}</span>}
                  </div>
                  <div className={styles.levelRow}>
                    <span className={styles.levelBadge} style={{ color: mc.border }}>
                      Lv.{info.level}
                    </span>
                    <span className={styles.levelEmoji}>{info.emoji}</span>
                  </div>
                  <div className={styles.gauge}>
                    <div
                      className={styles.gaugeFill}
                      style={{
                        width: `${info.progress * 100}%`,
                        background: mc.border,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </header>

      <LevelUpToast event={levelUpEvent} onClose={clearLevelUp} />
    </>
  );
}
