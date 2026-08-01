export const MEMBER_COLORS = {
  JUN:      { bg: '#FDEEE8', text: '#E8896A', border: '#E8896A' },
  SURI:     { bg: '#EEF2E6', text: '#6B7C45', border: '#6B7C45' },
  'SUNNY!': { bg: '#FFF8E1', text: '#F59E0B', border: '#F59E0B' },
  WENDY:    { bg: '#F3E8FF', text: '#9333EA', border: '#9333EA' },
  LENA:     { bg: '#E0F2FE', text: '#0284C7', border: '#0284C7' },
  JINI:     { bg: '#CCFBF1', text: '#0D9488', border: '#0D9488' },
};

// Derived from MEMBER_COLORS so the roster can never drift out of sync with the color map.
export const MEMBERS = Object.keys(MEMBER_COLORS);

export function getMemberColor(name) {
  return MEMBER_COLORS[name] ?? { bg: 'rgba(180,180,180,0.12)', text: '#888', border: '#888' };
}

const MEMBER_INITIALS = {
  'SUNNY!': 'SS',
};

export function getMemberInitial(name) {
  return MEMBER_INITIALS[name] ?? name?.[0] ?? '';
}

const MEMBER_ROLES = {
  JUN:  '대표',
  JINI: '인스타그램 관리',
};

export function getMemberRole(name) {
  return MEMBER_ROLES[name] ?? null;
}
