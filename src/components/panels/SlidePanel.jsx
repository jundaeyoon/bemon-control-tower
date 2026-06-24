import styles from './SlidePanel.module.css';

export default function SlidePanel({ title, emoji, onClose, children, width = 520 }) {
  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <aside className={styles.panel} style={{ width: `min(${width}px, 100vw)` }} onClick={e => e.stopPropagation()}>
        <div className={styles.dragHandle} />
        <div className={styles.header}>
          <div className={styles.titleRow}>
            {emoji && <span className={styles.emoji}>{emoji}</span>}
            <h2 className={styles.title}>{title}</h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="닫기">✕</button>
        </div>
        <div className={styles.body}>
          {children}
        </div>
      </aside>
    </>
  );
}
