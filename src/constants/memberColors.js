export const MEMBER_COLORS = {
  JUN:      { bg: '#FDEEE8', text: '#E8896A', border: '#E8896A' },
  SURI:     { bg: '#EEF2E6', text: '#6B7C45', border: '#6B7C45' },
  'SUNNY!': { bg: '#FFF8E1', text: '#F59E0B', border: '#F59E0B' },
  LENA:     { bg: '#E0F2FE', text: '#0284C7', border: '#0284C7' },
};

export function getMemberColor(name) {
  return MEMBER_COLORS[name] ?? { bg: 'rgba(180,180,180,0.12)', text: '#888', border: '#888' };
}

const MEMBER_INITIALS = {
  'SUNNY!': 'SS',
};

export function getMemberInitial(name) {
  return MEMBER_INITIALS[name] ?? name?.[0] ?? '';
}
