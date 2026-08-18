import { useState, useMemo, useCallback } from 'react';
import SlidePanel from './SlidePanel';
import WikiDocModal from '../modals/WikiDocModal';
import { MEMBERS, getMemberColor } from '../../constants/memberColors';
import { getWikiCategoryColor } from '../../constants/wikiCategoryColors';
import styles from './WikiPanel.module.css';

const FILTER_ALL = '전체';

function fmtDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function WikiPanel({ wikiHook, onClose }) {
  const { docs, addDoc, updateDoc } = wikiHook;

  const [search,       setSearch]       = useState('');
  const [categoryFilter, setCategoryFilter] = useState(FILTER_ALL);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDoc,   setEditingDoc]   = useState(null); // doc | null
  const [expandedIds,  setExpandedIds]  = useState(new Set());
  const [currentUser,  setCurrentUser]  = useState(() => localStorage.getItem('bemon_checkin_member'));
  const [showPicker,   setShowPicker]   = useState(false);

  const selectUser = (m) => {
    localStorage.setItem('bemon_checkin_member', m);
    setCurrentUser(m);
    setShowPicker(false);
  };

  const toggleExpand = useCallback((id) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // 기존에 쓰인 카테고리들 — 필터 칩과 새 문서 작성 시 추천 목록으로 재사용
  const categories = useMemo(() => {
    const set = new Set(docs.map(d => d.category).filter(Boolean));
    return [...set].sort((a, b) => a.localeCompare(b, 'ko'));
  }, [docs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return docs.filter(doc => {
      const matchesSearch = !q
        || doc.title.toLowerCase().includes(q)
        || doc.content.toLowerCase().includes(q);
      const matchesCategory = categoryFilter === FILTER_ALL || doc.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [docs, search, categoryFilter]);

  const handleAdd = async (fields) => {
    await addDoc({ ...fields, author: currentUser });
  };

  const handleSaveEdit = async (fields) => {
    if (!editingDoc) return;
    await updateDoc(editingDoc.id, { ...fields, editedBy: currentUser });
    setEditingDoc(null);
  };

  return (
    <SlidePanel title="모르면 여기!" emoji="🔖" onClose={onClose} width={560}>
      <div className={styles.wrap}>

        <div className={styles.toolbar}>
          <div className={styles.searchRow}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="🔍 제목/내용으로 검색... (예: 배송)"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button className={styles.addBtn} onClick={() => setShowAddModal(true)}>+ 새 문서 작성</button>
          </div>

          <div className={styles.chipRow}>
            {[FILTER_ALL, ...categories].map(cat => {
              const active = categoryFilter === cat;
              const cc = cat === FILTER_ALL ? null : getWikiCategoryColor(cat);
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
          <span className={styles.authorLabel}>내 이름</span>
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

        <div className={styles.list}>
          {filtered.length === 0 && (
            <p className={styles.empty}>
              {docs.length === 0
                ? '아직 등록된 문서가 없어요 🔖\n첫 문서를 작성해보세요!'
                : '검색 결과가 없어요'}
            </p>
          )}
          {filtered.map(doc => (
            <WikiDocCard
              key={doc.id}
              doc={doc}
              expanded={expandedIds.has(doc.id)}
              onToggle={() => toggleExpand(doc.id)}
              onEdit={() => setEditingDoc(doc)}
            />
          ))}
        </div>
      </div>

      {showAddModal && (
        <WikiDocModal
          existingCategories={categories}
          currentUser={currentUser}
          onSave={handleAdd}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {editingDoc && (
        <WikiDocModal
          initialDoc={editingDoc}
          existingCategories={categories}
          currentUser={currentUser}
          onSave={handleSaveEdit}
          onClose={() => setEditingDoc(null)}
        />
      )}
    </SlidePanel>
  );
}

function WikiDocCard({ doc, expanded, onToggle, onEdit }) {
  const cc = getWikiCategoryColor(doc.category);
  const editorColor = doc.last_edited_by ? getMemberColor(doc.last_edited_by) : null;

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader} onClick={onToggle}>
        <span
          className={styles.categoryBadge}
          style={{ background: cc.bg, color: cc.text, borderColor: cc.border }}
        >
          {doc.category}
        </span>
        <span className={styles.cardTitle}>{doc.title}</span>
        <span className={styles.cardMeta}>{doc.author ?? '작성자 미상'} · {fmtDate(doc.updated_at)}</span>
        <span className={`${styles.arrow} ${expanded ? styles.arrowOpen : ''}`}>▼</span>
      </div>

      {expanded && (
        <div className={styles.cardBody}>
          <p className={styles.content}>{doc.content}</p>

          <div className={styles.cardFooter}>
            <span className={styles.editMeta}>
              작성: {doc.author ?? '미상'} · {fmtDate(doc.created_at)}
              {doc.last_edited_by && (
                <>
                  {' '}· 최종 수정:{' '}
                  <span style={{ color: editorColor?.text, fontWeight: 700 }}>{doc.last_edited_by}</span>
                  {' '}· {fmtDate(doc.updated_at)}
                </>
              )}
            </span>
            <button className={styles.editBtn} onClick={onEdit}>✏️ 수정</button>
          </div>
        </div>
      )}
    </div>
  );
}
