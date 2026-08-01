export const CATEGORIES = ['시즌오픈', '프로모션', '이벤트', '팀조직', '기타'];

export const CATEGORY_COLORS = {
  '시즌오픈': { bg: '#FDEEE8', text: '#C05A30', border: '#E8896A' }, // 코랄
  '프로모션': { bg: '#EEF2E6', text: '#4E5E38', border: '#6B7C45' }, // 올리브그린
  '이벤트':   { bg: '#E0F2FE', text: '#0369A1', border: '#0284C7' }, // 블루
  '팀조직':   { bg: '#F3E8FF', text: '#6B21A8', border: '#7C3AED' }, // 바이올렛
  '기타':     { bg: 'rgba(180,180,180,0.14)', text: '#6B6B6B', border: '#A8A8A8' },
};

export function getCategoryColor(category) {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS['기타'];
}
