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
      // Supabase 연결 확인
      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
      console.log('[Supabase] URL:', url);
      console.log('[Supabase] ANON_KEY 앞 20자:', key?.slice(0, 20));
      if (!url || !key) {
        alert('❌ .env 오류: VITE_SUPABASE_URL 또는 VITE_SUPABASE_ANON_KEY가 없습니다.');
        return;
      }

      console.log('[fetchAll] 시작');
      const [{ data: projs, error: pErr }, { data: tasks, error: tErr }] = await Promise.all([
        supabase.from('projects').select('*').order('created_at', { ascending: true }),
        supabase.from('tasks').select('*').order('created_at', { ascending: true }),
      ]);

      if (pErr) {
        console.error('[fetchAll] projects 에러:', pErr);
        alert(`❌ projects 테이블 오류\n코드: ${pErr.code}\n메시지: ${pErr.message}`);
        return;
      }
      if (tErr) {
        console.error('[fetchAll] tasks 에러:', tErr);
        alert(`❌ tasks 테이블 오류\n코드: ${tErr.code}\n메시지: ${tErr.message}`);
        return;
      }

      console.log('[fetchAll] 완료 — projects:', projs?.length, '/ tasks:', tasks?.length);
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
    console.log('[addProject] 삽입 시도:', { name, pm });
    const { data, error } = await supabase
      .from('projects').insert({ name, pm }).select().single();
    if (error) {
      console.error('[addProject] 에러:', error);
      alert(`❌ 프로젝트 추가 실패\n코드: ${error.code}\n메시지: ${error.message}\n힌트: ${error.hint ?? '-'}`);
      return null;
    }
    console.log('[addProject] 성공:', data);
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
    // DB 컬럼: name, assignee, deadline, progress (due_date 아님)
    const { name, assignee, deadline, progress } = fields;
    const payload = { project_id: projectId, name, assignee, deadline: deadline || null, progress, completed: false, memo: '' };
    console.log('[addTask] 삽입 시도 (deadline 컬럼):', payload);

    const { data, error } = await supabase
      .from('tasks')
      .insert(payload)
      .select().single();

    if (error) {
      console.error('[addTask] 에러:', error);
      alert(`❌ 작업 추가 실패\n코드: ${error.code}\n메시지: ${error.message}\n힌트: ${error.hint ?? '-'}`);
      return null;
    }

    console.log('[addTask] 성공:', data);
    const task = attachImages(data);
    setProjects(prev => prev.map(p =>
      p.id === projectId ? { ...p, tasks: [...p.tasks, task] } : p
    ));
    return data.id;
  }, []);

  const updateTask = useCallback(async (projectId, taskId, updates) => {
    // images는 localStorage 전용, DB 컬럼은 deadline (due_date 아님)
    // eslint-disable-next-line no-unused-vars
    const { images: _imgs, ...dbUpdates } = updates;
    console.log('[updateTask] 업데이트 시도 (deadline 컬럼):', dbUpdates);
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
