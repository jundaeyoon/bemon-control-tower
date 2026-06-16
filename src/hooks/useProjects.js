import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Images stay in localStorage (Supabase Storage 연결 전)
const imgKey   = (taskId) => `bemon-img-${taskId}`;
const loadImgs = (taskId) => { try { return JSON.parse(localStorage.getItem(imgKey(taskId)) ?? '[]'); } catch { return []; } };
const saveImgs = (taskId, imgs) => localStorage.setItem(imgKey(taskId), JSON.stringify(imgs));

function attachImages(task) {
  return { ...task, images: loadImgs(task.id) };
}

export function useProjects() {
  const [projects, setProjects] = useState([]);

  // 초기 로드: projects + tasks 한번에 fetch 후 병합
  useEffect(() => {
    async function fetchAll() {
      const [{ data: projs, error: pErr }, { data: tasks, error: tErr }] = await Promise.all([
        supabase.from('projects').select('*').order('created_at', { ascending: true }),
        supabase.from('tasks').select('*').order('created_at', { ascending: true }),
      ]);
      if (pErr || tErr) { console.error(pErr ?? tErr); return; }
      setProjects(
        (projs ?? []).map(p => ({
          ...p,
          tasks: (tasks ?? []).filter(t => t.project_id === p.id).map(attachImages),
        }))
      );
    }
    fetchAll();
  }, []);

  // ── Projects ──────────────────────────────────────────────────────────────

  const addProject = useCallback(async (name, pm = null) => {
    const { data, error } = await supabase
      .from('projects').insert({ name, pm }).select().single();
    if (error) { console.error(error); return null; }
    setProjects(prev => [...prev, { ...data, tasks: [] }]);
    return data.id;
  }, []);

  const updateProject = useCallback(async (projectId, updates) => {
    const { error } = await supabase
      .from('projects').update(updates).eq('id', projectId);
    if (error) { console.error(error); return; }
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...updates } : p));
  }, []);

  const deleteProject = useCallback(async (projectId) => {
    const { error } = await supabase
      .from('projects').delete().eq('id', projectId);
    if (error) { console.error(error); return; }
    setProjects(prev => prev.filter(p => p.id !== projectId));
  }, []);

  // ── Tasks ─────────────────────────────────────────────────────────────────

  const addTask = useCallback(async (projectId, fields) => {
    const { data, error } = await supabase
      .from('tasks')
      .insert({ project_id: projectId, completed: false, memo: '', ...fields })
      .select().single();
    if (error) { console.error(error); return null; }
    const task = attachImages(data);
    setProjects(prev => prev.map(p =>
      p.id === projectId ? { ...p, tasks: [...p.tasks, task] } : p
    ));
    return data.id;
  }, []);

  const updateTask = useCallback(async (projectId, taskId, updates) => {
    // eslint-disable-next-line no-unused-vars
    const { images: _imgs, ...dbUpdates } = updates; // images는 localStorage 전용
    const { error } = await supabase
      .from('tasks').update(dbUpdates).eq('id', taskId);
    if (error) { console.error(error); return; }
    setProjects(prev => prev.map(p =>
      p.id === projectId
        ? { ...p, tasks: p.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t) }
        : p
    ));
  }, []);

  const updateTaskMemo = useCallback(async (projectId, taskId, memo) => {
    const { error } = await supabase
      .from('tasks').update({ memo }).eq('id', taskId);
    if (error) { console.error(error); return; }
    setProjects(prev => prev.map(p =>
      p.id === projectId
        ? { ...p, tasks: p.tasks.map(t => t.id === taskId ? { ...t, memo } : t) }
        : p
    ));
  }, []);

  const toggleTask = useCallback((projectId, taskId) => {
    // 낙관적 업데이트 후 DB 반영
    setProjects(prev => {
      const proj = prev.find(p => p.id === projectId);
      const task = proj?.tasks.find(t => t.id === taskId);
      if (!task) return prev;
      const completed = !task.completed;
      supabase.from('tasks').update({ completed }).eq('id', taskId)
        .then(({ error }) => { if (error) console.error(error); });
      return prev.map(p =>
        p.id === projectId
          ? { ...p, tasks: p.tasks.map(t => t.id === taskId ? { ...t, completed } : t) }
          : p
      );
    });
  }, []);

  const deleteTask = useCallback(async (projectId, taskId) => {
    const { error } = await supabase
      .from('tasks').delete().eq('id', taskId);
    if (error) { console.error(error); return; }
    setProjects(prev => prev.map(p =>
      p.id === projectId ? { ...p, tasks: p.tasks.filter(t => t.id !== taskId) } : p
    ));
  }, []);

  // ── Images (localStorage 유지) ─────────────────────────────────────────────

  const addTaskImage = useCallback((projectId, taskId, image) => {
    setProjects(prev => prev.map(p =>
      p.id !== projectId ? p : {
        ...p, tasks: p.tasks.map(t => {
          if (t.id !== taskId) return t;
          const images = [...(t.images ?? []), image];
          saveImgs(taskId, images);
          return { ...t, images };
        }),
      }
    ));
  }, []);

  const removeTaskImage = useCallback((projectId, taskId, imageId) => {
    setProjects(prev => prev.map(p =>
      p.id !== projectId ? p : {
        ...p, tasks: p.tasks.map(t => {
          if (t.id !== taskId) return t;
          const images = (t.images ?? []).filter(img => img.id !== imageId);
          saveImgs(taskId, images);
          return { ...t, images };
        }),
      }
    ));
  }, []);

  return {
    projects,
    addProject, updateProject, deleteProject,
    addTask, updateTask, updateTaskMemo, toggleTask, deleteTask,
    addTaskImage, removeTaskImage,
  };
}
