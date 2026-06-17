import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const DEFAULT_ROW = {
  mission: '', vision: '', competency: '', values: '',
  team_spirit: '', jun_promise: '',
};

export function useVisionHouse() {
  const [house, setHouse] = useState(null);

  useEffect(() => {
    (async () => {
      console.log('[useVisionHouse] 🔍 초기 데이터 로드 시작');

      const { data: rows, error } = await supabase
        .from('vision_house')
        .select('*')
        .limit(1);

      console.log('[useVisionHouse] select 결과 →', { rows, error });

      if (error) {
        console.error('[useVisionHouse] ❌ select 에러:', error.code, error.message, error.details);
        return;
      }

      if (rows && rows.length > 0) {
        console.log('[useVisionHouse] ✅ 기존 행 로드 완료 id=', rows[0].id);
        setHouse(rows[0]);
      } else {
        console.log('[useVisionHouse] ⚠️ 행 없음 → 기본 행 생성 시도');
        const { data: created, error: insertErr } = await supabase
          .from('vision_house')
          .insert(DEFAULT_ROW)
          .select()
          .single();

        console.log('[useVisionHouse] insert 결과 →', { created, insertErr });

        if (insertErr) {
          console.error('[useVisionHouse] ❌ 기본 행 생성 에러:', insertErr.code, insertErr.message, insertErr.details, insertErr.hint);
          return;
        }
        console.log('[useVisionHouse] ✅ 기본 행 생성 완료 id=', created.id);
        setHouse(created);
      }
    })();
  }, []);

  const updateHouse = useCallback(async (fields) => {
    console.log('[useVisionHouse] 💾 updateHouse 호출 →', { fields, house_id: house?.id, house_is_null: !house });

    if (!house) {
      const err = new Error('[useVisionHouse] house가 null — 아직 로드 안 됐거나 초기화 실패');
      console.error('[useVisionHouse] ❌', err.message);
      throw err;
    }

    console.log('[useVisionHouse] Supabase update 실행 → table: vision_house, id:', house.id, ', fields:', fields);

    const { data, error } = await supabase
      .from('vision_house')
      .update(fields)
      .eq('id', house.id)
      .select()
      .single();

    console.log('[useVisionHouse] update 결과 →', { data, error });

    if (error) {
      console.error('[useVisionHouse] ❌ update 에러:', error.code, error.message, error.details, error.hint);
      throw error;
    }

    console.log('[useVisionHouse] ✅ 저장 성공:', data);
    setHouse(data);
    return data;
  }, [house]);

  return { house, updateHouse };
}
