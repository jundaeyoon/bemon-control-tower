import { useState, useEffect, useCallback } from 'react';
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
  },
  team_spirit: {
    title: '팀 스피릿',
    desc: '우리 팀 각자의 역할과 다짐을 적어주세요. 서로에 대한 기대와 약속.',
    placeholder: 'JUN — 방향을 잡는다\nSURI — 고객과 연결한다\nSUNNY! — 디자인으로 빛낸다\nZIN — 기반을 탄탄하게\nLENA — 팀의 에너지를 만든다',
    bannerColor: 'rgba(180,90,40,0.92)',
    bannerShadow: 'rgba(140,60,20,0.55)',
  },
  vision: {
    title: '3년 후 우리',
    desc: '2029년, 베몽은 어떤 모습이 되어 있을까? 구체적이고 생생하게.',
    placeholder: '예) 한국에서 가장 신뢰받는 팀 협업 도구로, 500개 팀이 매일 사용한다.',
    bannerColor: 'rgba(90,110,48,0.92)',
    bannerShadow: 'rgba(60,80,30,0.55)',
  },
  capability: {
    title: '우리가 제일 잘하는 것',
    desc: '경쟁사와 다르게 우리만이 할 수 있는 것은? 핵심 역량을 정의해요.',
    placeholder: '예) 팀원의 감정과 맥락을 반영한 직관적인 협업 경험 설계.',
    bannerColor: 'rgba(90,110,48,0.88)',
    bannerShadow: 'rgba(60,80,30,0.50)',
  },
  values: {
    title: '우리의 방식',
    desc: '우리 팀이 일할 때 절대 양보 못하는 원칙은? 핵심 가치를 적어요.',
    placeholder: '예) 솔직한 피드백 / 빠른 실행 / 서로를 위한 여유 / 재미있게 일하기',
    bannerColor: 'rgba(90,110,48,0.88)',
    bannerShadow: 'rgba(60,80,30,0.50)',
  },
};

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
  const [text, setText] = useState(value);

  useEffect(() => { setText(value); }, [value]);

  const handleBlur = useCallback(() => {
    if (text !== value) onSave(text);
  }, [text, value, onSave]);

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
        onChange={e => setText(e.target.value)}
        onBlur={handleBlur}
      />
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
