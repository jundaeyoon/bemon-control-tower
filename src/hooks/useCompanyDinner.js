import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// 회식은 항상 "가장 최근 1건"만 다루는 싱글턴 패턴 (useVisionHouse와 동일한 방식).
export function useCompanyDinner() {
  const [dinner,    setDinner]    = useState(null); // { id, title, date, location, created_at } | null
  const [attendees, setAttendees] = useState([]);
  const [menus,     setMenus]     = useState([]);

  const loadChildren = useCallback(async (dinnerId) => {
    const [{ data: a, error: ae }, { data: m, error: me }] = await Promise.all([
      supabase.from('dinner_attendees').select('*').eq('dinner_id', dinnerId),
      supabase.from('dinner_menu_votes').select('*').eq('dinner_id', dinnerId),
    ]);
    if (ae) console.error('[useCompanyDinner] fetch attendees:', ae);
    if (me) console.error('[useCompanyDinner] fetch menus:', me);
    setAttendees(a ?? []);
    setMenus(m ?? []);
  }, []);

  useEffect(() => {
    (async () => {
      const { data: rows, error } = await supabase
        .from('company_dinners')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);
      if (error) { console.error('[useCompanyDinner] fetch dinner:', error); return; }
      const current = rows?.[0] ?? null;
      setDinner(current);
      if (current) loadChildren(current.id);
    })();
  }, [loadChildren]);

  // 아직 회식 행이 없으면 만들어서 반환 (날짜/장소를 처음 저장하거나, 참석/투표를 처음 남길 때 호출됨)
  const ensureDinner = useCallback(async () => {
    if (dinner) return dinner;
    const { data, error } = await supabase
      .from('company_dinners')
      .insert({})
      .select()
      .single();
    if (error) { console.error('[useCompanyDinner] create dinner:', error); return null; }
    setDinner(data);
    return data;
  }, [dinner]);

  const updateDinnerInfo = useCallback(async ({ date, location }) => {
    const d = await ensureDinner();
    if (!d) return null;
    const payload = {};
    if (date     !== undefined) payload.date     = date || null;
    if (location !== undefined) payload.location = location?.trim() || null;
    const { data, error } = await supabase
      .from('company_dinners')
      .update(payload)
      .eq('id', d.id)
      .select()
      .single();
    if (error) { console.error('[useCompanyDinner] update dinner:', error); return null; }
    setDinner(data);
    return data;
  }, [ensureDinner]);

  const setAttendeeStatus = useCallback(async (member, status) => {
    const d = await ensureDinner();
    if (!d) return null;

    const existing = attendees.find(a => a.member === member);
    if (existing) {
      const { data, error } = await supabase
        .from('dinner_attendees')
        .update({ status })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) { console.error('[useCompanyDinner] update attendee:', error); return null; }
      setAttendees(prev => prev.map(a => (a.id === data.id ? data : a)));
      return data;
    }

    const { data, error } = await supabase
      .from('dinner_attendees')
      .insert({ dinner_id: d.id, member, status })
      .select()
      .single();
    if (error) { console.error('[useCompanyDinner] add attendee:', error); return null; }
    setAttendees(prev => [...prev, data]);
    return data;
  }, [attendees, ensureDinner]);

  const addMenu = useCallback(async (menuName) => {
    const trimmed = menuName.trim();
    if (!trimmed) return null;
    const d = await ensureDinner();
    if (!d) return null;
    const { data, error } = await supabase
      .from('dinner_menu_votes')
      .insert({ dinner_id: d.id, menu_name: trimmed, voted_by: [] })
      .select()
      .single();
    if (error) { console.error('[useCompanyDinner] add menu:', error); return null; }
    setMenus(prev => [...prev, data]);
    return data;
  }, [ensureDinner]);

  const toggleMenuVote = useCallback(async (menuId, member) => {
    if (!member) return null;
    const menu = menus.find(m => m.id === menuId);
    if (!menu) return null;
    const voters = menu.voted_by ?? [];
    const nextVoters = voters.includes(member)
      ? voters.filter(v => v !== member)
      : [...voters, member];
    const { data, error } = await supabase
      .from('dinner_menu_votes')
      .update({ voted_by: nextVoters })
      .eq('id', menuId)
      .select()
      .single();
    if (error) { console.error('[useCompanyDinner] toggle vote:', error); return null; }
    setMenus(prev => prev.map(m => (m.id === menuId ? data : m)));
    return data;
  }, [menus]);

  return { dinner, attendees, menus, updateDinnerInfo, setAttendeeStatus, addMenu, toggleMenuVote };
}
