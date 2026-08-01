import { useState, useMemo, useCallback } from 'react';
import SlidePanel from './SlidePanel';
import AddFootprintModal from '../modals/AddFootprintModal';
import { MEMBERS, getMemberColor, getMemberInitial } from '../../constants/memberColors';
import { CATEGORIES, getCategoryColor } from '../../constants/footprintCategories';
import { FEEDBACK_CATEGORIES, getFeedbackCategoryColor } from '../../constants/feedbackCategories';
import styles from './FootprintPanel.module.css';

const FILTER_ALL = '전체';

function fmtDate(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function FootprintPanel({ footprintsHook, onClose }) {
  const { footprints, addFootprint, addFeedback } = footprintsHook;

  const [search,         setSearch]         = useState('');
  const [categoryFilter, setCategoryFilter] = useState(FILTER_ALL);
  const [showAddModal,   setShowAddModal]   = useState(false);
  const [collapsedIds,   setCollapsedIds]   = useState(new Set());
  const [currentUser,    setCurrentUser]    = useState(() => localStorage.getItem('bemon_checkin_member'));
  const [showPicker,     setShowPicker]     = useState(false);

  const selectUser = (m) => {
    localStorage.setItem('bemon_checkin_member', m);
    setCurrentUser(m);
    setShowPicker(false);
  };

  const toggleCollapse = useCallback((id) => {
    setCollapsedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = footprints.filter(fp => {
      const matchesSearch   = !q || fp.title.toLowerCase().includes(q);
      const matchesCategory = categoryFilter === FILTER_ALL || fp.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
    const byYear = {};
    filtered.forEach(fp => {
      const year = fp.date.slice(0, 4);
      (byYear[year] ??= []).push(fp);
    });
    return Object.keys(byYear)
      .sort((a, b) => b.localeCompare(a))
      .map(year => ({ year, items: byYear[year] }));
  }, [footprints, search, categoryFilter]);

  return (
    <SlidePanel title="베몽의 발자국들" emoji="🐾" onClose={onClose} width={560}>
      <div className={styles.wrap}>

        <div className={styles.toolbar}>
          <div className={styles.searchRow}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="🔍 제목/키워드로 검색... (예: 여름)"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button className={styles.addBtn} onClick={() => setShowAddModal(true)}>+ 추가</button>
          </div>

          <div className={styles.chipRow}>
            {[FILTER_ALL, ...CATEGORIES].map(cat => {
              const active = categoryFilter === cat;
              const cc = cat === FILTER_ALL ? null : getCategoryColor(cat);
              return (
                <button
                  key={cat}
                  className={`${styles.chip} ${active ? styles.chipActive : ''}`}
                  style={active && cc ? { borderColor: cc.border, color: cc.text, background: cc.bg } : {}}
                  onClick={() => setCategoryFilter(cat)}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        <div className={styles.authorBar}>
          <span className={styles.authorLabel}>피드백 작성자</span>
          {currentUser ? (
            <button className={styles.currentUserBtn} onClick={() => setShowPicker(p => !p)}>
              {currentUser} ▾
            </button>
          ) : (
            <button className={styles.selectUserBtn} onClick={() => setShowPicker(p => !p)}>
              이름 선택
            </button>
          )}
          {showPicker && (
            <div className={styles.memberPicker}>
              {MEMBERS.map(m => (
                <button key={m} className={styles.pickerBtn} onClick={() => selectUser(m)}>{m}</button>
              ))}
            </div>
          )}
        </div>

        <div className={styles.timeline}>
          {grouped.length === 0 && (
            <p className={styles.empty}>
              {footprints.length === 0
                ? '아직 기록된 발자국이 없어요 🐾\n첫 발자국을 남겨보세요!'
                : '검색 결과가 없어요'}
            </p>
          )}
          {grouped.map(({ year, items }) => (
            <div key={year} className={styles.yearGroup}>
              <div className={styles.yearLabel}>{year}</div>
              <div className={styles.yearList}>
                {items.map(fp => (
                  <FootprintCard
                    key={fp.id}
                    footprint={fp}
                    currentUser={currentUser}
                    collapsed={collapsedIds.has(fp.id)}
                    onToggleCollapse={() => toggleCollapse(fp.id)}
                    onAddFeedback={(content, category) => addFeedback(fp.id, { content, author: currentUser, category })}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showAddModal && (
        <AddFootprintModal
          onAdd={(fields) => addFootprint({ ...fields, author: currentUser })}
          currentUser={currentUser}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </SlidePanel>
  );
}

function FootprintCard({ footprint, currentUser, collapsed, onToggleCollapse, onAddFeedback }) {
  const [draft,            setDraft]            = useState('');
  const [draftCategory,    setDraftCategory]    = useState('일반');
  const [adding,           setAdding]           = useState(false);
  const [showInput,        setShowInput]        = useState(false);
  const cc = getCategoryColor(footprint.category);
  const feedbacks = footprint.footprint_feedbacks ?? [];

  const handleAdd = async () => {
    const trimmed = draft.trim();
    if (!trimmed || !currentUser) return;
    setAdding(true);
    await onAddFeedback(trimmed, draftCategory);
    setAdding(false);
    setDraft('');
    setDraftCategory('일반');
    setShowInput(false);
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader} onClick={onToggleCollapse}>
        <span
          className={styles.categoryBadge}
          style={{ background: cc.bg, color: cc.text, borderColor: cc.border }}
        >
          {footprint.category}
        </span>
        <span className={styles.cardTitle}>{footprint.title}</span>
        <span className={styles.cardDate}>{fmtDate(footprint.date)}</span>
        {feedbacks.length > 0 && (
          <span className={styles.feedbackCount}>💬 {feedbacks.length}</span>
        )}
        <span className={`${styles.arrow} ${collapsed ? '' : styles.arrowOpen}`}>▼</span>
      </div>

      {!collapsed && (
        <div className={styles.cardBody}>
          {footprint.description && (
            <p className={styles.description}>{footprint.description}</p>
          )}

          <div className={styles.feedbackSection}>
            {feedbacks.length > 0 && (
              <div className={styles.feedbackList}>
                {feedbacks.map(fb => {
                  const mc = getMemberColor(fb.author);
                  const fbCat = fb.category ?? '일반';
                  const fcc = getFeedbackCategoryColor(fbCat);
                  return (
                    <div key={fb.id} className={styles.feedbackItem}>
                      <span
                        className={styles.feedbackAvatar}
                        style={{ background: mc.bg, color: mc.text, borderColor: mc.border }}
                        title={fb.author}
                      >
                        {getMemberInitial(fb.author)}
                      </span>
                      <div className={styles.feedbackTextCol}>
                        <span className={styles.feedbackContent}>
                          <span
                            className={styles.feedbackCategoryTag}
                            style={{ background: fcc.bg, color: fcc.text, borderColor: fcc.border }}
                          >
                            {fbCat}
                          </span>
                          {fb.content}
                        </span>
                        <span className={styles.feedbackMeta}>{fb.author} · {fmtDate(fb.created_at?.slice(0, 10) ?? footprint.date)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {showInput ? (
              <div className={styles.feedbackAddRow}>
                <div className={styles.feedbackCategoryPicker}>
                  {FEEDBACK_CATEGORIES.map(cat => {
                    const active = draftCategory === cat;
                    const fcc = getFeedbackCategoryColor(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        className={`${styles.feedbackCategoryPickBtn} ${active ? styles.feedbackCategoryPickBtnActive : ''}`}
                        style={active ? { borderColor: fcc.border, color: fcc.text, background: fcc.bg } : {}}
                        onClick={() => setDraftCategory(cat)}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
                <textarea
                  className={styles.feedbackInput}
                  placeholder={currentUser ? '피드백을 남겨보세요...' : '먼저 상단에서 이름을 선택해주세요'}
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  disabled={!currentUser}
                  rows={2}
                  autoFocus
                />
                <div className={styles.feedbackAddActions}>
                  <button className={styles.feedbackCancelBtn} onClick={() => { setShowInput(false); setDraft(''); }}>취소</button>
                  <button
                    className={styles.feedbackSubmitBtn}
                    onClick={handleAdd}
                    disabled={!draft.trim() || !currentUser || adding}
                  >
                    {adding ? '저장 중...' : '등록'}
                  </button>
                </div>
              </div>
            ) : (
              <button className={styles.feedbackAddBtn} onClick={() => setShowInput(true)}>
                💬 피드백 추가
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
