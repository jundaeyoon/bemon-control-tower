import { useRef, useState, useEffect } from 'react';
import SlidePanel  from './SlidePanel';
import RoughCard    from '../rough/RoughCard';
import RoughButton  from '../rough/RoughButton';
import RoughInput   from '../rough/RoughInput';
import TodoDetailModal from './TodoDetailModal';
import IdeaDetailModal from './IdeaDetailModal';
import { getMemberColor, getMemberInitial } from '../../constants/memberColors';
import styles from './BrainstormSlidePanel.module.css';

const MEMBERS = ['JUN', 'SURI', 'SUNNY!', 'ZIN', 'LENA'];

const TABS = [
  { id: 'todos',     label: '할일',   emoji: '📋' },
  { id: 'feedback',  label: '피드백', emoji: '🔄' },
  { id: 'recording', label: '회의록', emoji: '🎬' },
];

// canvas fillStyle은 CSS 변수(var(...))를 해석하지 못해 검은 배경으로 렌더링되므로 실제 색상값을 사용
const CARD_COLORS = { fill: '#FFFFFF', stroke: '#D8D2C4' };
// hover 시에도 검정으로 떨어지지 않도록 hex로 명시 (살짝 어두운 크림색 + 다크브라운 글씨 유지)
const CARD_HOVER_COLORS = { hoverFill: '#F5F0E8', hoverStroke: '#4A3728' };

const TODO_STATUS = {
  todo:  { label: '할일',   color: '#9C9C94' },
  doing: { label: '진행중', color: '#C06850' },
  done:  { label: '완료',   color: '#4E5E42' },
};

const FEEDBACK_STATUS_CYCLE = { not_done: 'doing', doing: 'done', done: 'not_done' };
const FEEDBACK_STATUS_LABEL = { not_done: '❌ 미완료', doing: '🔄 진행중', done: '✅ 완료' };

export default function BrainstormSlidePanel({
  session, brainstorm, onClose,
}) {
  const [tab, setTab] = useState('todos');

  if (!session) return null;
  const sessionId = session.id;

  const todos      = brainstorm.todos.filter(t => t.session_id === sessionId);
  const feedbacks   = brainstorm.feedbacks.filter(f => f.session_id === sessionId);
  const recordings  = brainstorm.recordings.filter(r => r.session_id === sessionId);

  return (
    <SlidePanel title={session.title} emoji="💡" onClose={onClose} width={480}>
      <div className={styles.wrap}>
        <div className={styles.tabBar}>
          {TABS.map(t => (
            <button
              key={t.id}
              className={`${styles.tabBtn} ${tab === t.id ? styles.tabActive : ''}`}
              onClick={() => setTab(t.id)}
            >
              <span>{t.emoji}</span>{t.label}
            </button>
          ))}
        </div>

        <div className={styles.tabBody}>
          {tab === 'todos'     && <TodosTab     sessionId={sessionId} todos={todos}          brainstorm={brainstorm} />}
          {tab === 'feedback'  && <FeedbackTab  sessionId={sessionId} todos={todos} feedbacks={feedbacks} brainstorm={brainstorm} />}
          {tab === 'recording' && <RecordingTab sessionId={sessionId} recordings={recordings} brainstorm={brainstorm} />}
        </div>
      </div>
    </SlidePanel>
  );
}

// ── 할일 ────────────────────────────────────────────────────────────────────

function TodosTab({ sessionId, todos, brainstorm }) {
  const [content,    setContent]    = useState('');
  const [assignee,   setAssignee]   = useState(null);
  const [activeTodo, setActiveTodo] = useState(null);

  const handleAdd = () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    brainstorm.addTodo(sessionId, trimmed, assignee);
    setContent('');
  };

  return (
    <div className={styles.tabContent}>
      <div className={styles.addRow}>
        <RoughInput placeholder="새 할일 입력..." value={content} onChange={e => setContent(e.target.value)} />
        <MemberPicker value={assignee} onChange={setAssignee} />
        <RoughButton size="sm" variant="secondary" onClick={handleAdd} disabled={!content.trim()}>추가</RoughButton>
      </div>

      <div className={styles.list}>
        {todos.length === 0 && <p className={styles.empty}>등록된 할일이 없습니다.</p>}
        {todos.map(t => {
          const st = TODO_STATUS[t.status] ?? TODO_STATUS.todo;
          return (
            <RoughCard
              key={t.id}
              padding="12px 14px"
              seed={t.id.charCodeAt(0)}
              hoverable
              {...CARD_COLORS}
              {...CARD_HOVER_COLORS}
              onClick={() => setActiveTodo(t)}
            >
              <div className={styles.todoCard}>
                <div className={styles.todoTopRow}>
                  <span className={styles.statusDot} style={{ background: st.color }} />
                  <EditableTodoTitle todo={t} done={t.status === 'done'} onSave={brainstorm.updateTodo} />
                  {t.assignee && <MemberAvatar name={t.assignee} />}
                  <button
                    className={styles.deleteIcon}
                    onClick={e => { e.stopPropagation(); brainstorm.deleteTodo(t.id); }}
                  >✕</button>
                </div>
                <span className={styles.statusBadge} style={{ color: st.color, borderColor: st.color }}>
                  {st.label}
                </span>
              </div>
            </RoughCard>
          );
        })}
      </div>

      {activeTodo && (
        <TodoDetailModal
          todo={activeTodo}
          onSave={brainstorm.updateTodo}
          onDelete={brainstorm.deleteTodo}
          onClose={() => setActiveTodo(null)}
        />
      )}
    </div>
  );
}

// ── 피드백 ──────────────────────────────────────────────────────────────────

function FeedbackTab({ sessionId, todos, feedbacks, brainstorm }) {
  return (
    <div className={styles.tabContent}>
      <div className={styles.list}>
        {todos.length === 0 && <p className={styles.empty}>이 세션에 등록된 할일이 없습니다.</p>}
        {todos.map(todo => {
          const fb = feedbacks.find(f => f.todo_id === todo.id);
          return (
            <FeedbackCard
              key={todo.id}
              sessionId={sessionId}
              todo={todo}
              feedback={fb}
              brainstorm={brainstorm}
            />
          );
        })}
      </div>
    </div>
  );
}

function FeedbackCard({ sessionId, todo, feedback, brainstorm }) {
  const [memo, setMemo] = useState(feedback?.content ?? '');
  const status = feedback?.status ?? 'not_done';

  const handleStatusClick = () => {
    const nextStatus = FEEDBACK_STATUS_CYCLE[status];
    brainstorm.upsertFeedbackForTodo(sessionId, todo, feedback, { status: nextStatus, content: memo });
  };

  const handleMemoBlur = () => {
    if (memo === (feedback?.content ?? '')) return;
    brainstorm.upsertFeedbackForTodo(sessionId, todo, feedback, { status, content: memo });
  };

  return (
    <RoughCard padding="12px 14px" seed={todo.id.charCodeAt(0)} {...CARD_COLORS}>
      <div className={styles.feedbackCard}>
        <div className={styles.todoTopRow}>
          <span className={styles.todoTitle}>{todo.content}</span>
          {todo.assignee && <MemberAvatar name={todo.assignee} />}
        </div>
        <button className={styles.feedbackStatusBtn} onClick={handleStatusClick}>
          {FEEDBACK_STATUS_LABEL[status]}
        </button>
        <input
          className={styles.feedbackMemoInput}
          value={memo}
          placeholder="피드백 메모..."
          onChange={e => setMemo(e.target.value)}
          onBlur={handleMemoBlur}
        />
      </div>
    </RoughCard>
  );
}

// ── 아이디어 뱅크 ────────────────────────────────────────────────────────────

function IdeasTab({ sessionId, ideas, brainstorm }) {
  const [title,      setTitle]      = useState('');
  const [content,    setContent]    = useState('');
  const [author,     setAuthor]     = useState(null);
  const [activeIdea, setActiveIdea] = useState(null);

  const handleAdd = () => {
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    if (!trimmedTitle && !trimmedContent) return;
    brainstorm.addIdea(sessionId, trimmedTitle, trimmedContent, author);
    setTitle('');
    setContent('');
  };

  const sorted   = [...ideas].sort((a, b) => b.votes - a.votes);
  const maxVotes = sorted[0]?.votes ?? 0;

  return (
    <div className={styles.tabContent}>
      <div className={styles.addRow}>
        <RoughInput placeholder="아이디어 제목..." value={title} onChange={e => setTitle(e.target.value)} />
        <MemberPicker value={author} onChange={setAuthor} />
      </div>
      <div className={styles.addRow}>
        <RoughInput placeholder="아이디어 내용..." value={content} onChange={e => setContent(e.target.value)} />
        <RoughButton size="sm" variant="secondary" onClick={handleAdd} disabled={!title.trim() && !content.trim()}>등록</RoughButton>
      </div>

      <div className={styles.list}>
        {sorted.length === 0 && <p className={styles.empty}>등록된 아이디어가 없습니다.</p>}
        {sorted.map(idea => {
          const adopted = maxVotes > 0 && idea.votes === maxVotes;
          return (
            <RoughCard
              key={idea.id}
              padding="10px 14px"
              seed={idea.id.charCodeAt(0)}
              hoverable
              {...CARD_COLORS}
              {...CARD_HOVER_COLORS}
              onClick={() => setActiveIdea(idea)}
            >
              <div className={styles.itemRow}>
                <span className={styles.itemTextCol}>
                  <span className={styles.itemTitle}>
                    {adopted && <span title="채택됨">🎉 </span>}
                    {idea.title || '(제목 없음)'}
                  </span>
                  {idea.content && <span className={styles.itemContent}>{idea.content}</span>}
                </span>
                {idea.author && <MemberAvatar name={idea.author} />}
                <button
                  className={styles.voteBtn}
                  onClick={e => { e.stopPropagation(); brainstorm.toggleVoteIdea(idea.id, 'me'); }}
                  title="투표"
                >👍 {idea.votes}</button>
                <button
                  className={styles.deleteIcon}
                  onClick={e => { e.stopPropagation(); brainstorm.deleteIdea(idea.id); }}
                >✕</button>
              </div>
            </RoughCard>
          );
        })}
      </div>

      {activeIdea && (
        <IdeaDetailModal
          idea={activeIdea}
          onSave={brainstorm.updateIdea}
          onDelete={brainstorm.deleteIdea}
          onClose={() => setActiveIdea(null)}
        />
      )}
    </div>
  );
}

// ── 회의록 ──────────────────────────────────────────────────────────────────

function RecordingTab({ sessionId, recordings, brainstorm }) {
  const [manualText, setManualText] = useState('');
  const [busy,        setBusy]      = useState(false);
  const fileInputRef = useRef(null);

  const summarize = async (transcript) => {
    const res = await fetch('/api/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? `요약 실패 (${res.status})`);
    }
    const { summary } = await res.json();
    return summary;
  };

  const handleManualSubmit = async () => {
    const trimmed = manualText.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      const summary = await summarize(trimmed);
      await brainstorm.addRecording(sessionId, { fileName: null, fileUrl: null, summary });
      setManualText('');
    } catch (err) {
      console.error('[RecordingTab] 요약 에러:', err);
      alert(`❌ 회의록 요약 실패\n${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  const handleFile = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      const fileUrl = await brainstorm.uploadRecordingFile(file);
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'content-type': file.type || 'application/octet-stream' },
        body: file,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `STT 실패 (${res.status})`);
      }
      const { transcript } = await res.json();
      const summary = await summarize(transcript);
      await brainstorm.addRecording(sessionId, { fileName: file.name, fileUrl, summary });
    } catch (err) {
      console.error('[RecordingTab] 업로드 에러:', err);
      alert(`❌ 회의록 처리 실패\n${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.tabContent}>
      <div className={styles.dropZone} onClick={() => fileInputRef.current?.click()}>
        <span className={styles.dropIcon}>🎬</span>
        <span className={styles.dropText}>{busy ? '처리 중...' : '클릭해서 영상/음성 파일 업로드 (AssemblyAI STT)'}</span>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,video/*"
          style={{ display: 'none' }}
          disabled={busy}
          onChange={e => { handleFile(e.target.files[0]); e.target.value = ''; }}
        />
      </div>

      <div className={styles.field}>
        <span className={styles.label}>또는 회의 내용을 직접 입력 (STT 대체)</span>
        <textarea
          className={styles.memoTextarea}
          value={manualText}
          placeholder="회의 내용을 텍스트로 붙여넣으세요..."
          onChange={e => setManualText(e.target.value)}
        />
        <RoughButton size="sm" variant="secondary" onClick={handleManualSubmit} disabled={busy || !manualText.trim()}>
          {busy ? '요약 중...' : 'Claude로 요약하기'}
        </RoughButton>
      </div>

      <div className={styles.list}>
        {recordings.length === 0 && <p className={styles.empty}>등록된 회의록이 없습니다.</p>}
        {recordings.map(r => (
          <RoughCard key={r.id} padding="12px 14px" seed={(r.file_name ?? r.id).charCodeAt(0)} {...CARD_COLORS}>
            {r.file_name && <div className={styles.recFileName}>📎 {r.file_name}</div>}
            <div className={styles.recSummary}>{r.summary ?? '요약 생성 중...'}</div>
          </RoughCard>
        ))}
      </div>
    </div>
  );
}

// ── 공용 ────────────────────────────────────────────────────────────────────

function EditableTodoTitle({ todo, onSave, done }) {
  const [editing, setEditing] = useState(false);
  const [value,   setValue]   = useState(todo.content);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = () => {
    const trimmed = value.trim();
    if (trimmed && trimmed !== todo.content) {
      onSave(todo.id, { content: trimmed });
    } else {
      setValue(todo.content);
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        className={styles.titleEditInput}
        value={value}
        onChange={e => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') { setValue(todo.content); setEditing(false); }
        }}
        onClick={e => e.stopPropagation()}
      />
    );
  }

  return (
    <span
      className={`${styles.todoTitle} ${done ? styles.itemDone : ''}`}
      title="클릭해서 수정"
      onClick={e => { e.stopPropagation(); setEditing(true); }}
    >
      {todo.content}
    </span>
  );
}

function MemberPicker({ value, onChange }) {
  return (
    <select
      className={styles.memberSelect}
      value={value ?? ''}
      onChange={e => onChange(e.target.value || null)}
    >
      <option value="">담당자</option>
      {MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
    </select>
  );
}

function MemberAvatar({ name }) {
  const mc = getMemberColor(name);
  return (
    <span
      className={styles.memberAvatar}
      style={{ background: mc.bg, color: mc.text, borderColor: mc.border }}
      title={name}
    >
      {getMemberInitial(name)}
    </span>
  );
}
