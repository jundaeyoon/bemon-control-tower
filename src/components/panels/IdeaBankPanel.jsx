import { useState } from 'react';
import SlidePanel     from './SlidePanel';
import RoughCard      from '../rough/RoughCard';
import RoughButton    from '../rough/RoughButton';
import RoughInput     from '../rough/RoughInput';
import IdeaDetailModal from './IdeaDetailModal';
import { getMemberColor, getMemberInitial } from '../../constants/memberColors';
import styles from './IdeaBankPanel.module.css';

const MEMBERS = ['JUN', 'SURI', 'SUNNY!', 'LENA'];

const CARD_COLORS       = { fill: '#FFFFFF', stroke: '#D8D2C4' };
const CARD_HOVER_COLORS = { hoverFill: '#FFF5FB', hoverStroke: '#EC4899' };

export default function IdeaBankPanel({ ideaBankHook, onClose }) {
  const [title,      setTitle]      = useState('');
  const [content,    setContent]    = useState('');
  const [author,     setAuthor]     = useState(null);
  const [activeIdea, setActiveIdea] = useState(null);

  const { ideas, addIdea, updateIdea, toggleUpvote, toggleDownvote, deleteIdea } = ideaBankHook;

  const handleAdd = () => {
    const t = title.trim();
    const c = content.trim();
    if (!t && !c) return;
    addIdea(t, c, author);
    setTitle('');
    setContent('');
    setAuthor(null);
  };

  const sorted = [...ideas].sort((a, b) =>
    ((b.votes ?? 0) - (b.downvotes ?? 0)) - ((a.votes ?? 0) - (a.downvotes ?? 0))
  );

  return (
    <SlidePanel title="이건 대박!" emoji="💡" onClose={onClose} width={480}>
      <div className={styles.wrap}>

        {/* 입력 폼 */}
        <div className={styles.addSection}>
          <div className={styles.addRow}>
            <RoughInput
              placeholder="아이디어 제목..."
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
            <MemberPicker value={author} onChange={setAuthor} />
          </div>
          <div className={styles.addRow}>
            <RoughInput
              placeholder="아이디어 내용..."
              value={content}
              onChange={e => setContent(e.target.value)}
            />
            <RoughButton
              size="sm"
              variant="secondary"
              onClick={handleAdd}
              disabled={!title.trim() && !content.trim()}
            >
              등록
            </RoughButton>
          </div>
        </div>

        {/* 아이디어 리스트 */}
        <div className={styles.list}>
          {sorted.length === 0 && (
            <p className={styles.empty}>아직 아이디어가 없습니다 💡</p>
          )}
          {sorted.map(idea => {
            const upvotes   = idea.votes    ?? 0;
            const downvotes = idea.downvotes ?? 0;
            const net = upvotes - downvotes;
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
                <div className={styles.ideaRow}>
                  <span className={styles.ideaTextCol}>
                    <span className={styles.ideaTitle}>
                      {net >= 3 && <span title="인기 아이디어">🎉 </span>}
                      {idea.title || '(제목 없음)'}
                    </span>
                    {idea.content && (
                      <span className={styles.ideaContent}>{idea.content}</span>
                    )}
                  </span>
                  {idea.author && <MemberAvatar name={idea.author} />}
                  <button
                    className={`${styles.voteBtn} ${upvotes > 0 ? styles.upActive : ''}`}
                    onClick={e => { e.stopPropagation(); toggleUpvote(idea.id); }}
                    title="찬성"
                  >👍 {upvotes}</button>
                  <button
                    className={`${styles.voteBtn} ${downvotes > 0 ? styles.downActive : ''}`}
                    onClick={e => { e.stopPropagation(); toggleDownvote(idea.id); }}
                    title="반대"
                  >👎 {downvotes}</button>
                  <button
                    className={styles.deleteIcon}
                    onClick={e => { e.stopPropagation(); deleteIdea(idea.id); }}
                    title="삭제"
                  >✕</button>
                </div>
              </RoughCard>
            );
          })}
        </div>
      </div>

      {activeIdea && (
        <IdeaDetailModal
          idea={activeIdea}
          onSave={updateIdea}
          onDelete={deleteIdea}
          onClose={() => setActiveIdea(null)}
        />
      )}
    </SlidePanel>
  );
}

function MemberPicker({ value, onChange }) {
  return (
    <select
      className={styles.memberSelect}
      value={value ?? ''}
      onChange={e => onChange(e.target.value || null)}
    >
      <option value="">작성자</option>
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
