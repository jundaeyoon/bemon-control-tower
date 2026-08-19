import { useState, useMemo } from 'react';
import SlidePanel from './SlidePanel';
import { useDinnerDetail } from '../../hooks/useCompanyDinner';
import { MEMBERS, getMemberColor, getMemberInitial } from '../../constants/memberColors';
import styles from './DinnerPanel.module.css';

const STATUS_OPTIONS = ['참석', '불참', '미정'];
const STATUS_EMOJI   = { 참석: '🙋', 불참: '🙅', 미정: '🤷' };

const FEAR_LEVELS = [
  { max: 20,  emoji: '😌', text: '평화로움' },
  { max: 40,  emoji: '😐', text: '살짝 긴장' },
  { max: 60,  emoji: '😨', text: '공포 상승중' },
  { max: 80,  emoji: '😱', text: '공포의 서막' },
  { max: 100, emoji: '💀', text: '이것은 재앙이다' },
];

function fmtDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(`${dateStr}T00:00:00`);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

// 참석/불참/미정 현황 + 회식 id를 씨앗 삼은 고정 지터로, 매번 바뀌진 않지만
// "그때그때 다른 느낌"의 공포 지수를 만든다.
function calcFearIndex(attendees, dinnerId) {
  const declined  = attendees.filter(a => a.status === '불참').length;
  const responded = attendees.filter(a => a.status === '참석' || a.status === '불참').length;
  const undecided = MEMBERS.length - responded;
  const base = ((declined + undecided * 0.5) / MEMBERS.length) * 100;

  let hash = 0;
  for (const ch of dinnerId ?? '') hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const jitter = (hash % 15) - 7; // -7 ~ +7

  return Math.min(100, Math.max(0, Math.round(base + jitter)));
}

function getFearLevel(index) {
  return FEAR_LEVELS.find(l => index <= l.max) ?? FEAR_LEVELS[FEAR_LEVELS.length - 1];
}

function calcDday(dateStr) {
  if (!dateStr) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(`${dateStr}T00:00:00`);
  const diff = Math.round((d - today) / 86400000);
  if (diff === 0) return 'D-DAY';
  if (diff > 0)  return `D-${diff}`;
  return '종료';
}

export default function DinnerPanel({ dinnerHook, onClose }) {
  const { dinners, addDinner, updateDinner, refreshDinners } = dinnerHook;
  const [selectedId, setSelectedId] = useState(null);

  const selectedDinner = dinners.find(d => d.id === selectedId) ?? null;

  const handleAdd = async () => {
    const created = await addDinner();
    if (created) setSelectedId(created.id);
  };

  const handleBack = () => {
    refreshDinners(); // 상세에서 바뀐 참석 인원수를 목록 배지에 반영
    setSelectedId(null);
  };

  return (
    <SlidePanel title="공포의 회식" emoji="😱" onClose={onClose} width={480}>
      {selectedDinner ? (
        <DinnerDetail
          key={selectedDinner.id}
          dinner={selectedDinner}
          onBack={handleBack}
          onUpdateDinner={updateDinner}
        />
      ) : (
        <DinnerList dinners={dinners} onAdd={handleAdd} onSelect={setSelectedId} />
      )}
    </SlidePanel>
  );
}

function DinnerList({ dinners, onAdd, onSelect }) {
  return (
    <div className={styles.wrap}>
      <button className={styles.bigAddBtn} onClick={onAdd}>+ 회식 추가</button>

      {dinners.length === 0 ? (
        <p className={styles.emptyList}>아직 예정된 회식이 없어요 😱<br />새로운 공포를 예약해보세요</p>
      ) : (
        <div className={styles.dinnerList}>
          {dinners.map(d => (
            <div key={d.id} className={styles.dinnerCard} onClick={() => onSelect(d.id)}>
              <div className={styles.dinnerCardMain}>
                <span className={styles.dinnerCardDate}>{d.date ? fmtDate(d.date) : '날짜 미정'}</span>
                <span className={styles.dinnerCardTitle}>{d.title}</span>
              </div>
              <span className={styles.dinnerCardBadge}>🙋 {d.attendingCount}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DinnerDetail({ dinner, onBack, onUpdateDinner }) {
  const {
    attendees, menus, locations,
    setAttendeeStatus, addMenu, toggleMenuVote, addLocation, toggleLocationVote,
  } = useDinnerDetail(dinner.id);

  const [titleInput, setTitleInput] = useState(dinner.title ?? '공포의 회식');
  const [dateInput,  setDateInput]  = useState(dinner.date ?? '');
  const [savingInfo, setSavingInfo] = useState(false);

  const [voter,         setVoter]         = useState(() => localStorage.getItem('bemon_checkin_member'));
  const [showVoterPick, setShowVoterPick] = useState(false);
  const [newLocation,   setNewLocation]   = useState('');
  const [newMenu,       setNewMenu]       = useState('');

  const selectVoter = (m) => {
    localStorage.setItem('bemon_checkin_member', m);
    setVoter(m);
    setShowVoterPick(false);
  };

  const handleSaveInfo = async () => {
    setSavingInfo(true);
    await onUpdateDinner(dinner.id, { title: titleInput, date: dateInput });
    setSavingInfo(false);
  };

  const counts = useMemo(() => {
    const c = { 참석: 0, 불참: 0, 미정: 0 };
    MEMBERS.forEach(m => {
      const status = attendees.find(a => a.member === m)?.status ?? '미정';
      c[status] = (c[status] ?? 0) + 1;
    });
    return c;
  }, [attendees]);

  const sortedLocations = useMemo(
    () => [...locations].sort((a, b) => (b.voted_by?.length ?? 0) - (a.voted_by?.length ?? 0)),
    [locations]
  );
  const sortedMenus = useMemo(
    () => [...menus].sort((a, b) => (b.voted_by?.length ?? 0) - (a.voted_by?.length ?? 0)),
    [menus]
  );

  const topLocation = sortedLocations[0]?.voted_by?.length > 0 ? sortedLocations[0] : null;
  const topMenu     = sortedMenus[0]?.voted_by?.length > 0 ? sortedMenus[0] : null;
  const dday        = calcDday(dinner.date);

  const fearIndex = useMemo(() => calcFearIndex(attendees, dinner.id), [attendees, dinner.id]);
  const fearLevel = getFearLevel(fearIndex);

  const handleAddLocation = () => {
    if (!newLocation.trim()) return;
    addLocation(newLocation);
    setNewLocation('');
  };

  const handleAddMenu = () => {
    if (!newMenu.trim()) return;
    addMenu(newMenu);
    setNewMenu('');
  };

  return (
    <div className={styles.wrap}>
      <button className={styles.backBtn} onClick={onBack}>← 목록</button>

      <input
        type="text"
        className={styles.titleInput}
        value={titleInput}
        onChange={e => setTitleInput(e.target.value)}
        onBlur={handleSaveInfo}
        placeholder="회식 이름"
      />

      {/* 한눈에 보기 */}
      <div className={styles.summaryBar}>
        <span>🙋 참석 {counts.참석}명</span>
        {topLocation && <span>🏆 {topLocation.location_name}</span>}
        {topMenu && <span>🏆 {topMenu.menu_name}</span>}
        {dday && <span className={styles.ddayTag}>{dday}</span>}
      </div>

      {/* 날짜 */}
      <div className={styles.section}>
        <span className={styles.sectionTitle}>📅 언제</span>
        {!dinner.date && <p className={styles.infoHint}>👻 날짜를 정해주세요...</p>}
        <div className={styles.infoRow}>
          <input
            type="date"
            className={styles.infoInput}
            value={dateInput}
            onChange={e => setDateInput(e.target.value)}
            onBlur={handleSaveInfo}
          />
          <button className={styles.infoSaveBtn} onClick={handleSaveInfo} disabled={savingInfo}>
            {savingInfo ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>

      {/* 투표자 선택 — 장소/메뉴 투표 공용 */}
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

      {/* 장소 정하기 */}
      <div className={styles.section}>
        <span className={styles.sectionTitle}>📍 장소 정하기</span>
        <div className={styles.voteAddRow}>
          <input
            type="text"
            className={styles.voteInput}
            placeholder="장소 후보 추가... (예: 을지로 골뱅이 골목)"
            value={newLocation}
            onChange={e => setNewLocation(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAddLocation(); }}
          />
          <button className={styles.voteAddBtn} onClick={handleAddLocation} disabled={!newLocation.trim()}>
            + 추가
          </button>
        </div>
        <div className={styles.voteList}>
          {sortedLocations.length === 0 && <p className={styles.voteEmpty}>아직 후보 장소가 없어요 🗺</p>}
          {sortedLocations.map((loc, i) => {
            const voters = loc.voted_by ?? [];
            const votedByMe = voter && voters.includes(voter);
            return (
              <div key={loc.id} className={styles.voteRow}>
                <span className={styles.voteRank}>{i + 1}</span>
                <span className={styles.voteName}>{loc.location_name}</span>
                <button
                  className={`${styles.voteBtn} ${votedByMe ? styles.voteBtnActive : ''}`}
                  onClick={() => toggleLocationVote(loc.id, voter)}
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

      {/* 메뉴 정하기 */}
      <div className={styles.section}>
        <span className={styles.sectionTitle}>🍖 메뉴 정하기</span>
        <div className={styles.voteAddRow}>
          <input
            type="text"
            className={styles.voteInput}
            placeholder="메뉴 후보 추가... (예: 삼겹살)"
            value={newMenu}
            onChange={e => setNewMenu(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAddMenu(); }}
          />
          <button className={styles.voteAddBtn} onClick={handleAddMenu} disabled={!newMenu.trim()}>
            + 추가
          </button>
        </div>
        <div className={styles.voteList}>
          {sortedMenus.length === 0 && <p className={styles.voteEmpty}>아직 후보 메뉴가 없어요 🍽</p>}
          {sortedMenus.map((menu, i) => {
            const voters = menu.voted_by ?? [];
            const votedByMe = voter && voters.includes(voter);
            return (
              <div key={menu.id} className={styles.voteRow}>
                <span className={styles.voteRank}>{i + 1}</span>
                <span className={styles.voteName}>{menu.menu_name}</span>
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

      {/* 참석 여부 */}
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

      {/* 재미 요소: 오늘의 공포 지수 */}
      <div className={styles.fearSection}>
        <span className={styles.fearTitle}>오늘의 공포 지수</span>
        <div className={styles.fearRow}>
          <span className={styles.fearEmoji}>{fearLevel.emoji}</span>
          <div className={styles.fearBarTrack}>
            <div className={styles.fearBarFill} style={{ width: `${fearIndex}%` }} />
          </div>
          <span className={styles.fearPercent}>{fearIndex}%</span>
        </div>
        <span className={styles.fearText}>{fearLevel.text}</span>
      </div>
    </div>
  );
}
