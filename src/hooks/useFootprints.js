import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useFootprints() {
  const [footprints, setFootprints] = useState([]);

  useEffect(() => {
    supabase
      .from('brand_footprints')
      .select('*, footprint_feedbacks(*)')
      .order('date', { ascending: false })
      .then(({ data, error }) => {
        if (error) { console.error('[useFootprints] fetch:', error); return; }
        setFootprints(data ?? []);
      });
  }, []);

  const addFootprint = useCallback(async ({ title, date, category, description = null }) => {
    const payload = { title: title.trim(), date, category, description: description?.trim() || null };
    const { data, error } = await supabase
      .from('brand_footprints')
      .insert(payload)
      .select()
      .single();
    if (error) { console.error('[useFootprints] add:', error); return null; }
    const withFeedbacks = { ...data, footprint_feedbacks: [] };
    setFootprints(prev => [withFeedbacks, ...prev].sort((a, b) => b.date.localeCompare(a.date)));
    return withFeedbacks;
  }, []);

  const addFeedback = useCallback(async (footprintId, { content, author }) => {
    const payload = { footprint_id: footprintId, content: content.trim(), author };
    const { data, error } = await supabase
      .from('footprint_feedbacks')
      .insert(payload)
      .select()
      .single();
    if (error) { console.error('[useFootprints] addFeedback:', error); return null; }
    setFootprints(prev => prev.map(fp =>
      fp.id === footprintId
        ? { ...fp, footprint_feedbacks: [...(fp.footprint_feedbacks ?? []), data] }
        : fp
    ));
    return data;
  }, []);

  return { footprints, addFootprint, addFeedback };
}
