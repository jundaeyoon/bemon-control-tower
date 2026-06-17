export const NODE_WIDTH  = { hub: 148, branch: 190 };
export const NODE_HEIGHT = { hub: 108, branch: 84 };

export const INITIAL_NODES = [
  {
    id: 'hub',
    type: 'hub',
    position: { x: 46, y: -54 },
    data: { label: 'BEMON', sublabel: '팀 컨트롤 타워' },
    width:  NODE_WIDTH.hub,
    height: NODE_HEIGHT.hub,
  },
  {
    id: 'projects',
    type: 'branch',
    position: { x: -400, y: -155 },
    data: { label: '프로젝트', emoji: '📂', accent: 'salmon',  parentId: 'hub', side: 'left',  hasChildren: false },
    width:  NODE_WIDTH.branch,
    height: NODE_HEIGHT.branch,
    hidden: true,
  },
  {
    id: 'schedule',
    type: 'branch',
    position: { x: 430, y: -155 },
    data: { label: '스케줄', emoji: '📅', accent: 'green', parentId: 'hub', side: 'right', hasChildren: false },
    width:  NODE_WIDTH.branch,
    height: NODE_HEIGHT.branch,
    hidden: true,
  },
  {
    id: 'brainstorm',
    type: 'branch',
    position: { x: -400, y: 71 },
    data: { label: '브레인스토밍', emoji: '💡', accent: 'green', parentId: 'hub', side: 'left', hasChildren: false },
    width:  NODE_WIDTH.branch,
    height: NODE_HEIGHT.branch,
    hidden: true,
  },
  {
    id: 'goals',
    type: 'branch',
    position: { x: 430, y: 71 },
    data: { label: '이달의 퀘스트', emoji: '🎯', accent: 'mustard', parentId: 'hub', side: 'right', hasChildren: false },
    width:  NODE_WIDTH.branch,
    height: NODE_HEIGHT.branch,
    hidden: true,
  },
];

export const INITIAL_EDGES = [
  { id: 'e-hub-projects',   source: 'hub', target: 'projects',   type: 'rough', data: { color: '#C06850', seed: 1 } },
  { id: 'e-hub-schedule',   source: 'hub', target: 'schedule',   type: 'rough', data: { color: '#6B7C5C', seed: 2 } },
  { id: 'e-hub-brainstorm', source: 'hub', target: 'brainstorm', type: 'rough', data: { color: '#6B7C5C', seed: 3 } },
  { id: 'e-hub-goals',      source: 'hub', target: 'goals',      type: 'rough', data: { color: '#D4A843', seed: 4 } },
];
