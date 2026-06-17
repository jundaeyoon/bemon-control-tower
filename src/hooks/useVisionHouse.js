import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useVisionHouse() {
  const [house, setHouse] = useState(null);

  useEffect(() => {
    supabase.from('vision_house').select('*').limit(1).single()
      .then(({ data }) => { if (data) setHouse(data); });
  }, []);

  const updateHouse = useCallback(async (fields) => {
    if (house) {
      const { data, error } = await supabase
        .from('vision_house')
        .update(fields)
        .eq('id', house.id)
        .select()
        .single();
      if (error) { console.error('[useVisionHouse] update 에러:', error); return; }
      setHouse(data);
    } else {
      const payload = { mission: '', vision: '', capability: '', values: '', ...fields };
      const { data, error } = await supabase
        .from('vision_house')
        .insert(payload)
        .select()
        .single();
      if (error) { console.error('[useVisionHouse] insert 에러:', error); return; }
      setHouse(data);
    }
  }, [house]);

  return { house, updateHouse };
}
