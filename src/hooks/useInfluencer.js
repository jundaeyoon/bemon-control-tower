import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useInfluencer() {
  const [missions, setMissions] = useState([]);

  useEffect(() => {
    supabase
      .from('influencer_missions')
      .select('*')
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) { console.error('[useInfluencer] fetch:', error); return; }
        setMissions(data ?? []);
      });
  }, []);

  const addMission = useCallback(async ({ type = 'reels', title = '', content = '', scheduled_date = null }) => {
    const payload = { type, title, content, scheduled_date, completed: false, ref_images: [], ref_links: [] };
    const { data, error } = await supabase
      .from('influencer_missions')
      .insert(payload)
      .select()
      .single();
    if (error) { console.error('[useInfluencer] add:', error); return; }
    setMissions(prev => [...prev, data]);
  }, []);

  const updateMission = useCallback(async (id, fields) => {
    const updates = { ...fields, updated_at: new Date().toISOString() };
    const { data, error } = await supabase
      .from('influencer_missions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) { console.error('[useInfluencer] update:', error); return; }
    setMissions(prev => prev.map(m => m.id === id ? data : m));
  }, []);

  const toggleComplete = useCallback((id) => {
    setMissions(prev => {
      const mission = prev.find(m => m.id === id);
      if (!mission) return prev;
      const completed = !mission.completed;
      supabase.from('influencer_missions').update({ completed }).eq('id', id)
        .then(({ error }) => { if (error) console.error('[useInfluencer] toggle:', error); });
      return prev.map(m => m.id === id ? { ...m, completed } : m);
    });
  }, []);

  const deleteMission = useCallback(async (id) => {
    const { error } = await supabase.from('influencer_missions').delete().eq('id', id);
    if (error) { console.error('[useInfluencer] delete:', error); return; }
    setMissions(prev => prev.filter(m => m.id !== id));
  }, []);

  const uploadImage = useCallback((missionId, file) => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/')) {
        resolve({ error: '이미지 파일만 업로드할 수 있어요.' });
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const newImg = {
          id:   `img-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          name: file.name,
          url:  e.target.result,
        };
        setMissions(prev => {
          const mission = prev.find(m => m.id === missionId);
          if (!mission) { resolve({ error: '임무를 찾을 수 없어요.' }); return prev; }
          const ref_images = [...(mission.ref_images ?? []), newImg];
          supabase.from('influencer_missions').update({ ref_images }).eq('id', missionId)
            .then(({ error }) => {
              if (error) { console.error('[useInfluencer] img update:', error); resolve({ error: error.message }); }
              else resolve({ error: null });
            });
          return prev.map(m => m.id === missionId ? { ...m, ref_images } : m);
        });
      };
      reader.onerror = () => resolve({ error: '파일 읽기에 실패했어요.' });
      reader.readAsDataURL(file);
    });
  }, []);

  const removeImage = useCallback((missionId, imgId) => {
    setMissions(prev => {
      const mission = prev.find(m => m.id === missionId);
      if (!mission) return prev;
      const ref_images = (mission.ref_images ?? []).filter(img => img.id !== imgId);
      supabase.from('influencer_missions').update({ ref_images }).eq('id', missionId)
        .then(({ error }) => { if (error) console.error('[useInfluencer] img remove:', error); });
      return prev.map(m => m.id === missionId ? { ...m, ref_images } : m);
    });
  }, []);

  const addLink = useCallback((missionId, url) => {
    if (!url.trim()) return;
    setMissions(prev => {
      const mission = prev.find(m => m.id === missionId);
      if (!mission) return prev;
      const ref_links = [...(mission.ref_links ?? []), { id: Date.now().toString(), url: url.trim() }];
      supabase.from('influencer_missions').update({ ref_links }).eq('id', missionId)
        .then(({ error }) => { if (error) console.error('[useInfluencer] link add:', error); });
      return prev.map(m => m.id === missionId ? { ...m, ref_links } : m);
    });
  }, []);

  const removeLink = useCallback((missionId, linkId) => {
    setMissions(prev => {
      const mission = prev.find(m => m.id === missionId);
      if (!mission) return prev;
      const ref_links = (mission.ref_links ?? []).filter(l => l.id !== linkId);
      supabase.from('influencer_missions').update({ ref_links }).eq('id', missionId)
        .then(({ error }) => { if (error) console.error('[useInfluencer] link remove:', error); });
      return prev.map(m => m.id === missionId ? { ...m, ref_links } : m);
    });
  }, []);

  return { missions, addMission, updateMission, toggleComplete, deleteMission, uploadImage, removeImage, addLink, removeLink };
}
