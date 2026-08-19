import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// ── 목록 화면용 훅 ────────────────────────────────────────────
// company_dinners는 더 이상 싱글턴이 아니라 여러 행을 갖는 진짜 목록.
export function useCompanyDinner() {
  const [dinners, setDinners] = useState([]); // [{ ...row, attendingCount }]

  const refreshDinners = useCallback(async () => {
    const { data: rows, error } = await supabase
      .from('company_dinners')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) { console.error('[useCompanyDinner] fetch list:', error); return; }

    const list = rows ?? [];
    if (list.length === 0) { setDinners([]); return; }

    // 카드에 표시할 "참석 인원 수" 배지를 위해 한 번에 집계
    const ids = list.map(d => d.id);
    const { data: attendeeRows, error: aErr } = await supabase
      .from('dinner_attendees')
      .select('dinner_id, status')
      .in('dinner_id', ids);
    if (aErr) console.error('[useCompanyDinner] fetch attendee counts:', aErr);

    const countMap = {};
    (attendeeRows ?? []).forEach(a => {
      if (a.status === '참석') countMap[a.dinner_id] = (countMap[a.dinner_id] ?? 0) + 1;
    });

    setDinners(list.map(d => ({ ...d, attendingCount: countMap[d.id] ?? 0 })));
  }, []);

  useEffect(() => {
    (async () => { await refreshDinners(); })();
  }, [refreshDinners]);

  const addDinner = useCallback(async () => {
    const { data, error } = await supabase
      .from('company_dinners')
      .insert({})
      .select()
      .single();
    if (error) { console.error('[useCompanyDinner] add:', error); return null; }
    setDinners(prev => [{ ...data, attendingCount: 0 }, ...prev]);
    return data;
  }, []);

  const updateDinner = useCallback(async (dinnerId, { title, date }) => {
    const payload = {};
    if (title !== undefined) payload.title = title.trim() || '공포의 회식';
    if (date  !== undefined) payload.date  = date || null;
    const { data, error } = await supabase
      .from('company_dinners')
      .update(payload)
      .eq('id', dinnerId)
      .select()
      .single();
    if (error) { console.error('[useCompanyDinner] update:', error); return null; }
    setDinners(prev => prev.map(d => (d.id === dinnerId ? { ...d, ...data } : d)));
    return data;
  }, []);

  return { dinners, addDinner, updateDinner, refreshDinners };
}

// ── 상세 화면용 훅 ────────────────────────────────────────────
// 회식 하나(dinnerId)의 참석자 / 메뉴 투표 / 장소 투표를 다룬다.
export function useDinnerDetail(dinnerId) {
  const [attendees, setAttendees] = useState([]);
  const [menus,     setMenus]     = useState([]);
  const [locations, setLocations] = useState([]);
  const [loaded,    setLoaded]    = useState(false);

  useEffect(() => {
    if (!dinnerId) return;
    let cancelled = false;
    (async () => {
      const [
        { data: a, error: ae },
        { data: m, error: me },
        { data: l, error: le },
      ] = await Promise.all([
        supabase.from('dinner_attendees').select('*').eq('dinner_id', dinnerId),
        supabase.from('dinner_menu_votes').select('*').eq('dinner_id', dinnerId),
        supabase.from('dinner_location_votes').select('*').eq('dinner_id', dinnerId),
      ]);
      if (ae) console.error('[useDinnerDetail] fetch attendees:', ae);
      if (me) console.error('[useDinnerDetail] fetch menus:', me);
      if (le) console.error('[useDinnerDetail] fetch locations:', le);
      if (cancelled) return;
      setAttendees(a ?? []);
      setMenus(m ?? []);
      setLocations(l ?? []);
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [dinnerId]);

  const setAttendeeStatus = useCallback(async (member, status) => {
    const existing = attendees.find(a => a.member === member);
    if (existing) {
      const { data, error } = await supabase
        .from('dinner_attendees')
        .update({ status })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) { console.error('[useDinnerDetail] update attendee:', error); return null; }
      setAttendees(prev => prev.map(a => (a.id === data.id ? data : a)));
      return data;
    }
    const { data, error } = await supabase
      .from('dinner_attendees')
      .insert({ dinner_id: dinnerId, member, status })
      .select()
      .single();
    if (error) { console.error('[useDinnerDetail] add attendee:', error); return null; }
    setAttendees(prev => [...prev, data]);
    return data;
  }, [attendees, dinnerId]);

  const addMenu = useCallback(async (menuName) => {
    const trimmed = menuName.trim();
    if (!trimmed) return null;
    const { data, error } = await supabase
      .from('dinner_menu_votes')
      .insert({ dinner_id: dinnerId, menu_name: trimmed, voted_by: [] })
      .select()
      .single();
    if (error) { console.error('[useDinnerDetail] add menu:', error); return null; }
    setMenus(prev => [...prev, data]);
    return data;
  }, [dinnerId]);

  const toggleMenuVote = useCallback(async (menuId, member) => {
    if (!member) return null;
    const menu = menus.find(m => m.id === menuId);
    if (!menu) return null;
    const voters = menu.voted_by ?? [];
    const nextVoters = voters.includes(member) ? voters.filter(v => v !== member) : [...voters, member];
    const { data, error } = await supabase
      .from('dinner_menu_votes')
      .update({ voted_by: nextVoters })
      .eq('id', menuId)
      .select()
      .single();
    if (error) { console.error('[useDinnerDetail] toggle menu vote:', error); return null; }
    setMenus(prev => prev.map(m => (m.id === menuId ? data : m)));
    return data;
  }, [menus]);

  const addLocation = useCallback(async (locationName) => {
    const trimmed = locationName.trim();
    if (!trimmed) return null;
    const { data, error } = await supabase
      .from('dinner_location_votes')
      .insert({ dinner_id: dinnerId, location_name: trimmed, voted_by: [] })
      .select()
      .single();
    if (error) { console.error('[useDinnerDetail] add location:', error); return null; }
    setLocations(prev => [...prev, data]);
    return data;
  }, [dinnerId]);

  const toggleLocationVote = useCallback(async (locationId, member) => {
    if (!member) return null;
    const loc = locations.find(l => l.id === locationId);
    if (!loc) return null;
    const voters = loc.voted_by ?? [];
    const nextVoters = voters.includes(member) ? voters.filter(v => v !== member) : [...voters, member];
    const { data, error } = await supabase
      .from('dinner_location_votes')
      .update({ voted_by: nextVoters })
      .eq('id', locationId)
      .select()
      .single();
    if (error) { console.error('[useDinnerDetail] toggle location vote:', error); return null; }
    setLocations(prev => prev.map(l => (l.id === locationId ? data : l)));
    return data;
  }, [locations]);

  return {
    attendees, menus, locations, loaded,
    setAttendeeStatus, addMenu, toggleMenuVote, addLocation, toggleLocationVote,
  };
}
