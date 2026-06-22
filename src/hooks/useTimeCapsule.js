import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useTimeCapsule() {
  const [capsules, setCapsules] = useState([]);

  useEffect(() => {
    supabase
      .from('time_capsules')
      .select('*')
      .order('open_date', { ascending: true })
      .then(({ data, error }) => {
        if (error) { console.error('[useTimeCapsule] fetch error:', error); return; }
        setCapsules(data ?? []);
      });
  }, []);

  const addCapsule = useCallback(async (title, content, open_date) => {
    const { data, error } = await supabase
      .from('time_capsules')
      .insert({ title, content, open_date })
      .select()
      .single();
    if (error) { console.error('[useTimeCapsule] insert error:', error); return; }
    setCapsules(prev =>
      [...prev, data].sort((a, b) => new Date(a.open_date) - new Date(b.open_date))
    );
  }, []);

  return { capsules, addCapsule };
}
