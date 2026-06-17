import { useState, useEffect, useCallback, useRef } from 'react';
import rough from 'roughjs';
import SlidePanel from './SlidePanel';
import styles from './VisionHousePanel.module.css';

const TABS = [
  { id: 'mission',     label: '미션',       emoji: '🌍' },
  { id: 'team_spirit', label: 'Team Spirit', emoji: '🔥' },
  { id: 'jun_promise', label: "JUN의 약속",  emoji: '🌴' },
  { id: 'vision',      label: '비전',        emoji: '🌟' },
  { id: 'capability',  label: '핵심역량',    emoji: '💪' },
  { id: 'values',      label: '핵심가치',    emoji: '⚡' },
];

const VISION_CONFIG = {
  mission: {
    title: '우리가 존재하는 이유',
    desc: '베몽이 없어진다면 고객은 무엇을 잃게 될까? 우리의 존재 이유를 한 문장으로.',
    placeholder: '예) 팀의 비전을 연결하고, 매일의 일이 의미 있도록 돕는다.',
    bannerColor: 'rgba(75,105,65,0.92)',
    bannerShadow: 'rgba(50,80,40,0.55)',
    btnFill:   '#4E7040', btnFillHover: '#637A35', btnStroke: '#3A5A2A',
  },
  team_spirit: {
    title: '팀 스피릿',
    desc: '우리 팀 각자의 역할과 다짐을 적어주세요. 서로에 대한 기대와 약속.',
    placeholder: 'JUN — 방향을 잡는다\nSURI — 고객과 연결한다\nSUNNY! — 디자인으로 빛낸다\nZIN — 기반을 탄탄하게\nLENA — 팀의 에너지를 만든다',
    bannerColor: 'rgba(180,90,40,0.92)',
    bannerShadow: 'rgba(140,60,20,0.55)',
    btnFill:   '#B85828', btnFillHover: '#CC6830', btnStroke: '#8C3A10',
  },
  vision: {
    title: '3년 후 우리',
    desc: '2029년, 베몽은 어떤 모습이 되어 있을까? 구체적이고 생생하게.',
    placeholder: '예) 한국에서 가장 신뢰받는 팀 협업 도구로, 500개 팀이 매일 사용한다.',
    bannerColor: 'rgba(90,110,48,0.92)',
    bannerShadow: 'rgba(60,80,30,0.55)',
    btnFill:   '#637A35', btnFillHover: '#728C3E', btnStroke: '#4E6228',
  },
  capability: {
    title: '우리가 제일 잘하는 것',
    desc: '경쟁사와 다르게 우리만이 할 수 있는 것은? 핵심 역량을 정의해요.',
    placeholder: '예) 팀원의 감정과 맥락을 반영한 직관적인 협업 경험 설계.',
    bannerColor: 'rgba(90,110,48,0.88)',
    bannerShadow: 'rgba(60,80,30,0.50)',
    btnFill:   '#637A35', btnFillHover: '#728C3E', btnStroke: '#4E6228',
  },
  values: {
    title: '우리의 방식',
    desc: '우리 팀이 일할 때 절대 양보 못하는 원칙은? 핵심 가치를 적어요.',
    placeholder: '예) 솔직한 피드백 / 빠른 실행 / 서로를 위한 여유 / 재미있게 일하기',
    bannerColor: 'rgba(90,110,48,0.88)',
    bannerShadow: 'rgba(60,80,30,0.50)',
    btnFill:   '#637A35', btnFillHover: '#728C3E', btnStroke: '#4E6228',
  },
};

// ── Rough.js 저장 버튼 ────────────────────────────────────────────────────────

const BTN_W = 162;
const BTN_H = 40;

function RoughSaveButton({ onClick, saved, cfg }) {
  const canvasRef  = useRef(null);
  const [hovered, setHovered] = useState(false);

  // saved: false | 'ok' | 'fail'
  const fill   = saved === 'ok'   ? '#4E7E4E'
               : saved === 'fail' ? '#B84040'
               : hovered          ? cfg.btnFillHover : cfg.btnFill;
  const stroke = saved === 'ok'   ? '#3A6A3A'
               : saved === 'fail' ? '#8C2828'
               : cfg.btnStroke;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = BTN_W * dpr;
    canvas.height = BTN_H * dpr;
    canvas.style.width  = `${BTN_W}px`;
    canvas.style.height = `${BTN_H}px`;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, BTN_W, BTN_H);

    const rc = rough.canvas(canvas);
    rc.rectangle(2, 2, BTN_W - 4, BTN_H - 4, {
      fill,
      fillStyle: 'solid',
      stroke,
      strokeWidth: hovered && !saved ? 2.2 : 1.8,
      roughness: 1.4,
      bowing:    0.6,
      seed:      77,
    });
  }, [hovered, saved, fill, stroke]);

  return (
    <button
      className={styles.saveBtn}
      style={{ width: BTN_W, height: BTN_H }}
      onClick={saved ? undefined : onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={!!saved}
    >
      <canvas ref={canvasRef} className={styles.saveBtnCanvas} aria-hidden="true" />
      <span className={styles.saveBtnLabel}>
        {saved === 'ok'   ? '저장됐어요! ✅' :
         saved === 'fail' ? '저장 실패 ❌'   :
                            '저장하기'}
      </span>
    </button>
  );
}

// ── 패널 루트 ─────────────────────────────────────────────────────────────────

export default function VisionHousePanel({ vhHook, initialTab = 'mission', onClose }) {
  const [tab, setTab] = useState(initialTab);

  return (
    <SlidePanel title="BEMON 나침반" emoji="🧭" onClose={onClose} width={520}>
      <div className={styles.wrap}>
        <div className={styles.tabBar}>
          {TABS.map(t => (
            <button
              key={t.id}
              className={`${styles.tabBtn} ${tab === t.id ? styles.tabActive : ''}`}
              onClick={() => setTab(t.id)}
              data-kind={t.id}
            >
              <span className={styles.tabEmoji}>{t.emoji}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        <div className={styles.tabBody}>
          {tab === 'jun_promise'
            ? <JunPromiseTab />
            : <VisionTab
                key={tab}
                kind={tab}
                cfg={VISION_CONFIG[tab]}
                value={vhHook.house?.[tab] ?? ''}
                onSave={(val) => vhHook.updateHouse({ [tab]: val })}
              />
          }
        </div>
      </div>
    </SlidePanel>
  );
}

// ── 일반 비전 탭 ─────────────────────────────────────────────────────────────

function VisionTab({ kind, cfg, value, onSave }) {
  const [text,  setText]  = useState(value);
  const [saved, setSaved] = useState(false); // false | 'ok' | 'fail'

  useEffect(() => { setText(value); }, [value]);

  // blur 자동저장 (기존 유지)
  const handleBlur = useCallback(() => {
    if (text !== value) onSave(text).catch(console.error);
  }, [text, value, onSave]);

  // 버튼 수동저장 — 성공/실패 구분
  const handleSave = useCallback(async () => {
    try {
      await onSave(text);
      setSaved('ok');
    } catch (err) {
      console.error('[VisionTab] 저장 실패:', err);
      setSaved('fail');
    } finally {
      setTimeout(() => setSaved(false), 2000);
    }
  }, [text, onSave]);

  // 타이핑 시작하면 상태 즉시 해제
  const handleChange = useCallback((e) => {
    setText(e.target.value);
    if (saved) setSaved(false);
  }, [saved]);

  return (
    <div className={styles.tabContent}>
      <div
        className={styles.banner}
        style={{
          background: cfg.bannerColor,
          boxShadow: `3px 3px 0 ${cfg.bannerShadow}`,
        }}
      >
        <span className={styles.bannerEmoji}>{TABS.find(t => t.id === kind)?.emoji}</span>
        <span className={styles.bannerTitle}>{cfg.title}</span>
      </div>

      <p className={styles.desc}>{cfg.desc}</p>

      <textarea
        className={styles.textarea}
        value={text}
        placeholder={cfg.placeholder}
        onChange={handleChange}
        onBlur={handleBlur}
      />

      <RoughSaveButton onClick={handleSave} saved={saved} cfg={cfg} />
    </div>
  );
}

// ── JUN의 약속 탭 ─────────────────────────────────────────────────────────────

function JunPromiseTab() {
  return (
    <div className={styles.junWrap}>
      <div className={styles.junCard}>
        <div className={styles.junWave}>🌊🌊🌊🌊🌊</div>
        <div className={styles.junTitle}>HAWAII</div>
        <div className={styles.junTitleKo}>하와이</div>
        <div className={styles.junEmojis}>🌺  🌴  ☀️  🏄  🌺</div>
        <div className={styles.junDivider}>— JUN의 약속 —</div>
        <p className={styles.junPromise}>
          우리 모두가 해내면,<br />
          <strong>온 가족 다같이<br />하와이로 여행 겸 워크샵 간다!</strong>
        </p>
        <div className={styles.junWave}>🌊🌊🌊🌊🌊</div>
      </div>
      <p className={styles.junNote}>
        🤙 JUN이 직접 약속했어요. 이제 달성하는 일만 남았다!
      </p>
    </div>
  );
}
