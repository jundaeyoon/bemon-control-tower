import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useSchedule() {
  const [schedules,     setSchedules]     = useState([]);
  const [personalTasks, setPersonalTasks] = useState([]);
  const [projectTasks,  setProjectTasks]  = useState([]);

  useEffect(() => {
    supabase
      .from('schedules')
      .select('*')
      .order('date', { ascending: true })
      .then(({ data, error }) => {
        if (error) { console.error('[useSchedule] schedules 에러:', error); return; }
        setSchedules(data ?? []);
      });

    supabase
      .from('personal_tasks')
      .select('*')
      .not('deadline', 'is', null)
      .then(({ data, error }) => {
        if (error) { console.error('[useSchedule] personal_tasks 에러:', error); return; }
        setPersonalTasks(data ?? []);
      });

    supabase
      .from('tasks')
      .select('*, projects(name)')
      .not('deadline', 'is', null)
      .then(({ data, error }) => {
        if (error) { console.error('[useSchedule] tasks 에러:', error); return; }
        setProjectTasks(data ?? []);
      });
  }, []);

  const addSchedule = useCallback(async ({ title, date, assignee, repeat = 'none' }) => {
    const { data, error } = await supabase
      .from('schedules')
      .insert({ title, date, assignee, repeat })
      .select()
      .single();
    if (error) { console.error('[useSchedule] insert 에러:', error); throw error; }
    setSchedules(prev => [...prev, data].sort((a, b) => a.date.localeCompare(b.date)));
    return data;
  }, []);

  const updateSchedule = useCallback(async (id, fields) => {
    const { data, error } = await supabase
      .from('schedules')
      .update(fields)
      .eq('id', id)
      .select()
      .single();
    if (error) { console.error('[useSchedule] update 에러:', error); throw error; }
    setSchedules(prev => prev.map(s => s.id === id ? data : s));
    return data;
  }, []);

  const deleteSchedule = useCallback(async (id) => {
    const { error } = await supabase.from('schedules').delete().eq('id', id);
    if (error) { console.error('[useSchedule] delete 에러:', error); throw error; }
    setSchedules(prev => prev.filter(s => s.id !== id));
  }, []);

  return { schedules, personalTasks, projectTasks, addSchedule, updateSchedule, deleteSchedule };
}
