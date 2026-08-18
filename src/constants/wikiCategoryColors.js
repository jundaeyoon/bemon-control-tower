// 위키 카테고리는 고정 목록이 아니라 문서 작성 시 자유 입력이라, 카테고리 이름을
// 해시로 팔레트에 매핑해 색을 배정한다 (같은 이름은 항상 같은 색).
const PALETTE = [
  { bg: '#EAF0F6', text: '#334E68', border: '#334E68' }, // navy (브랜치 색과 동일)
  { bg: '#FDEEE8', text: '#C05A30', border: '#E8896A' }, // 코랄
  { bg: '#EEF2E6', text: '#4E5E38', border: '#6B7C45' }, // 올리브그린
  { bg: '#FFF8E1', text: '#B8903A', border: '#D4A843' }, // 머스터드
  { bg: '#F3E8FF', text: '#6B21A8', border: '#7C3AED' }, // 바이올렛
  { bg: '#E0F2FE', text: '#0369A1', border: '#0284C7' }, // 스카이블루
  { bg: '#FCE7F3', text: '#BE185D', border: '#EC4899' }, // 핫핑크
  { bg: '#ECFDF5', text: '#15803D', border: '#388E3C' }, // 에메랄드
];

const FALLBACK = { bg: 'rgba(180,180,180,0.14)', text: '#6B6B6B', border: '#A8A8A8' };

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function getWikiCategoryColor(category) {
  if (!category) return FALLBACK;
  return PALETTE[hashString(category) % PALETTE.length];
}
