import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getMemberColor, getMemberInitial } from '../../constants/memberColors';
import { usePersonalTasks } from '../../hooks/usePersonalTasks';
import { supabase } from '../../lib/supabase';
import styles from './MemberTasksModal.module.css';

// ── MachoMan 대화 기록 helpers ────────────────────────────────────────────────

function formatChatDate(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}`;
}

function getChatPreview(messages) {
  const first = (messages ?? []).find(m => m.role === 'user');
  if (!first) return '(대화 없음)';
  const c = first.content ?? '';
  return c.length > 35 ? c.slice(0, 35) + '…' : c;
}

function ChatViewModal({ chat, onClose }) {
  const [unlocked,  setUnlocked]  = useState(false);
  const [pw,        setPw]        = useState('');
  const [pwError,   setPwError]   = useState(false);

  const tryUnlock = () => {
    if (pw === chat.password_hash) { setUnlocked(true); setPwError(false); }
    else { setPwError(true); }
  };

  return (
    <div className={styles.chatOverlay} onClick={onClose}>
      <div className={styles.chatModal} onClick={e => e.stopPropagation()}>
        <div className={styles.chatModalHeader}>
          <span className={styles.chatModalTitle}>🤖 {formatChatDate(chat.created_at)} 대화</span>
          <button className={styles.chatModalClose} onClick={onClose}>✕</button>
        </div>

        {!unlocked ? (
          <div className={styles.chatPwSection}>
            <div className={styles.chatPwLabel}>🔑 비밀번호를 입력해주세요</div>
            <input
              className={styles.chatPwInput}
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="0000"
              value={pw}
              onChange={e => { setPw(e.target.value.replace(/\D/g, '').slice(0, 4)); setPwError(false); }}
              onKeyDown={e => { if (e.key === 'Enter') tryUnlock(); }}
              autoFocus
            />
            {pwError && <span className={styles.chatPwError}>비밀번호가 틀렸어요</span>}
            <button
              className={styles.chatUnlockBtn}
              onClick={tryUnlock}
              disabled={pw.length !== 4}
            >확인</button>
          </div>
        ) : (
          <div className={styles.chatMsgList}>
            {(chat.messages ?? []).map((msg, i) => (
              <div
                key={i}
                className={`${styles.viewBubble} ${msg.role === 'user' ? styles.viewUserBubble : styles.viewBotBubble}`}
              >
                {msg.content}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function getDaysLeft(deadline) {
  if (!deadline) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(deadline);
  return Math.round((due - today) / 86400000);
}

function DeadlineBadge({ deadline }) {
  const d = getDaysLeft(deadline);
  if (d === null) return null;
  const label = d === 0 ? 'D-Day' : d > 0 ? `D-${d}` : `D+${Math.abs(d)}`;
  const overdue = d < 0;
  return (
    <span className={`${styles.deadline} ${overdue ? styles.deadlineOverdue : ''}`}>
      {label}
    </span>
  );
}

function TaskRow({ task, mc }) {
  return (
    <div className={`${styles.taskRow} ${task.completed ? styles.taskDone : ''}`}>
      <span className={styles.bullet}>└</span>
      <span className={styles.taskName}>{task.name}</span>
      {!task.completed && task.progress != null && task.progress > 0 && (
        <span className={styles.progress} style={{ color: mc.text }}>{task.progress}%</span>
      )}
      {task.completed ? (
        <span className={styles.completedBadge} style={{ color: mc.text }}>완료</span>
      ) : (
        task.deadline && <DeadlineBadge deadline={task.deadline} />
      )}
    </div>
  );
}

function PersonalTaskRow({ task, mc, onToggle, onDelete }) {
  const d = getDaysLeft(task.deadline);
  const isToday  = d === 0;
  const isOverdue = d !== null && d < 0;
  return (
    <div className={`${styles.personalRow} ${task.completed ? styles.taskDone : ''}`}>
      <input
        type="checkbox"
        className={styles.checkbox}
        checked={task.completed}
        onChange={() => onToggle(task.id)}
        style={{ accentColor: mc.border }}
      />
      <span className={styles.taskName}>{task.content}</span>
      {task.deadline && (
        <span
          className={styles.deadline}
          style={isToday ? { color: '#e05050', fontWeight: 700 } : isOverdue ? { color: '#e05050' } : {}}
        >
          {isToday ? 'D-Day' : isOverdue ? `D+${Math.abs(d)}` : `D-${d}`}
        </span>
      )}
      <button
        className={styles.deleteBtn}
        onClick={() => onDelete(task.id)}
        title="삭제"
      >✕</button>
    </div>
  );
}

export default function MemberTasksModal({ member, projects, onClose }) {
  const mc = getMemberColor(member);
  const personalHook = usePersonalTasks(member);

  const [showForm, setShowForm] = useState(false);
  const [formContent, setFormContent] = useState('');
  const [formDeadline, setFormDeadline] = useState('');

  // ── MachoMan 대화 기록 ──────────────────────────────────
  const [chats,     setChats]     = useState([]);
  const [viewChat,  setViewChat]  = useState(null);

  useEffect(() => {
    supabase.from('machoman_chats')
      .select('*')
      .eq('member', member)
      .order('created_at', { ascending: false })
      .then(({ data }) => setChats(data ?? []));
  }, [member]);

  const handleDeleteChat = async (chatId) => {
    await supabase.from('machoman_chats').delete().eq('id', chatId);
    setChats(prev => prev.filter(c => c.id !== chatId));
  };

  const projectTasks = projects
    .map(proj => ({
      id:    proj.id,
      name:  proj.name,
      tasks: proj.tasks.filter(t => t.assignee === member),
    }))
    .filter(p => p.tasks.length > 0);

  const totalCount     = projectTasks.reduce((s, p) => s + p.tasks.length, 0);
  const completedCount = projectTasks.reduce((s, p) => s + p.tasks.filter(t => t.completed).length, 0);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleAddPersonal = async () => {
    if (!formContent.trim()) return;
    await personalHook.addTask(formContent.trim(), formDeadline || null);
    setFormContent('');
    setFormDeadline('');
    setShowForm(false);
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={styles.header} style={{ borderTopColor: mc.border }}>
          <div className={styles.memberRow}>
            <div
              className={styles.avatar}
              style={{ background: mc.bg, color: mc.text, borderColor: mc.border }}
            >
              {getMemberInitial(member)}
            </div>
            <div className={styles.memberText}>
              <span className={styles.memberName} style={{ color: mc.text }}>{member}</span>
              <span className={styles.suffix}>의 업무</span>
            </div>
            {totalCount > 0 && (
              <span className={styles.countBadge} style={{ background: mc.bg, color: mc.text }}>
                {completedCount}/{totalCount}
              </span>
            )}
          </div>
          <button className={styles.closeBtn} onClick={onClose} title="닫기">✕</button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {projectTasks.length === 0 ? (
            <p className={styles.empty}>담당 프로젝트 업무가 없습니다</p>
          ) : (
            projectTasks.map(proj => (
              <div
                key={proj.id}
                className={styles.projectGroup}
                style={{ '--accent': mc.border }}
              >
                <div className={styles.projectLabel}>
                  <span className={styles.projIcon}>📂</span>
                  <span className={styles.projectName}>{proj.name}</span>
                  <span className={styles.projCount} style={{ color: mc.text }}>
                    {proj.tasks.filter(t => t.completed).length}/{proj.tasks.length}
                  </span>
                </div>
                {proj.tasks.map(task => (
                  <TaskRow key={task.id} task={task} mc={mc} />
                ))}
              </div>
            ))
          )}

          {/* ── 개인 업무 섹션 ── */}
          <div className={styles.personalDivider} />
          <div className={styles.personalSection} style={{ '--accent': mc.border }}>
            <div className={styles.personalHeader}>
              <div className={styles.personalTitle}>
                <span className={styles.personalDot} style={{ background: mc.border }} />
                <span className={styles.personalTitleText} style={{ color: mc.text }}>개인 업무</span>
                {personalHook.tasks.length > 0 && (
                  <span className={styles.projCount} style={{ color: mc.text }}>
                    {personalHook.tasks.filter(t => t.completed).length}/{personalHook.tasks.length}
                  </span>
                )}
              </div>
              {!showForm && (
                <button
                  className={styles.addBtn}
                  style={{ color: mc.text, borderColor: mc.border }}
                  onClick={() => setShowForm(true)}
                >
                  + 업무 추가
                </button>
              )}
            </div>

            {showForm && (
              <div className={styles.addForm} style={{ borderColor: mc.border }}>
                <input
                  className={styles.formInput}
                  placeholder="업무 내용을 입력하세요"
                  value={formContent}
                  onChange={e => setFormContent(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddPersonal(); if (e.key === 'Escape') setShowForm(false); }}
                  autoFocus
                />
                <div className={styles.formRow}>
                  <input
                    type="date"
                    className={styles.formDate}
                    value={formDeadline}
                    onChange={e => setFormDeadline(e.target.value)}
                  />
                  <div className={styles.formBtns}>
                    <button
                      className={styles.cancelBtn}
                      onClick={() => { setShowForm(false); setFormContent(''); setFormDeadline(''); }}
                    >취소</button>
                    <button
                      className={styles.confirmBtn}
                      style={{ background: mc.border, color: '#fff' }}
                      onClick={handleAddPersonal}
                      disabled={!formContent.trim()}
                    >확인</button>
                  </div>
                </div>
              </div>
            )}

            {personalHook.tasks.length === 0 && !showForm ? (
              <p className={styles.personalEmpty}>개인 업무가 없습니다</p>
            ) : (
              personalHook.tasks.map(task => (
                <PersonalTaskRow
                  key={task.id}
                  task={task}
                  mc={mc}
                  onToggle={personalHook.toggleTask}
                  onDelete={personalHook.deleteTask}
                />
              ))
            )}
          </div>
          {/* ── 마초맨 대화 기록 ── */}
          <div className={styles.personalDivider} />
          <div className={styles.chatSection}>
            <div className={styles.chatSectionHeader}>
              <span className={styles.chatSectionTitle}>🤖 마초맨 대화 기록</span>
            </div>
            {chats.length === 0 ? (
              <p className={styles.chatEmpty}>저장된 대화가 없습니다</p>
            ) : (
              chats.map(chat => (
                <div key={chat.id} className={styles.chatItem}>
                  <div className={styles.chatItemLeft}>
                    <span className={styles.chatDate}>{formatChatDate(chat.created_at)}</span>
                    <span className={styles.chatPreview}>{getChatPreview(chat.messages)}</span>
                  </div>
                  <div className={styles.chatItemBtns}>
                    <button
                      className={styles.viewBtn}
                      style={{ color: mc.text, borderColor: mc.border }}
                      onClick={() => setViewChat(chat)}
                    >열람</button>
                    <button
                      className={styles.chatDelBtn}
                      onClick={() => handleDeleteChat(chat.id)}
                    >✕</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {viewChat && createPortal(
        <ChatViewModal chat={viewChat} onClose={() => setViewChat(null)} />,
        document.body
      )}
    </div>
  );
}
