import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function usePersonalTasks(assignee) {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    if (!assignee) return;
    supabase
      .from('personal_tasks')
      .select('*')
      .eq('assignee', assignee)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) { console.error('[usePersonalTasks] fetch:', error); return; }
        setTasks(data ?? []);
      });
  }, [assignee]);

  const addTask = useCallback(async (content, deadline) => {
    const { data, error } = await supabase
      .from('personal_tasks')
      .insert({ assignee, content, deadline: deadline || null, completed: false })
      .select()
      .single();
    if (error) { console.error('[usePersonalTasks] add:', error); return; }
    setTasks(prev => [...prev, data]);
  }, [assignee]);

  const toggleTask = useCallback(async (id) => {
    setTasks(prev => {
      const task = prev.find(t => t.id === id);
      if (!task) return prev;
      const completed = !task.completed;
      supabase.from('personal_tasks').update({ completed }).eq('id', id)
        .then(({ error }) => { if (error) console.error(error); });
      return prev.map(t => t.id === id ? { ...t, completed } : t);
    });
  }, []);

  const deleteTask = useCallback(async (id) => {
    supabase.from('personal_tasks').delete().eq('id', id)
      .then(({ error }) => { if (error) console.error(error); });
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  const updateTask = useCallback(async (id, fields) => {
    supabase.from('personal_tasks').update(fields).eq('id', id)
      .then(({ error }) => { if (error) console.error('[usePersonalTasks] update:', error); });
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...fields } : t));
  }, []);

  return { tasks, addTask, toggleTask, deleteTask, updateTask };
}
