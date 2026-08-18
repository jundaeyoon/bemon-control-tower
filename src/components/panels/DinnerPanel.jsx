import { useState, useMemo } from 'react';
import SlidePanel from './SlidePanel';
import { MEMBERS, getMemberColor, getMemberInitial } from '../../constants/memberColors';
import styles from './DinnerPanel.module.css';

const STATUS_OPTIONS = ['참석', '불참', '미정'];
const STATUS_EMOJI   = { 참석: '🙋', 불참: '🙅', 미정: '🤷' };

function fmtDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(`${dateStr}T00:00:00`);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function DinnerPanel({ dinnerHook, onClose }) {
  const { dinner, attendees, menus, updateDinnerInfo, setAttendeeStatus, addMenu, toggleMenuVote } = dinnerHook;

  const [newMenu,       setNewMenu]       = useState('');
  const [voter,         setVoter]         = useState(() => localStorage.getItem('bemon_checkin_member'));
  const [showVoterPick, setShowVoterPick] = useState(false);

  const selectVoter = (m) => {
    localStorage.setItem('bemon_checkin_member', m);
    setVoter(m);
    setShowVoterPick(false);
  };

  const counts = useMemo(() => {
    const c = { 참석: 0, 불참: 0, 미정: 0 };
    MEMBERS.forEach(m => {
      const status = attendees.find(a => a.member === m)?.status ?? '미정';
      c[status] = (c[status] ?? 0) + 1;
    });
    return c;
  }, [attendees]);

  const sortedMenus = useMemo(
    () => [...menus].sort((a, b) => (b.voted_by?.length ?? 0) - (a.voted_by?.length ?? 0)),
    [menus]
  );

  const handleAddMenu = () => {
    if (!newMenu.trim()) return;
    addMenu(newMenu);
    setNewMenu('');
  };

  return (
    <SlidePanel title="공포의 회식" emoji="😱" onClose={onClose} width={480}>
      <div className={styles.wrap}>

        {/* 날짜 / 장소 — dinner?.id로 key를 걸어, 서버 값이 (처음) 로드됐을 때
            useEffect 없이 자연스럽게 초기값이 반영되도록 함 */}
        <DinnerInfoForm
          key={dinner?.id ?? 'new'}
          dinner={dinner}
          onSave={updateDinnerInfo}
        />

        {/* 참석자 */}
        <div className={styles.section}>
          <span className={styles.sectionTitle}>💀 참석 여부</span>
          <span className={styles.attendeeSummary}>
            참석 {counts.참석}명 · 불참 {counts.불참}명 · 미정 {counts.미정}명
          </span>
          <div className={styles.attendeeList}>
            {MEMBERS.map(m => {
              const status = attendees.find(a => a.member === m)?.status ?? '미정';
              const mc = getMemberColor(m);
              return (
                <div key={m} className={styles.attendeeRow}>
                  <span
                    className={styles.attendeeAvatar}
                    style={{ background: mc.bg, color: mc.text, borderColor: mc.border }}
                  >
                    {getMemberInitial(m)}
                  </span>
                  <span className={styles.attendeeName}>{m}</span>
                  <div className={styles.statusBtns}>
                    {STATUS_OPTIONS.map(opt => (
                      <button
                        key={opt}
                        className={`${styles.statusBtn} ${styles['status_' + opt]} ${status === opt ? styles.statusBtnActive : ''}`}
                        onClick={() => setAttendeeStatus(m, opt)}
                      >
                        {STATUS_EMOJI[opt]} {opt}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 메뉴 투표 */}
        <div className={styles.section}>
          <span className={styles.sectionTitle}>🍖 메뉴 정하기</span>

          <div className={styles.voterBar}>
            <span className={styles.voterLabel}>내 투표</span>
            <button className={styles.voterBtn} onClick={() => setShowVoterPick(p => !p)}>
              {voter ? `${voter} ▾` : '이름 선택'}
            </button>
            {showVoterPick && (
              <div className={styles.voterPicker}>
                {MEMBERS.map(m => (
                  <button key={m} className={styles.voterPickBtn} onClick={() => selectVoter(m)}>{m}</button>
                ))}
              </div>
            )}
          </div>

          <div className={styles.menuAddRow}>
            <input
              type="text"
              className={styles.menuInput}
              placeholder="메뉴 후보 추가... (예: 삼겹살)"
              value={newMenu}
              onChange={e => setNewMenu(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddMenu(); }}
            />
            <button className={styles.menuAddBtn} onClick={handleAddMenu} disabled={!newMenu.trim()}>
              + 추가
            </button>
          </div>

          <div className={styles.menuList}>
            {sortedMenus.length === 0 && (
              <p className={styles.menuEmpty}>아직 후보 메뉴가 없어요 🍽</p>
            )}
            {sortedMenus.map((menu, i) => {
              const voters = menu.voted_by ?? [];
              const votedByMe = voter && voters.includes(voter);
              return (
                <div key={menu.id} className={styles.menuRow}>
                  <span className={styles.menuRank}>{i + 1}</span>
                  <span className={styles.menuName}>{menu.menu_name}</span>
                  <button
                    className={`${styles.voteBtn} ${votedByMe ? styles.voteBtnActive : ''}`}
                    onClick={() => toggleMenuVote(menu.id, voter)}
                    disabled={!voter}
                    title={voter ? (votedByMe ? '투표 취소' : '투표하기') : '먼저 이름을 선택해주세요'}
                  >
                    👍 {voters.length}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </SlidePanel>
  );
}

function DinnerInfoForm({ dinner, onSave }) {
  const [dateInput,     setDateInput]     = useState(dinner?.date ?? '');
  const [locationInput, setLocationInput] = useState(dinner?.location ?? '');
  const [saving,        setSaving]        = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave({ date: dateInput, location: locationInput });
    setSaving(false);
  };

  return (
    <div className={styles.section}>
      <span className={styles.sectionTitle}>📅 언제, 어디서</span>
      {!dinner?.date && (
        <p className={styles.infoHint}>👻 날짜를 정해주세요...</p>
      )}
      <div className={styles.infoRow}>
        <input
          type="date"
          className={styles.infoInput}
          value={dateInput}
          onChange={e => setDateInput(e.target.value)}
        />
        <input
          type="text"
          className={styles.infoInput}
          placeholder="장소 (예: 을지로 골뱅이 골목)"
          value={locationInput}
          onChange={e => setLocationInput(e.target.value)}
        />
        <button className={styles.infoSaveBtn} onClick={handleSave} disabled={saving}>
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>
      {dinner?.date && (
        <span className={styles.attendeeSummary}>
          🗓 {fmtDate(dinner.date)}{dinner.location ? ` · 📍 ${dinner.location}` : ''}
        </span>
      )}
    </div>
  );
}
