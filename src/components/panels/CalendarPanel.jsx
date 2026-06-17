import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
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

const REPEAT_OPTS = [
  { value: 'none',    label: '없음' },
  { value: 'weekly',  label: '매주' },
  { value: 'monthly', label: '매월' },
];

// ── helpers ──────────────────────────────────────────────────────────────────

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

function matchesDate(schedule, dateStr) {
  if (schedule.repeat_type === 'none') return schedule.date === dateStr;
  const sd = new Date(schedule.date + 'T00:00:00');
  const td = new Date(dateStr + 'T00:00:00');
  if (schedule.repeat_type === 'weekly')  return sd.getDay() === td.getDay();
  if (schedule.repeat_type === 'monthly') return sd.getDate() === td.getDate();
  return false;
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
                        style={{ background: CHIP_BG[ev.assignee] ?? '#888' }}
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
        </div>
      </div>

      {/* Add modal — portaled to body to avoid transform stacking context */}
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
  const [title,      setTitle]      = useState(initial?.title ?? '');
  const [assignee,   setAssignee]   = useState(initial?.assignee ?? 'JUN');
  const [repeatType, setRepeatType] = useState(initial?.repeat_type ?? 'none');
  const [saving,     setSaving]     = useState(false);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try { await onSave({ title: title.trim(), assignee, repeat_type: repeatType }); }
    finally { setSaving(false); }
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
            <div className={styles.modalLbl}>담당자</div>
            <div className={styles.assigneeRow}>
              {MEMBERS.map(mem => (
                <button
                  key={mem}
                  className={`${styles.assigneeBtn} ${assignee === mem ? styles.assigneeBtnOn : ''}`}
                  style={assignee === mem
                    ? { background: CHIP_BG[mem], borderColor: CHIP_BG[mem] }
                    : {}}
                  onClick={() => setAssignee(mem)}
                >
                  {mem}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.modalSection}>
            <div className={styles.modalLbl}>반복</div>
            <div className={styles.repeatRow}>
              {REPEAT_OPTS.map(opt => (
                <button
                  key={opt.value}
                  className={`${styles.repeatBtn} ${repeatType === opt.value ? styles.repeatBtnOn : ''}`}
                  onClick={() => setRepeatType(opt.value)}
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
