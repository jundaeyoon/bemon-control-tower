import { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import SlidePanel from './SlidePanel';
import styles from './InfluencerPanel.module.css';

function ImagePreview({ url, name, onClose }) {
  return createPortal(
    <div className={styles.previewBackdrop} onClick={onClose}>
      <button className={styles.previewClose} onClick={onClose} aria-label="닫기">✕</button>
      <img
        className={styles.previewImg}
        src={url}
        alt={name}
        onClick={e => e.stopPropagation()}
      />
    </div>,
    document.body
  );
}

const MEMBERS = ['JUN', 'SURI', 'SUNNY!', 'LENA'];
const TYPE_LABEL = { reels: '📱 릴스', post: '🖼️ 게시물' };

export default function InfluencerPanel({ influencerHook, onClose }) {
  const { missions, addMission, updateMission, toggleComplete, deleteMission, uploadImage, removeImage, addLink, removeLink } = influencerHook;
  const [currentUser, setCurrentUser] = useState(() => localStorage.getItem('bemon_checkin_member'));
  const [showPicker, setShowPicker] = useState(false);
  const [expandedIds, setExpandedIds] = useState(new Set());

  const selectUser = (m) => {
    localStorage.setItem('bemon_checkin_member', m);
    setCurrentUser(m);
    setShowPicker(false);
  };

  const handleAddMission = async () => {
    const newMission = await addMission({ type: 'reels', title: '', content: '', scheduled_date: null, author: currentUser ?? '' });
    if (newMission?.id) {
      setExpandedIds(prev => new Set([...prev, newMission.id]));
    }
  };

  const toggleExpand = useCallback((id) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return (
    <SlidePanel title="바지에 미친 사람들! (컨텐츠)" emoji="🌟" onClose={onClose} width={520}>
      <div className={styles.wrap}>
        {/* Author bar */}
        <div className={styles.authorBar}>
          {currentUser ? (
            <>
              <button className={styles.currentUserBtn} onClick={() => setShowPicker(p => !p)}>
                {currentUser} ▾
              </button>
              <button className={styles.addBtn} onClick={handleAddMission}>+ 임무 추가</button>
            </>
          ) : (
            <button className={styles.selectUserBtn} onClick={() => setShowPicker(p => !p)}>
              이름 선택
            </button>
          )}
        </div>

        {showPicker && (
          <div className={styles.memberPicker}>
            {MEMBERS.map(m => (
              <button key={m} className={styles.pickerBtn} onClick={() => selectUser(m)}>{m}</button>
            ))}
          </div>
        )}

        {/* Missions list */}
        <div className={styles.list}>
          {missions.length === 0 && (
            <p className={styles.empty}>아직 임무가 없어요 🌟<br />임무를 추가해 보세요!</p>
          )}
          {missions.map(mission => (
            <MissionCard
              key={mission.id}
              mission={mission}
              isOpen={expandedIds.has(mission.id)}
              onToggleOpen={() => toggleExpand(mission.id)}
              onUpdate={(fields) => updateMission(mission.id, fields)}
              onToggle={() => toggleComplete(mission.id)}
              onDelete={() => deleteMission(mission.id)}
              onUploadImage={(file) => uploadImage(mission.id, file)}
              onRemoveImage={(imgId) => removeImage(mission.id, imgId)}
              onAddLink={(url) => addLink(mission.id, url)}
              onRemoveLink={(linkId) => removeLink(mission.id, linkId)}
            />
          ))}
        </div>
      </div>
    </SlidePanel>
  );
}

function MissionCard({ mission, isOpen, onToggleOpen, onUpdate, onToggle, onDelete, onUploadImage, onRemoveImage, onAddLink, onRemoveLink }) {
  const fileInputRef = useRef(null);
  const [linkDraft, setLinkDraft] = useState('');
  const [titleDraft, setTitleDraft] = useState(mission.title ?? '');
  const [contentDraft, setContentDraft] = useState(mission.content ?? '');
  const [uploadError, setUploadError] = useState(null);
  const [previewImg, setPreviewImg] = useState(null);
  const composingRef = useRef(false);
  const titleComposingRef = useRef(false);

  const handleFileChange = useCallback(async (e) => {
    const files = Array.from(e.target.files ?? []);
    setUploadError(null);
    for (const file of files) {
      const result = await onUploadImage(file);
      if (result?.error) { setUploadError(result.error); break; }
    }
    e.target.value = '';
  }, [onUploadImage]);

  const handleAddLink = useCallback(() => {
    const url = linkDraft.trim();
    if (!url) return;
    onAddLink(url);
    setLinkDraft('');
  }, [linkDraft, onAddLink]);

  const displayTitle = mission.title?.trim() || '(제목 없음)';
  const hasTitle = !!mission.title?.trim();

  return (
    <div className={`${styles.card} ${mission.completed ? styles.cardCompleted : ''}`}>

      {/* ── Accordion header (항상 표시) ── */}
      <div className={styles.cardHeader} onClick={onToggleOpen}>
        <input
          type="checkbox"
          className={styles.checkBox}
          checked={mission.completed}
          onChange={onToggle}
          onClick={e => e.stopPropagation()}
          title="완료 체크"
        />
        <span className={styles.typeBadge}>{TYPE_LABEL[mission.type] ?? '📱 릴스'}</span>
        <span className={`${styles.headerTitle} ${mission.completed ? styles.headerTitleDone : ''} ${!hasTitle ? styles.headerTitleEmpty : ''}`}>
          {displayTitle}
        </span>
        {mission.author && (
          <span className={styles.authorBadge} title={mission.author}>
            <span className={styles.authorAvatar}>{mission.author[0]}</span>
            {mission.author}
          </span>
        )}
        {mission.scheduled_date && (
          <span className={styles.dateBadge}>{mission.scheduled_date}</span>
        )}
        <span className={`${styles.arrow} ${isOpen ? styles.arrowOpen : ''}`}>▼</span>
      </div>

      {/* ── Accordion body (접기/펼치기) ── */}
      <div className={`${styles.cardBody} ${isOpen ? styles.cardBodyOpen : ''}`}>
        <div className={styles.cardBodyInner}>

          {/* Type radio */}
          <div className={styles.typeRow}>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name={`type-${mission.id}`}
                value="reels"
                checked={mission.type === 'reels'}
                onChange={() => onUpdate({ type: 'reels' })}
              />
              📱 릴스
            </label>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name={`type-${mission.id}`}
                value="post"
                checked={mission.type === 'post'}
                onChange={() => onUpdate({ type: 'post' })}
              />
              🖼️ 게시물
            </label>
          </div>

          {/* Title */}
          <input
            type="text"
            className={`${styles.titleInput} ${mission.completed ? styles.contentInputDone : ''}`}
            placeholder="임무 제목..."
            value={titleDraft}
            onChange={e => {
              setTitleDraft(e.target.value);
              if (!titleComposingRef.current) onUpdate({ title: e.target.value });
            }}
            onCompositionStart={() => { titleComposingRef.current = true; }}
            onCompositionEnd={e => { titleComposingRef.current = false; onUpdate({ title: e.target.value }); }}
          />

          {/* Content */}
          <textarea
            className={`${styles.contentInput} ${mission.completed ? styles.contentInputDone : ''}`}
            placeholder="무엇을 올릴지 자세히 적어주세요..."
            value={contentDraft}
            onChange={e => {
              setContentDraft(e.target.value);
              if (!composingRef.current) onUpdate({ content: e.target.value });
            }}
            onCompositionStart={() => { composingRef.current = true; }}
            onCompositionEnd={e => { composingRef.current = false; onUpdate({ content: e.target.value }); }}
          />

          {/* Date */}
          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>📅 업로드 날짜</span>
            <input
              type="date"
              className={styles.dateInput}
              value={mission.scheduled_date ?? ''}
              onChange={e => onUpdate({ scheduled_date: e.target.value || null })}
            />
          </div>

          {/* Reference images */}
          <div className={styles.imagesSection}>
            <span className={styles.sectionLabel}>🖼️ 레퍼런스 이미지</span>
            {uploadError && <span className={styles.uploadError}>{uploadError}</span>}
            <div className={styles.imageGrid}>
              {(mission.ref_images ?? []).map(img => (
                <div
                  key={img.id}
                  className={styles.imgThumb}
                  title={img.name}
                  onClick={() => setPreviewImg(img)}
                >
                  <img src={img.url} alt={img.name} />
                  <button
                    className={styles.imgRemove}
                    onClick={e => { e.stopPropagation(); onRemoveImage(img.id); }}
                    title="이미지 삭제"
                  >✕</button>
                </div>
              ))}
              <button
                className={styles.imgUploadBtn}
                onClick={() => fileInputRef.current?.click()}
                title="이미지 업로드"
              >+</button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </div>
          </div>

          {/* Reference links */}
          <div className={styles.linksSection}>
            <span className={styles.sectionLabel}>🔗 레퍼런스 링크</span>
            <div className={styles.linkAddRow}>
              <input
                type="url"
                className={styles.linkInput}
                placeholder="https://..."
                value={linkDraft}
                onChange={e => setLinkDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddLink(); }}
              />
              <button className={styles.linkAddIconBtn} onClick={handleAddLink} title="링크 추가">+</button>
            </div>
            {(mission.ref_links ?? []).length > 0 && (
              <div className={styles.linkList}>
                {(mission.ref_links ?? []).map(link => (
                  <div key={link.id} className={styles.linkItem}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.linkAnchor}
                      title={link.url}
                    >
                      {link.url}
                    </a>
                    <button
                      className={styles.linkRemove}
                      onClick={() => onRemoveLink(link.id)}
                      title="링크 삭제"
                    >✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Delete */}
          <button
            className={styles.deleteBtn}
            onClick={() => { if (window.confirm('이 임무를 삭제할까요?')) onDelete(); }}
            title="임무 삭제"
          >
            🗑️ 삭제
          </button>

        </div>
      </div>

      {previewImg && (
        <ImagePreview
          url={previewImg.url}
          name={previewImg.name}
          onClose={() => setPreviewImg(null)}
        />
      )}
    </div>
  );
}
