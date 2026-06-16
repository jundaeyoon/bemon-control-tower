import { useEffect, useState } from 'react';
import styles from './ImageGallery.module.css';

export default function ImageGallery({ images, startIndex = 0, onClose }) {
  const [idx, setIdx] = useState(startIndex);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape')     onClose();
      if (e.key === 'ArrowLeft')  setIdx(i => Math.max(0, i - 1));
      if (e.key === 'ArrowRight') setIdx(i => Math.min(images.length - 1, i + 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [images.length, onClose]);

  const img = images[idx];

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        <div className={styles.topBar}>
          <span className={styles.counter}>{idx + 1} / {images.length}</span>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.imageWrap}>
          <button
            className={`${styles.arrow} ${styles.arrowLeft}`}
            onClick={() => setIdx(i => Math.max(0, i - 1))}
            disabled={idx === 0}
          >‹</button>

          <img src={img.data} alt={img.name} className={styles.image} />

          <button
            className={`${styles.arrow} ${styles.arrowRight}`}
            onClick={() => setIdx(i => Math.min(images.length - 1, i + 1))}
            disabled={idx === images.length - 1}
          >›</button>
        </div>

        <div className={styles.name}>{img.name}</div>
      </div>
    </div>
  );
}
