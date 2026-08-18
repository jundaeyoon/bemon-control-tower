export const ACCENT_COLORS = {
  mustard: { fill: 'rgba(180,130,30,0.72)',  fillHover: 'rgba(180,130,30,0.86)', stroke: '#B8903A' },
  green:   { fill: 'rgba(80,100,65,0.72)',   fillHover: 'rgba(80,100,65,0.86)',  stroke: '#4E5E42' },
  olive:   { fill: 'rgba(90,110,48,0.72)',   fillHover: 'rgba(90,110,48,0.88)',  stroke: '#637A35' },
  neutral: { fill: 'rgba(110,110,110,0.68)', fillHover: 'rgba(110,110,110,0.82)', stroke: '#888888' },
  salmon:  { fill: 'rgba(180,100,75,0.72)',  fillHover: 'rgba(180,100,75,0.86)', stroke: '#C06850' },
  emerald: { fill: 'rgba(56,142,60,0.72)',   fillHover: 'rgba(56,142,60,0.86)',  stroke: '#388E3C' },
  sky:     { fill: 'rgba(2,132,199,0.72)',   fillHover: 'rgba(2,132,199,0.86)',  stroke: '#0284C7' },
  violet:  { fill: 'rgba(124,58,237,0.72)',  fillHover: 'rgba(124,58,237,0.86)', stroke: '#7C3AED' },
  coral:   { fill: 'rgba(232,137,106,0.72)', fillHover: 'rgba(232,137,106,0.86)', stroke: '#E8896A' },
  hotpink: { fill: 'rgba(236,72,153,0.72)',  fillHover: 'rgba(236,72,153,0.86)',  stroke: '#EC4899' },
  red:     { fill: 'rgba(239,68,68,0.72)',   fillHover: 'rgba(239,68,68,0.88)',   stroke: '#EF4444' },
  brown:   { fill: 'rgba(74,55,40,0.72)',    fillHover: 'rgba(74,55,40,0.86)',    stroke: '#4A3728' },
  navy:    { fill: 'rgba(51,78,104,0.72)',   fillHover: 'rgba(51,78,104,0.86)',   stroke: '#334E68' },
  // 모바일 카드는 stroke(불투명 hex)를 배경으로 그대로 쓰기 때문에(MobileLauncher 참고),
  // 여기 stroke도 순한 갈색이 아니라 거의 검정에 가까운 다크브라운으로 잡아야
  // 캔버스 테두리와 모바일 카드 배경 둘 다 "검정 계열"로 보인다.
  black:   { fill: 'rgba(26,26,26,0.82)',    fillHover: 'rgba(26,26,26,0.94)',    stroke: '#2A1F18' },
};
