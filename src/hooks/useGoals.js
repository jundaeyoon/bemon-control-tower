import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useGoals() {
  const [goals, setGoals] = useState([]);

  useEffect(() => {
    async function fetchAll() {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .order('year_month', { ascending: false });
      if (error) {
        console.error('[useGoals] fetch 에러:', error);
        return;
      }
      setGoals(data ?? []);
    }
    fetchAll();
  }, []);

  const getOrCreateGoal = useCallback(async (yearMonth) => {
    const inState = goals.find(g => g.year_month === yearMonth);
    if (inState) return inState;

    const payload = {
      year_month:       yearMonth,
      quest:            '',
      clear_conditions: [],
      fighters:         [],
      check_daily:      false,
      check_weekly:     false,
      check_monthly:    false,
      golden_rule:      '',
      result:           '',
    };

    // upsert — year_month has UNIQUE constraint, so safe to call repeatedly
    const { data, error } = await supabase
      .from('goals')
      .upsert(payload, { onConflict: 'year_month' })
      .select()
      .single();

    if (error) {
      console.error('[useGoals] getOrCreate 에러:', error);
      return null;
    }
    setGoals(prev => prev.some(g => g.id === data.id) ? prev : [data, ...prev]);
    return data;
  }, [goals]);

  const updateGoal = useCallback(async (goalId, fields) => {
    const { data, error } = await supabase
      .from('goals')
      .update(fields)
      .eq('id', goalId)
      .select()
      .single();
    if (error) {
      console.error('[useGoals] update 에러:', error);
      return;
    }
    setGoals(prev => prev.map(g => g.id === goalId ? data : g));
  }, []);

  return { goals, getOrCreateGoal, updateGoal };
}
