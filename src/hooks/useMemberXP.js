import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const MEMBERS = ['JUN', 'SURI', 'SUNNY!', 'LENA'];

export const LEVEL_TABLE = [
  { level: 1, min: 0,    emoji: '🌱', title: '베몽 새싹' },
  { level: 2, min: 100,  emoji: '🔥', title: '베몽 파이터' },
  { level: 3, min: 250,  emoji: '⚡', title: '베몽 에이스' },
  { level: 4, min: 500,  emoji: '💎', title: '베몽 레전드' },
  { level: 5, min: 1000, emoji: '👑', title: '베몽 마스터' },
];

export function getLevelInfo(xp) {
  let entry = LEVEL_TABLE[0];
  for (const l of LEVEL_TABLE) {
    if (xp >= l.min) entry = l;
    else break;
  }
  const nextIdx = LEVEL_TABLE.indexOf(entry) + 1;
  const next = LEVEL_TABLE[nextIdx] ?? null;
  const rangeXP = next ? next.min - entry.min : 1;
  const progress = next ? Math.min(1, (xp - entry.min) / rangeXP) : 1;
  return { ...entry, xp, progress, next };
}

// Module-level event bus: keeps multiple useMemberXP() instances in sync
const xpListeners = new Set();
function notifyXPChange(member, newXP) {
  xpListeners.forEach(fn => fn(member, newXP));
}

export async function addMemberXP(member, amount) {
  if (!MEMBERS.includes(member)) return;
  try {
    const { data } = await supabase
      .from('member_xp').select('xp').eq('member', member).maybeSingle();
    const newXP = (data?.xp ?? 0) + amount;
    await supabase.from('member_xp').upsert(
      { member, xp: newXP, updated_at: new Date().toISOString() },
      { onConflict: 'member' }
    );
    notifyXPChange(member, newXP);
  } catch (err) {
    console.error('[addMemberXP]', err);
  }
}

const INIT_MAP = Object.fromEntries(MEMBERS.map(m => [m, 0]));

export function useMemberXP() {
  const [xpMap, setXpMap] = useState(INIT_MAP);
  const [levelUpEvent, setLevelUpEvent] = useState(null); // { member, level, emoji, title }

  useEffect(() => {
    supabase.from('member_xp').select('member, xp').then(({ data, error }) => {
      if (error) { console.error('[useMemberXP] fetch:', error); return; }
      const map = { ...INIT_MAP };
      (data ?? []).forEach(r => { if (r.member in map) map[r.member] = r.xp; });
      setXpMap(map);
    });

    const onXPChange = (member, newXP) => {
      setXpMap(prev => {
        const prevXP = prev[member] ?? 0;
        const prevLvl = getLevelInfo(prevXP).level;
        const newInfo = getLevelInfo(newXP);
        if (newInfo.level > prevLvl) {
          // Defer to avoid calling setState inside another setState's updater
          setTimeout(() => setLevelUpEvent({ member, ...newInfo }), 0);
        }
        return { ...prev, [member]: newXP };
      });
    };

    xpListeners.add(onXPChange);
    return () => xpListeners.delete(onXPChange);
  }, []);

  const clearLevelUp = useCallback(() => setLevelUpEvent(null), []);

  return { xpMap, levelUpEvent, clearLevelUp };
}
