import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { addMemberXP } from './useMemberXP';

export function useGoals() {
  const [goals, setGoals] = useState([]);
  const goalsRef = useRef([]);
  useEffect(() => { goalsRef.current = goals; }, [goals]);

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

    // 클리어 조건 달성 시 파이터에게 +50 XP
    if (fields.clear_conditions) {
      const currentGoal = goalsRef.current.find(g => g.id === goalId);
      if (currentGoal) {
        const oldConds = currentGoal.clear_conditions ?? [];
        fields.clear_conditions.forEach(nc => {
          const oc = oldConds.find(c => c.id === nc.id);
          const wasCleared = oc && Number(oc.current) >= Number(oc.target) && Number(oc.target) > 0;
          const isNowCleared = Number(nc.current) >= Number(nc.target) && Number(nc.target) > 0;
          if (!wasCleared && isNowCleared) {
            const fighters = (currentGoal.fighters ?? [])
              .filter(f => f.selected)
              .map(f => (typeof f === 'string' ? f : f.name));
            fighters.forEach(member => addMemberXP(member, 50));
          }
        });
      }
    }
  }, []);

  const deleteGoal = useCallback(async (yearMonth) => {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('year_month', yearMonth);
    if (error) {
      console.error('[useGoals] delete 에러:', error);
      return;
    }
    setGoals(prev => prev.filter(g => g.year_month !== yearMonth));
  }, []);

  return { goals, getOrCreateGoal, updateGoal, deleteGoal };
}
