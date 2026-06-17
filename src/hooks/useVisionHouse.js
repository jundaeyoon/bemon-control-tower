import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const DEFAULT_ROW = {
  mission: '', vision: '', capability: '', values: '',
  team_spirit: '', jun_promise: '',
};

export function useVisionHouse() {
  const [house, setHouse] = useState(null);

  useEffect(() => {
    (async () => {
      // .single() 은 행이 0개면 에러를 냄 → 배열로 받아서 직접 처리
      const { data: rows, error } = await supabase
        .from('vision_house')
        .select('*')
        .limit(1);

      if (error) {
        console.error('[useVisionHouse] select 에러:', error);
        return;
      }

      if (rows && rows.length > 0) {
        setHouse(rows[0]);
      } else {
        // 행이 없으면 기본 행 즉시 생성
        const { data: created, error: insertErr } = await supabase
          .from('vision_house')
          .insert(DEFAULT_ROW)
          .select()
          .single();

        if (insertErr) {
          console.error('[useVisionHouse] 기본 행 생성 에러:', insertErr);
          return;
        }
        setHouse(created);
      }
    })();
  }, []);

  const updateHouse = useCallback(async (fields) => {
    if (!house) {
      const err = new Error('[useVisionHouse] house 데이터가 아직 로드되지 않았습니다');
      console.error(err);
      throw err;
    }

    const { data, error } = await supabase
      .from('vision_house')
      .update(fields)
      .eq('id', house.id)
      .select()
      .single();

    if (error) {
      console.error('[useVisionHouse] update 에러:', error);
      throw error; // 호출부에서 catch 할 수 있도록 throw
    }

    setHouse(data);
    return data;
  }, [house]);

  return { house, updateHouse };
}
