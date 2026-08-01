import { useState } from 'react';
import SlidePanel from '../panels/SlidePanel';
import BrainstormSlidePanel from '../panels/BrainstormSlidePanel';
import AddSessionModal from '../modals/AddSessionModal';
import styles from './MobileBrainstormPanel.module.css';

export default function MobileBrainstormPanel({ brainstorm, onClose }) {
  const { sessions, addSession, deleteSession } = brainstorm;

  const [showAddSession, setShowAddSession] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState(null);

  const handleAddSession = ({ title, date }) => {
    addSession(title, date);
    setShowAddSession(false);
  };

  const handleDeleteSession = (sessionId, title) => {
    if (!window.confirm(`"${title}" 세션을 삭제할까요?`)) return;
    deleteSession(sessionId);
    setActiveSessionId(prev => (prev === sessionId ? null : prev));
  };

  return (
    <SlidePanel title="브레인스토밍" emoji="💡" onClose={onClose} width={520}>
      <div className={styles.wrap}>
        <button className={styles.addBtn} onClick={() => setShowAddSession(true)}>
          + 세션 추가
        </button>

        {sessions.length === 0 && (
          <p className={styles.empty}>아직 세션이 없어요</p>
        )}

        <div className={styles.list}>
          {sessions.map(session => (
            <div
              key={session.id}
              className={styles.card}
              onClick={() => setActiveSessionId(session.id)}
            >
              <div className={styles.cardText}>
                <span className={styles.date}>{session.date}</span>
                <span className={styles.title}>{session.title}</span>
              </div>
              <button
                className={styles.deleteBtn}
                onClick={e => { e.stopPropagation(); handleDeleteSession(session.id, session.title); }}
                title="세션 삭제"
              >✕</button>
            </div>
          ))}
        </div>
      </div>

      {showAddSession && (
        <AddSessionModal onAdd={handleAddSession} onClose={() => setShowAddSession(false)} />
      )}

      {activeSessionId && (
        <BrainstormSlidePanel
          session={sessions.find(s => s.id === activeSessionId)}
          brainstorm={brainstorm}
          onClose={() => setActiveSessionId(null)}
        />
      )}
    </SlidePanel>
  );
}
