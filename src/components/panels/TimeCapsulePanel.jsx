import { useState } from 'react';
import SlidePanel from './SlidePanel';
import styles from './TimeCapsulePanel.module.css';

function isCapsuleOpen(capsule) {
  const now  = new Date(); now.setHours(0, 0, 0, 0);
  const open = new Date(capsule.open_date); open.setHours(0, 0, 0, 0);
  return open <= now;
}

function fmtDate(str) {
  const d = new Date(str);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

function getDday(openDateStr) {
  const now  = new Date(); now.setHours(0, 0, 0, 0);
  const open = new Date(openDateStr); open.setHours(0, 0, 0, 0);
  const diff = Math.round((open - now) / 86400000);
  if (diff < 0)  return `${Math.abs(diff)}일 전 개봉됨`;
  if (diff === 0) return '오늘 개봉! 🎉';
  return `D-${diff}`;
}

export default function TimeCapsulePanel({ capsuleHook, onClose }) {
  const { capsules, addCapsule } = capsuleHook;

  const [showForm,  setShowForm]  = useState(false);
  const [title,     setTitle]     = useState('');
  const [content,   setContent]   = useState('');
  const [openDate,  setOpenDate]  = useState('');
  const [busy,      setBusy]      = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const handleSubmit = async () => {
    if (!title.trim() || !openDate) return;
    setBusy(true);
    await addCapsule(title.trim(), content.trim(), openDate);
    setBusy(false);
    setTitle(''); setContent(''); setOpenDate('');
    setShowForm(false);
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <SlidePanel title="베몽 타임캡슐" emoji="⏳" onClose={onClose} width={480}>
      <div className={styles.wrap}>

        {/* Write button */}
        <button
          className={styles.addBtn}
          onClick={() => setShowForm(s => !s)}
        >
          {showForm ? '✕ 닫기' : '✍️ 새 타임캡슐 작성'}
        </button>

        {/* Write form */}
        {showForm && (
          <div className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>제목</label>
              <input
                className={styles.input}
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="예: 2026년 여름의 우리에게"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>내용</label>
              <textarea
                className={styles.textarea}
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder={"이번 분기 어땠나요?\n미래의 우리에게 전하고 싶은 말을 자유롭게 써주세요 :)"}
                rows={6}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>개봉 날짜</label>
              <input
                className={styles.input}
                type="date"
                value={openDate}
                onChange={e => setOpenDate(e.target.value)}
                min={today}
              />
            </div>
            <button
              className={styles.submitBtn}
              onClick={handleSubmit}
              disabled={!title.trim() || !openDate || busy}
            >
              {busy ? '봉인 중...' : '🔒 타임캡슐 봉인하기'}
            </button>
          </div>
        )}

        {/* Capsule list */}
        {capsules.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>⏳</span>
            <p className={styles.emptyTitle}>아직 타임캡슐이 없어요</p>
            <p className={styles.emptyHint}>첫 타임캡슐을 작성해 미래의 BEMON에게 전달해 보세요!</p>
          </div>
        ) : (
          <div className={styles.list}>
            {capsules.map(c => {
              const canOpen  = isCapsuleOpen(c);
              const expanded = expandedId === c.id && canOpen;
              return (
                <div
                  key={c.id}
                  className={`${styles.card} ${canOpen ? styles.open : styles.locked}`}
                  onClick={() => canOpen && setExpandedId(expanded ? null : c.id)}
                >
                  <div className={styles.cardHeader}>
                    <span className={styles.cardIcon}>{canOpen ? '🎉' : '🔒'}</span>
                    <div className={styles.cardInfo}>
                      <div className={styles.cardTitle}>{c.title}</div>
                      <div className={styles.cardMeta}>
                        {fmtDate(c.open_date)} 개봉 · <span className={canOpen ? styles.openTag : styles.lockedTag}>{getDday(c.open_date)}</span>
                      </div>
                    </div>
                    {canOpen && (
                      <span className={styles.chevron}>{expanded ? '▲' : '▼'}</span>
                    )}
                  </div>

                  {expanded && (
                    <div className={styles.cardBody}>
                      <div className={styles.divider} />
                      <p className={styles.contentText}>{c.content || '(내용 없음)'}</p>
                      <div className={styles.createdAt}>작성일: {fmtDate(c.created_at)}</div>
                    </div>
                  )}

                  {!canOpen && (
                    <div className={styles.sealedMsg}>
                      개봉일이 되면 자동으로 열립니다 🔐
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SlidePanel>
  );
}
