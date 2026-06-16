import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'bemon-ct-projects';

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'); }
  catch { return []; }
}

export function useProjects() {
  const [projects, setProjects] = useState(load);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }, [projects]);

  const addProject = useCallback((name, pm = null) => {
    const id = `proj-${Date.now()}`;
    setProjects(prev => [...prev, { id, name, pm, tasks: [] }]);
    return id;
  }, []);

  const updateProject = useCallback((projectId, updates) => {
    setProjects(prev => prev.map(p =>
      p.id === projectId ? { ...p, ...updates } : p
    ));
  }, []);

  const addTask = useCallback((projectId, fields) => {
    const task = { id: `task-${Date.now()}`, ...fields, completed: false, images: [], memo: '' };
    setProjects(prev => prev.map(p =>
      p.id === projectId ? { ...p, tasks: [...p.tasks, task] } : p
    ));
    return task.id;
  }, []);

  const addTaskImage = useCallback((projectId, taskId, image) => {
    setProjects(prev => prev.map(p =>
      p.id === projectId
        ? { ...p, tasks: p.tasks.map(t =>
            t.id === taskId
              ? { ...t, images: [...(t.images ?? []), image] }
              : t
          )}
        : p
    ));
  }, []);

  const removeTaskImage = useCallback((projectId, taskId, imageId) => {
    setProjects(prev => prev.map(p =>
      p.id === projectId
        ? { ...p, tasks: p.tasks.map(t =>
            t.id === taskId
              ? { ...t, images: (t.images ?? []).filter(img => img.id !== imageId) }
              : t
          )}
        : p
    ));
  }, []);

  const updateTaskMemo = useCallback((projectId, taskId, memo) => {
    setProjects(prev => prev.map(p =>
      p.id === projectId
        ? { ...p, tasks: p.tasks.map(t => t.id === taskId ? { ...t, memo } : t) }
        : p
    ));
  }, []);

  const updateTask = useCallback((projectId, taskId, updates) => {
    setProjects(prev => prev.map(p =>
      p.id === projectId
        ? { ...p, tasks: p.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t) }
        : p
    ));
  }, []);

  const toggleTask = useCallback((projectId, taskId) => {
    setProjects(prev => prev.map(p =>
      p.id === projectId
        ? { ...p, tasks: p.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t) }
        : p
    ));
  }, []);

  const deleteProject = useCallback((projectId) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
  }, []);

  const deleteTask = useCallback((projectId, taskId) => {
    setProjects(prev => prev.map(p =>
      p.id === projectId ? { ...p, tasks: p.tasks.filter(t => t.id !== taskId) } : p
    ));
  }, []);

  return { projects, addProject, updateProject, addTask, updateTask, updateTaskMemo, toggleTask, deleteProject, deleteTask, addTaskImage, removeTaskImage };
}
