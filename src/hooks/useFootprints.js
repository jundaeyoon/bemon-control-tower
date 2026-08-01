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

  const addFootprint = useCallback(async ({ title, date, category, description = null, achievement = '', timing = '', item = '', author = null }) => {
    const payload = { title: title.trim(), date, category, description: description?.trim() || null };
    const { data, error } = await supabase
      .from('brand_footprints')
      .insert(payload)
      .select()
      .single();
    if (error) { console.error('[useFootprints] add:', error); return null; }

    const feedbackRows = [
      { category: '성과',   content: achievement },
      { category: '시기',   content: timing },
      { category: '아이템', content: item },
    ]
      .filter(f => f.content.trim())
      .map(f => ({ footprint_id: data.id, content: f.content.trim(), author, category: f.category }));

    let insertedFeedbacks = [];
    if (feedbackRows.length > 0) {
      const { data: fbData, error: fbError } = await supabase
        .from('footprint_feedbacks')
        .insert(feedbackRows)
        .select();
      if (fbError) console.error('[useFootprints] add feedbacks:', fbError);
      else insertedFeedbacks = fbData;
    }

    const withFeedbacks = { ...data, footprint_feedbacks: insertedFeedbacks };
    setFootprints(prev => [withFeedbacks, ...prev].sort((a, b) => b.date.localeCompare(a.date)));
    return withFeedbacks;
  }, []);

  const addFeedback = useCallback(async (footprintId, { content, author, category = '일반' }) => {
    const payload = { footprint_id: footprintId, content: content.trim(), author, category };
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
