import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase';
import styles from './MachoMan.module.css';

const MEMBERS = ['JUN', 'SURI', 'SUNNY!', 'ZIN', 'LENA'];
const MEMBER_COLORS = {
  'JUN':    '#E8896A',
  'SURI':   '#6B7C45',
  'SUNNY!': '#F59E0B',
  'ZIN':    '#9333EA',
  'LENA':   '#0284C7',
};

const INITIAL_MSG = {
  role: 'assistant',
  content: '안녕! 나 마초맨이야 🤖 뭐든 물어봐, 베몽 일이라면 다 알아!',
};

function getThisMonthQuest(goals) {
  const now = new Date();
  const ym  = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return (goals ?? []).find(g => g.year_month === ym)?.quest?.trim() || '없음';
}

export default function MachoMan({ projects, goals }) {
  const [open,     setOpen]     = useState(false);
  const [user,     setUser]     = useState(() => localStorage.getItem('machoman_user') ?? null);
  const [messages, setMessages] = useState([INITIAL_MSG]);
  const [input,    setInput]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const [saveModal, setSaveModal] = useState(false);
  const [saveStep,  setSaveStep]  = useState('confirm'); // 'confirm' | 'password'
  const [password,  setPassword]  = useState('');
  const [saving,    setSaving]    = useState(false);

  const msgEndRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const hasConvo = messages.length > 1;

  /* ── toggle / close ─────────────────────────────── */
  const toggleOpen = () => setOpen(v => !v);

  const handleCloseBtn = () => {
    if (hasConvo) {
      setSaveModal(true);
      setSaveStep('confirm');
      setPassword('');
    } else {
      setOpen(false);
    }
  };

  const doClose = () => {
    setSaveModal(false);
    setOpen(false);
    setMessages([INITIAL_MSG]);
    setInput('');
  };

  /* ── save flow ──────────────────────────────────── */
  const handleSave = async () => {
    if (password.length !== 4 || saving) return;
    setSaving(true);
    const { error } = await supabase.from('machoman_chats').insert({
      member: user,
      messages,
      password_hash: password,
    });
    setSaving(false);
    if (error) { alert('저장 실패: ' + error.message); return; }
    doClose();
  };

  /* ── user selection ─────────────────────────────── */
  const handleSelectUser = (name) => {
    localStorage.setItem('machoman_user', name);
    setUser(name);
  };

  const handleChangeUser = () => {
    localStorage.removeItem('machoman_user');
    setUser(null);
    setMessages([INITIAL_MSG]);
    setInput('');
  };

  /* ── send message ───────────────────────────────── */
  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const newMsgs = [...messages, { role: 'user', content: trimmed }];
    setMessages(newMsgs);
    setInput('');
    setLoading(true);

    try {
      // Slice off the initial assistant greeting so API messages start with user
      const apiMsgs = newMsgs.slice(1);

      const res = await fetch('/api/machoman', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member: user,
          messages: apiMsgs,
          projects,
          quest: getThisMonthQuest(goals),
        }),
      });

      if (!res.ok) throw new Error(`API ${res.status}`);
      const { reply } = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: '앗, 오류났어 😅 다시 시도해봐!' },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  /* ── render ─────────────────────────────────────── */
  return createPortal(
    <>
      {/* Floating Button */}
      <div className={styles.floatWrap}>
        <button className={styles.floatBtn} onClick={toggleOpen} aria-label="마초맨 AI">
          🤖
        </button>
        <span className={styles.floatLabel}>마초맨</span>
      </div>

      {/* Chat Window */}
      {open && (
        <div className={styles.chatWindow}>
          {/* Header */}
          <div className={styles.chatHeader}>
            <div className={styles.headerLeft}>
              <div className={styles.botAvatar}>🤖</div>
              <div>
                <div className={styles.botName}>MACHOMAN</div>
                <div className={styles.botSub}>베몽 AI 직원 · 항상 대기중</div>
              </div>
            </div>
            <div className={styles.headerRight}>
              {user && (
                <>
                  <span
                    className={styles.userChip}
                    style={{ background: MEMBER_COLORS[user] ?? '#888' }}
                  >
                    {user}
                  </span>
                  <button className={styles.changeBtn} onClick={handleChangeUser}>
                    변경
                  </button>
                </>
              )}
              <button className={styles.closeBtn} onClick={handleCloseBtn}>✕</button>
            </div>
          </div>

          {/* Name Picker */}
          {!user ? (
            <div className={styles.namePicker}>
              <div className={styles.namePrompt}>
                안녕! 나 마초맨이야 🤖<br />누구야?
              </div>
              <div className={styles.memberBtns}>
                {MEMBERS.map(m => (
                  <button
                    key={m}
                    className={styles.memberBtn}
                    style={{ background: MEMBER_COLORS[m] }}
                    onClick={() => handleSelectUser(m)}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Chat Body */
            <>
              <div className={styles.msgList}>
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`${styles.bubble} ${msg.role === 'user' ? styles.userBubble : styles.botBubble}`}
                  >
                    {msg.content}
                  </div>
                ))}
                {loading && (
                  <div className={`${styles.bubble} ${styles.botBubble}`}>
                    <span className={styles.dot} />
                    <span className={styles.dot} />
                    <span className={styles.dot} />
                  </div>
                )}
                <div ref={msgEndRef} />
              </div>

              <div className={styles.inputRow}>
                <input
                  ref={inputRef}
                  className={styles.msgInput}
                  placeholder="마초맨에게 물어봐..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  disabled={loading}
                />
                <button
                  className={styles.sendBtn}
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                >
                  ➤
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Save Modal */}
      {saveModal && (
        <div className={styles.saveOverlay}>
          <div className={styles.saveBox}>
            {saveStep === 'confirm' ? (
              <>
                <div className={styles.saveTitle}>💬 대화 내용을 저장할까요?</div>
                <div className={styles.saveSub}>
                  비밀번호로 잠금하면 팀원이 열람할 수 있어요
                </div>
                <div className={styles.saveBtns}>
                  <button className={styles.saveSec} onClick={doClose}>
                    그냥 닫기
                  </button>
                  <button
                    className={styles.savePri}
                    onClick={() => setSaveStep('password')}
                  >
                    저장하기
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className={styles.saveTitle}>🔑 4자리 비밀번호 설정</div>
                <div className={styles.saveSub}>숫자 4자리로 입력해주세요</div>
                <input
                  className={styles.pwInput}
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="0000"
                  value={password}
                  onChange={e =>
                    setPassword(e.target.value.replace(/\D/g, '').slice(0, 4))
                  }
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSave();
                  }}
                  autoFocus
                />
                <div className={styles.saveBtns}>
                  <button
                    className={styles.saveSec}
                    onClick={() => setSaveStep('confirm')}
                  >
                    뒤로
                  </button>
                  <button
                    className={styles.savePri}
                    onClick={handleSave}
                    disabled={password.length !== 4 || saving}
                  >
                    {saving ? '저장 중...' : '저장'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>,
    document.body
  );
}
