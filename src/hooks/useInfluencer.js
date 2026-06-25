import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const BUCKET = 'influencer-refs';

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

  const addMission = useCallback(async ({ type = 'reels', content = '', scheduled_date = null }) => {
    const payload = { type, content, scheduled_date, completed: false, ref_images: [], ref_links: [] };
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
    const mission = missions.find(m => m.id === id);
    if (mission?.ref_images?.length) {
      const paths = mission.ref_images.map(img => img.path).filter(Boolean);
      if (paths.length) {
        await supabase.storage.from(BUCKET).remove(paths);
      }
    }
    const { error } = await supabase.from('influencer_missions').delete().eq('id', id);
    if (error) { console.error('[useInfluencer] delete:', error); return; }
    setMissions(prev => prev.filter(m => m.id !== id));
  }, [missions]);

  const uploadImage = useCallback(async (missionId, file) => {
    const ext  = file.name.split('.').pop();
    const path = `${missionId}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file);
    if (upErr) { console.error('[useInfluencer] upload:', upErr); return; }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const newImg = { id: path, path, url: urlData.publicUrl, name: file.name };

    setMissions(prev => {
      const mission = prev.find(m => m.id === missionId);
      if (!mission) return prev;
      const ref_images = [...(mission.ref_images ?? []), newImg];
      supabase.from('influencer_missions').update({ ref_images }).eq('id', missionId)
        .then(({ error }) => { if (error) console.error('[useInfluencer] img update:', error); });
      return prev.map(m => m.id === missionId ? { ...m, ref_images } : m);
    });
  }, []);

  const removeImage = useCallback(async (missionId, imgId) => {
    await supabase.storage.from(BUCKET).remove([imgId]);
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
