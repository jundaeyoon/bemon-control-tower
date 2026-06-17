import { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import rough from 'roughjs';
import SlidePanel from './SlidePanel';
import styles from './CalendarPanel.module.css';

const DOW_KO = ['월', '화', '수', '목', '금', '토', '일'];
const MEMBERS = ['JUN', 'SURI', 'SUNNY!', 'ZIN', 'LENA'];

const CHIP_BG = {
  'JUN':    '#E8896A',
  'SURI':   '#6B7C45',
  'SUNNY!': '#F59E0B',
  'ZIN':    '#9333EA',
  'LENA':   '#0284C7',
};
const MULTI_COLOR = '#9CA3AF';

const REPEAT_OPTS = [
  { value: 'none',    label: '없음' },
  { value: 'weekly',  label: '매주' },
  { value: 'monthly', label: '매월' },
];

// ── helpers ───────────────────────────────────────────────────────────────────

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1);
  const startDow = (firstDay.getDay() + 6) % 7; // 0=Mon
  const days = [];
  for (let i = 0; i < 42; i++) {
    const date = new Date(year, month, 1 - startDow + i);
    days.push({ date, cur: date.getMonth() === month && date.getFullYear() === year });
  }
  return days;
}

// DB에 저장된 repeat 컬럼 기준 (repeat_type 아님)
function matchesDate(schedule, dateStr) {
  if (schedule.repeat === 'none' || !schedule.repeat) return schedule.date === dateStr;
  const sd = new Date(schedule.date + 'T00:00:00');
  const td = new Date(dateStr + 'T00:00:00');
  if (schedule.repeat === 'weekly')  return sd.getDay() === td.getDay();
  if (schedule.repeat === 'monthly') return sd.getDate() === td.getDate();
  return false;
}

// 담당자 문자열 → 배열 파싱 ("JUN,SURI" → ["JUN","SURI"])
function parseAssignees(str) {
  if (!str) return ['JUN'];
  return str.split(',').map(s => s.trim()).filter(Boolean);
}

// 칩 배경색: 단독이면 담당자 색, 복수면 보라
function getChipBg(assigneeStr) {
  const names = parseAssignees(assigneeStr);
  return names.length === 1 ? (CHIP_BG[names[0]] ?? '#888') : MULTI_COLOR;
}

// ── Day header rough.js strip ─────────────────────────────────────────────────

function RoughHeader({ width }) {
  const ref = useRef(null);
  const H = 34;
  useEffect(() => {
    const c = ref.current;
    if (!c || width <= 0) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = width * dpr; c.height = H * dpr;
    c.style.width = `${width}px`; c.style.height = `${H}px`;
    const ctx = c.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, H);
    const rc = rough.canvas(c);
    rc.rectangle(1, 1, width - 2, H - 2, {
      fill: 'rgba(99,122,53,0.90)', fillStyle: 'solid',
      stroke: '#4E6228', strokeWidth: 1.5,
      roughness: 1.1, bowing: 0.4, seed: 55,
    });
  }, [width]);
  return <canvas ref={ref} className={styles.headerCanvas} aria-hidden="true" />;
}

// ── Main Panel ────────────────────────────────────────────────────────────────

export default function CalendarPanel({ schedHook, onClose }) {
  const today = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [addDate,   setAddDate]   = useState(null);
  const [editEvent, setEditEvent] = useState(null);
  const gridRef = useRef(null);
  const [gridW, setGridW] = useState(0);

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setGridW(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const days     = useMemo(() => getCalendarDays(year, month), [year, month]);
  const todayStr = toDateStr(today);

  const prevMonth = () => month === 0  ? (setYear(y => y - 1), setMonth(11)) : setMonth(m => m - 1);
  const nextMonth = () => month === 11 ? (setYear(y => y + 1), setMonth(0))  : setMonth(m => m + 1);

  return (
    <SlidePanel title="베몽 달력" emoji="📅" onClose={onClose} width={680}>
      <div className={styles.wrap}>
        {/* Month navigation */}
        <div className={styles.monthNav}>
          <button className={styles.navBtn} onClick={prevMonth}>‹</button>
          <span className={styles.monthLabel}>{year}년 {month + 1}월</span>
          <button className={styles.navBtn} onClick={nextMonth}>›</button>
        </div>

        <div className={styles.calBox} ref={gridRef}>
          {/* Day header row */}
          <div className={styles.headerRow}>
            <RoughHeader width={gridW} />
            {DOW_KO.map((d, i) => (
              <div key={d} className={`${styles.dayHeader} ${i >= 5 ? styles.dayHeaderWknd : ''}`}>
                {d}
              </div>
            ))}
          </div>

          {/* Cell grid */}
          <div className={styles.cellGrid}>
            {days.map(({ date, cur }, i) => {
              const ds  = toDateStr(date);
              const dow = (date.getDay() + 6) % 7;
              const evs = schedHook.schedules.filter(s => matchesDate(s, ds));
              return (
                <div
                  key={i}
                  className={[
                    styles.cell,
                    !cur            && styles.cellDim,
                    ds === todayStr && styles.cellToday,
                    dow >= 5        && styles.cellWknd,
                  ].filter(Boolean).join(' ')}
                  onClick={() => cur && setAddDate(ds)}
                >
                  <span className={`${styles.dateNum} ${ds === todayStr ? styles.dateNumToday : ''}`}>
                    {date.getDate()}
                  </span>
                  <div className={styles.eventsWrap}>
                    {evs.slice(0, 3).map(ev => (
                      <div
                        key={ev.id}
                        className={styles.chip}
                        style={{ background: getChipBg(ev.assignee) }}
                        title={`${ev.title} — ${ev.assignee}`}
                        onClick={e => { e.stopPropagation(); setEditEvent(ev); }}
                      >
                        {ev.title}
                      </div>
                    ))}
                    {evs.length > 3 && (
                      <div className={styles.chipMore}>+{evs.length - 3}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Member legend */}
        <div className={styles.legend}>
          {MEMBERS.map(m => (
            <span key={m} className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: CHIP_BG[m] }} />
              {m}
            </span>
          ))}
          <span className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: MULTI_COLOR }} />
            복수담당
          </span>
        </div>
      </div>

      {/* Add modal */}
      {addDate && createPortal(
        <EventModal
          date={addDate}
          onSave={async fields => {
            await schedHook.addSchedule({ ...fields, date: addDate });
            setAddDate(null);
          }}
          onClose={() => setAddDate(null)}
        />,
        document.body
      )}

      {/* Edit modal */}
      {editEvent && createPortal(
        <EventModal
          date={editEvent.date}
          initial={editEvent}
          onSave={async fields => {
            await schedHook.updateSchedule(editEvent.id, fields);
            setEditEvent(null);
          }}
          onDelete={async () => {
            await schedHook.deleteSchedule(editEvent.id);
            setEditEvent(null);
          }}
          onClose={() => setEditEvent(null)}
        />,
        document.body
      )}
    </SlidePanel>
  );
}

// ── Event add/edit modal ──────────────────────────────────────────────────────

function EventModal({ date, initial, onSave, onDelete, onClose }) {
  const [title,     setTitle]     = useState(initial?.title ?? '');
  // 다중 선택: 콤마 구분 문자열 → 배열
  const [assignees, setAssignees] = useState(parseAssignees(initial?.assignee));
  // DB 컬럼명은 repeat (repeat_type 아님)
  const [repeat,    setRepeat]    = useState(initial?.repeat ?? 'none');
  const [saving,    setSaving]    = useState(false);

  const toggleAssignee = (mem) => {
    setAssignees(prev => {
      if (prev.includes(mem)) {
        // 마지막 1명이면 해제 불가
        return prev.length > 1 ? prev.filter(a => a !== mem) : prev;
      }
      return [...prev, mem];
    });
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        assignee: assignees.join(','),  // "JUN" 또는 "JUN,SURI"
        repeat,
      });
    } finally {
      setSaving(false);
    }
  };

  const [y, m, d] = date.split('-');
  const dateLabel = `${parseInt(y)}년 ${parseInt(m)}월 ${parseInt(d)}일`;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalInner}>
          <div className={styles.modalHeader}>
            <span className={styles.modalDateLbl}>{dateLabel}</span>
            <button className={styles.modalCloseBtn} onClick={onClose}>✕</button>
          </div>

          <input
            className={styles.modalInput}
            value={title}
            placeholder="일정 제목..."
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            autoFocus
          />

          <div className={styles.modalSection}>
            <div className={styles.modalLbl}>담당자 (복수 선택 가능)</div>
            <div className={styles.assigneeRow}>
              {MEMBERS.map(mem => {
                const on = assignees.includes(mem);
                return (
                  <button
                    key={mem}
                    className={`${styles.assigneeBtn} ${on ? styles.assigneeBtnOn : ''}`}
                    style={on ? { background: CHIP_BG[mem], borderColor: CHIP_BG[mem] } : {}}
                    onClick={() => toggleAssignee(mem)}
                  >
                    {mem}
                  </button>
                );
              })}
            </div>
            {/* 선택된 담당자 칩 표시 */}
            {assignees.length > 0 && (
              <div className={styles.selectedChips}>
                {assignees.map(a => (
                  <span
                    key={a}
                    className={styles.selectedChip}
                    style={{
                      background: assignees.length > 1 ? MULTI_COLOR : (CHIP_BG[a] ?? '#888'),
                    }}
                  >
                    {a}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className={styles.modalSection}>
            <div className={styles.modalLbl}>반복</div>
            <div className={styles.repeatRow}>
              {REPEAT_OPTS.map(opt => (
                <button
                  key={opt.value}
                  className={`${styles.repeatBtn} ${repeat === opt.value ? styles.repeatBtnOn : ''}`}
                  onClick={() => setRepeat(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.modalActions}>
            {onDelete && (
              <button className={styles.deleteBtn} onClick={onDelete}>삭제</button>
            )}
            <button
              className={styles.saveBtn}
              onClick={handleSave}
              disabled={saving || !title.trim()}
            >
              {saving ? '저장 중...' : initial ? '수정하기' : '추가하기'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
