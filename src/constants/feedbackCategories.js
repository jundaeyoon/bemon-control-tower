export const FEEDBACK_CATEGORIES = ['성과', '시기', '아이템', '일반'];

export const FEEDBACK_CATEGORY_COLORS = {
  '성과':   { bg: '#E8F7F0', text: '#2F7A55', border: '#4CAF82' }, // 포지티브 그린
  '시기':   { bg: '#FDF3DC', text: '#966A1F', border: '#D4A843' }, // 머스타드
  '아이템': { bg: '#F3E8FF', text: '#6B21A8', border: '#7C3AED' }, // 바이올렛
  '일반':   { bg: 'rgba(180,180,180,0.14)', text: '#6B6B6B', border: '#A8A8A8' },
};

export function getFeedbackCategoryColor(category) {
  return FEEDBACK_CATEGORY_COLORS[category] ?? FEEDBACK_CATEGORY_COLORS['일반'];
}
