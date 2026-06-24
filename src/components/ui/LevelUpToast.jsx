import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './LevelUpToast.module.css';

export default function LevelUpToast({ event, onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!event) return;
    setVisible(true);
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 350); // wait for fade-out
    }, 3000);
    return () => clearTimeout(t);
  }, [event, onClose]);

  if (!event) return null;

  return createPortal(
    <div className={`${styles.toast} ${visible ? styles.visible : styles.hidden}`}>
      <div className={styles.confetti} aria-hidden="true">🎉</div>
      <div className={styles.body}>
        <div className={styles.tag}>LEVEL UP!</div>
        <div className={styles.member}>{event.member}</div>
        <div className={styles.title}>
          <span className={styles.emoji}>{event.emoji}</span>
          {event.title}
        </div>
        <div className={styles.levelBadge}>Lv.{event.level}</div>
      </div>
    </div>,
    document.body
  );
}
