import { useState, useEffect, useCallback, useRef } from 'react';
import SlidePanel from './SlidePanel';
import RoughCard from '../rough/RoughCard';
import { getMemberColor, getMemberInitial } from '../../constants/memberColors';
import styles from './QuestSlidePanel.module.css';

const MEMBERS = ['JUN', 'SURI', 'SUNNY!', 'LENA'];

const TABS = [
  { id: 'quest',    label: '퀘스트',      emoji: '🎯' },
  { id: 'fighters', label: '파이터 배정',  emoji: '⚔️' },
  { id: 'check',    label: '잘하고있나!!', emoji: '✅' },
  { id: 'result',   label: '이달의 결과',  emoji: '🏆' },
];

const CARD_COLORS = { fill: '#FFFBEE', stroke: '#D4A843' };

function getYearMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function formatDisplay(ym) {
  const [y, m] = ym.split('-');
  return `${y}년 ${parseInt(m)}월`;
}
function prevMonth(ym) {
  const [y, m] = ym.split('-').map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
}
function nextMonth(ym) {
  const [y, m] = ym.split('-').map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
}

export default function QuestSlidePanel({ goalsHook, onClose, initialMonth }) {
  const [tab, setTab] = useState('quest');
  const [yearMonth, setYearMonth] = useState(() => initialMonth ?? getYearMonth());

  const goal = goalsHook.goals.find(g => g.year_month === yearMonth) ?? null;

  const handleUpdate = useCallback(async (fields) => {
    if (goal) {
      await goalsHook.updateGoal(goal.id, fields);
    } else {
      const created = await goalsHook.getOrCreateGoal(yearMonth);
      if (created) await goalsHook.updateGoal(created.id, fields);
    }
  }, [goal, goalsHook, yearMonth]);

  return (
    <SlidePanel title="이달의 퀘스트" emoji="🎯" onClose={onClose} width={500}>
      <div className={styles.wrap}>
        <div className={styles.monthRow}>
          <button className={styles.monthArrow} onClick={() => setYearMonth(ym => prevMonth(ym))}>‹</button>
          <span className={styles.monthLabel}>{formatDisplay(yearMonth)}</span>
          <button className={styles.monthArrow} onClick={() => setYearMonth(ym => nextMonth(ym))}>›</button>
        </div>

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
          {tab === 'quest'    && <QuestTab    goal={goal} yearMonth={yearMonth} onUpdate={handleUpdate} />}
          {tab === 'fighters' && <FightersTab goal={goal} onUpdate={handleUpdate} />}
          {tab === 'check'    && <CheckTab    goal={goal} onUpdate={handleUpdate} />}
          {tab === 'result'   && <ResultTab   goal={goal} onUpdate={handleUpdate} />}
        </div>
      </div>
    </SlidePanel>
  );
}

// ── 퀘스트 탭 ─────────────────────────────────────────────────────────────────

function QuestTab({ goal, yearMonth, onUpdate }) {
  const [quest,      setQuest]      = useState('');
  const [conditions, setConditions] = useState([]);

  useEffect(() => {
    setQuest(goal?.quest ?? '');
    setConditions(goal?.clear_conditions ?? []);
  }, [goal?.id, yearMonth]);

  const saveConditions = useCallback((conds) => {
    onUpdate({ clear_conditions: conds });
  }, [onUpdate]);

  const addCondition = () => {
    if (conditions.length >= 3) return;
    const newId = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newConds = [...conditions, { id: newId, title: '', target: 100, current: 0 }];
    setConditions(newConds);
    saveConditions(newConds);
  };

  const updateCondition = (idx, field, value) => {
    const newConds = conditions.map((c, i) => i === idx ? { ...c, [field]: value } : c);
    setConditions(newConds);
    saveConditions(newConds);
  };

  const removeCondition = (idx) => {
    const newConds = conditions.filter((_, i) => i !== idx);
    setConditions(newConds);
    saveConditions(newConds);
  };

  return (
    <div className={styles.tabContent}>

      {/* ── 퀘스트 배너 ── */}
      <div className={styles.questBanner}>
        <span className={styles.questBannerEmoji}>🎯</span>
        <span className={styles.questBannerTitle}>이달의 퀘스트</span>
        <span className={styles.questBannerSub}>OBJECTIVE</span>
      </div>

      <textarea
        className={styles.questTextarea}
        value={quest}
        placeholder={`${formatDisplay(yearMonth)}에 우리가 반드시 달성할 것!`}
        onChange={e => setQuest(e.target.value)}
        onBlur={() => { if (quest !== (goal?.quest ?? '')) onUpdate({ quest }); }}
      />

      {/* ── KR 구분선 ── */}
      <div className={styles.krDivider}>
        <span className={styles.krDividerLine} />
        <span className={styles.krDividerLabel}>KEY RESULTS</span>
        <span className={styles.krDividerLine} />
      </div>

      {/* ── 클리어 조건 ── */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionLabel}>클리어 조건</div>
          {conditions.length < 3 && (
            <button className={styles.addBtn} onClick={addCondition}>+ 추가</button>
          )}
        </div>

        {conditions.length === 0 && (
          <p className={styles.empty}>클리어 조건을 추가해보세요 (최대 3개)</p>
        )}

        {conditions.map((cond, idx) => {
          const pct = cond.target > 0
            ? Math.min(100, Math.round((Number(cond.current) / Number(cond.target)) * 100))
            : 0;
          const pctColor = pct >= 100 ? '#4E7E4E' : pct >= 50 ? '#D4A843' : '#C06850';
          return (
            <RoughCard key={cond.id} padding="14px 16px" seed={idx + 1} {...CARD_COLORS}>
              <div className={styles.condCard}>
                <div className={styles.condTopRow}>
                  <input
                    className={styles.condTitleInput}
                    value={cond.title}
                    placeholder={`클리어 조건 ${idx + 1}`}
                    onChange={e => updateCondition(idx, 'title', e.target.value)}
                  />
                  <button className={styles.deleteIcon} onClick={() => removeCondition(idx)}>✕</button>
                </div>
                <div className={styles.condNumRow}>
                  <label className={styles.numField}>
                    <span className={styles.numLabel}>목표</span>
                    <input
                      type="number"
                      className={styles.numInput}
                      value={cond.target}
                      min={0}
                      onChange={e => updateCondition(idx, 'target', Number(e.target.value))}
                    />
                  </label>
                  <label className={styles.numField}>
                    <span className={styles.numLabel}>현재</span>
                    <input
                      type="number"
                      className={styles.numInput}
                      value={cond.current}
                      min={0}
                      onChange={e => updateCondition(idx, 'current', Number(e.target.value))}
                    />
                  </label>
                  <span className={styles.pctBadge} style={{ color: pctColor }}>{pct}%</span>
                </div>
                <div className={styles.progressTrack}>
                  <div className={styles.progressFill} style={{ width: `${pct}%`, background: pctColor }} />
                </div>
              </div>
            </RoughCard>
          );
        })}
      </div>
    </div>
  );
}

// ── 파이터 배정 탭 ────────────────────────────────────────────────────────────

// DB에 저장된 fighters가 구버전 string[] 일 수 있으므로 정규화
function normalizeFighters(raw) {
  if (!Array.isArray(raw) || raw.length === 0) {
    return MEMBERS.map(m => ({ name: m, selected: false, task: '' }));
  }
  if (typeof raw[0] === 'string') {
    return MEMBERS.map(m => ({ name: m, selected: raw.includes(m), task: '' }));
  }
  const mapped = Object.fromEntries(raw.map(f => [f.name, f]));
  return MEMBERS.map(m => mapped[m] ?? { name: m, selected: false, task: '' });
}

function FightersTab({ goal, onUpdate }) {
  const [fighters, setFighters] = useState(() => normalizeFighters(goal?.fighters ?? []));

  // ref로 항상 최신 fighters를 추적 (onBlur 클로저 stale 방지)
  const fightersRef = useRef(fighters);
  useEffect(() => { fightersRef.current = fighters; }, [fighters]);

  useEffect(() => {
    const normalized = normalizeFighters(goal?.fighters ?? []);
    setFighters(normalized);
    fightersRef.current = normalized;
  }, [goal?.id]);

  const toggle = useCallback((name) => {
    const next = fightersRef.current.map(f =>
      f.name === name ? { ...f, selected: !f.selected } : f
    );
    setFighters(next);
    fightersRef.current = next;
    onUpdate({ fighters: next });
  }, [onUpdate]);

  const handleTaskChange = useCallback((name, task) => {
    const next = fightersRef.current.map(f =>
      f.name === name ? { ...f, task } : f
    );
    setFighters(next);
    fightersRef.current = next;
  }, []);

  const handleTaskBlur = useCallback(() => {
    onUpdate({ fighters: fightersRef.current });
  }, [onUpdate]);

  const selectedFighters = fighters.filter(f => f.selected);

  return (
    <div className={styles.tabContent}>
      <p className={styles.desc}>파이터를 선택하고 이번 달 맡을 일을 입력해주세요</p>
      <div className={styles.fighterGrid}>
        {fighters.map(f => {
          const mc = getMemberColor(f.name);
          return (
            <div
              key={f.name}
              className={`${styles.fighterCard} ${f.selected ? styles.fighterCardOn : ''}`}
              style={f.selected ? { borderColor: mc.border, background: mc.bg } : {}}
            >
              {/* 클릭 영역: 아바타 + 이름 + 검 아이콘 */}
              <div className={styles.fighterCardHeader} onClick={() => toggle(f.name)}>
                <span
                  className={styles.fighterAvatar}
                  style={{ background: mc.bg, color: mc.text, borderColor: mc.border }}
                >
                  {getMemberInitial(f.name)}
                </span>
                <span
                  className={styles.fighterName}
                  style={f.selected ? { color: mc.text, fontWeight: 800 } : {}}
                >
                  {f.name}
                </span>
                <span className={styles.swordIcon}>{f.selected ? '⚔️' : ''}</span>
              </div>

              {/* 선택됐을 때만 태스크 입력창 펼쳐짐 */}
              {f.selected && (
                <input
                  className={styles.fighterTaskInput}
                  style={{ '--task-border': mc.border }}
                  value={f.task}
                  placeholder="이번 달 맡을 일..."
                  onChange={e => handleTaskChange(f.name, e.target.value)}
                  onBlur={handleTaskBlur}
                />
              )}
            </div>
          );
        })}
      </div>

      {selectedFighters.length > 0 && (
        <div className={styles.selectedRow}>
          <span className={styles.sectionLabel}>선발된 파이터</span>
          <div className={styles.avatarRow}>
            {selectedFighters.map(f => {
              const mc = getMemberColor(f.name);
              return (
                <span
                  key={f.name}
                  className={styles.bigAvatar}
                  style={{ background: mc.bg, color: mc.text, borderColor: mc.border }}
                  title={f.task ? `${f.name}: ${f.task}` : f.name}
                >
                  {getMemberInitial(f.name)}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── 잘하고있나!! 탭 ──────────────────────────────────────────────────────────

const CHECK_ITEMS = [
  { key: 'daily',   label: '데일리 체크', desc: '매일 퀘스트 진행 상황을 확인하고 있나요?' },
  { key: 'weekly',  label: '주간 체크',   desc: '매주 클리어 조건 달성률을 점검하고 있나요?' },
  { key: 'monthly', label: '월간 체크',   desc: '이번 달 퀘스트 전체 방향을 확인했나요?' },
];

function CheckTab({ goal, onUpdate }) {
  return (
    <div className={styles.tabContent}>
      <p className={styles.desc}>핵심 일정 체크 — 잘하고있나!!</p>
      <div className={styles.checkList}>
        {CHECK_ITEMS.map(item => {
          const on = goal?.[`check_${item.key}`] ?? false;
          return (
            <RoughCard key={item.key} padding="14px 16px" seed={item.key.charCodeAt(0)} {...CARD_COLORS}>
              <div className={styles.checkRow}>
                <div className={styles.checkTextCol}>
                  <span className={styles.checkLabel}>{item.label}</span>
                  <span className={styles.checkDesc}>{item.desc}</span>
                </div>
                <button
                  className={styles.checkToggle}
                  onClick={() => onUpdate({ [`check_${item.key}`]: !on })}
                  title={on ? '완료 취소' : '완료 처리'}
                >
                  {on ? '✅' : '⬜'}
                </button>
              </div>
            </RoughCard>
          );
        })}
      </div>
    </div>
  );
}

// ── 이달의 결과 탭 ────────────────────────────────────────────────────────────

function ResultTab({ goal, onUpdate }) {
  const [goldenRule, setGoldenRule] = useState('');
  const [result,     setResult]     = useState('');

  useEffect(() => {
    setGoldenRule(goal?.golden_rule ?? '');
    setResult(goal?.result ?? '');
  }, [goal?.id]);

  return (
    <div className={styles.tabContent}>
      <div className={styles.section}>
        <div className={styles.sectionLabel}>우리의 약속 골든룰</div>
        <textarea
          className={styles.memoTextarea}
          value={goldenRule}
          placeholder="우리 팀이 함께 지키기로 한 약속을 적어주세요..."
          onChange={e => setGoldenRule(e.target.value)}
          onBlur={() => {
            if (goldenRule !== (goal?.golden_rule ?? '')) onUpdate({ golden_rule: goldenRule });
          }}
        />
      </div>
      <div className={styles.section}>
        <div className={styles.sectionLabel}>우리가 해냈나? 이달의 결과</div>
        <textarea
          className={styles.memoTextarea}
          value={result}
          placeholder="이번 달 퀘스트 결과를 기록해주세요..."
          onChange={e => setResult(e.target.value)}
          onBlur={() => {
            if (result !== (goal?.result ?? '')) onUpdate({ result });
          }}
        />
      </div>
    </div>
  );
}
