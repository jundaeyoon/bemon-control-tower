export const projects = [
  { id: 1, name: '브랜드 가이드라인',  status: '진행중', assignee: 'JUN',    deadline: '2026-07-01', progress: 60 },
  { id: 2, name: '소셜미디어 콘텐츠',  status: '완료',   assignee: 'SURI',   deadline: '2026-06-15', progress: 100 },
  { id: 3, name: '패키지 디자인',      status: '대기',   assignee: 'SUNNY!', deadline: '2026-07-20', progress: 0 },
  { id: 4, name: '웹사이트 리뉴얼',    status: '진행중', assignee: 'JIN',    deadline: '2026-08-01', progress: 35 },
  { id: 5, name: 'SNS 캠페인 기획',    status: '진행중', assignee: 'SURI',   deadline: '2026-07-10', progress: 50 },
];

export const schedule = [
  { id: 1, title: '주간 팀 미팅',            date: '2026-06-17', time: '14:00', attendees: ['JUN', 'SURI', 'SUNNY!', 'JIN'] },
  { id: 2, title: '클라이언트 프레젠테이션', date: '2026-06-20', time: '10:00', attendees: ['JUN', 'JIN'] },
  { id: 3, title: '브랜딩 워크샵',           date: '2026-06-25', time: '13:00', attendees: ['JUN', 'SURI', 'SUNNY!', 'JIN'] },
  { id: 4, title: '분기 리뷰',               date: '2026-06-30', time: '15:00', attendees: ['JUN', 'SURI'] },
  { id: 5, title: '파트너 미팅',             date: '2026-07-05', time: '11:00', attendees: ['JUN', 'JIN'] },
];

export const brainstorm = [
  { id: 1, idea: '친환경 패키지 라인업', category: '제품',    author: 'SUNNY!', votes: 5 },
  { id: 2, idea: '시즌 한정 콜라보',    category: '마케팅',   author: 'SURI',   votes: 8 },
  { id: 3, idea: '충성 고객 멤버십',    category: '고객관리', author: 'JUN',    votes: 12 },
  { id: 4, idea: '팝업스토어 기획',     category: '이벤트',   author: 'JIN',    votes: 7 },
  { id: 5, idea: '인플루언서 협업',     category: '마케팅',   author: 'SURI',   votes: 9 },
  { id: 6, idea: '구독 박스 서비스',    category: '제품',     author: 'JUN',    votes: 11 },
];

export const goals = [
  { id: 1, title: 'Q3 매출 목표',       progress: 45, target: '₩50M',     current: '₩22.5M',  owner: 'JUN' },
  { id: 2, title: '브랜드 인지도 향상', progress: 72, target: '팔로워 10K', current: '7.2K',    owner: 'SURI' },
  { id: 3, title: '신제품 라인 출시',   progress: 30, target: '5개 제품',   current: '1.5개',   owner: 'SUNNY!' },
  { id: 4, title: '파트너십 체결',      progress: 60, target: '3개사',      current: '1.8개사', owner: 'JIN' },
];
