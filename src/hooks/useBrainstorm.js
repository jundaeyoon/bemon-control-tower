import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useBrainstorm() {
  const [sessions,   setSessions]   = useState([]);
  const [todos,      setTodos]      = useState([]);
  const [feedbacks,  setFeedbacks]  = useState([]);
  const [ideas,      setIdeas]      = useState([]);
  const [recordings, setRecordings] = useState([]);

  useEffect(() => {
    async function fetchAll() {
      console.log('[useBrainstorm] fetchAll 시작');
      const [s, t, f, i, r] = await Promise.all([
        supabase.from('brainstorm_sessions').select('*').order('date', { ascending: false }),
        supabase.from('brainstorm_todos').select('*'),
        supabase.from('brainstorm_feedbacks').select('*'),
        supabase.from('brainstorm_ideas').select('*'),
        supabase.from('brainstorm_recordings').select('*'),
      ]);

      for (const [name, res] of Object.entries({ sessions: s, todos: t, feedbacks: f, ideas: i, recordings: r })) {
        if (res.error) {
          console.error(`[useBrainstorm] ${name} 에러:`, res.error);
          alert(`❌ ${name} 테이블 오류\n코드: ${res.error.code}\n메시지: ${res.error.message}`);
        }
      }

      console.log('[useBrainstorm] fetchAll 완료 — sessions:', s.data?.length);
      setSessions(s.data ?? []);
      setTodos(t.data ?? []);
      setFeedbacks(f.data ?? []);
      setIdeas(i.data ?? []);
      setRecordings(r.data ?? []);
    }
    fetchAll();
  }, []);

  // ── Sessions ──────────────────────────────────────────────────────────────

  const addSession = useCallback(async (title, date) => {
    const payload = { title, date: date || new Date().toISOString().slice(0, 10) };
    console.log('[addSession] 삽입 시도:', payload);
    const { data, error } = await supabase.from('brainstorm_sessions').insert(payload).select().single();
    if (error) {
      console.error('[addSession] 에러:', error);
      alert(`❌ 세션 추가 실패\n코드: ${error.code}\n메시지: ${error.message}\n힌트: ${error.hint ?? '-'}`);
      return null;
    }
    console.log('[addSession] 성공:', data);
    setSessions(prev => [data, ...prev]);
    return data.id;
  }, []);

  const deleteSession = useCallback(async (sessionId) => {
    const { error } = await supabase.from('brainstorm_sessions').delete().eq('id', sessionId);
    if (error) { console.error('[deleteSession] 에러:', error); return; }
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    setTodos(prev => prev.filter(x => x.session_id !== sessionId));
    setFeedbacks(prev => prev.filter(x => x.session_id !== sessionId));
    setIdeas(prev => prev.filter(x => x.session_id !== sessionId));
    setRecordings(prev => prev.filter(x => x.session_id !== sessionId));
  }, []);

  // ── Todos ─────────────────────────────────────────────────────────────────

  const addTodo = useCallback(async (sessionId, content, assignee) => {
    const payload = { session_id: sessionId, content, assignee: assignee || null, status: 'todo' };
    const { data, error } = await supabase.from('brainstorm_todos').insert(payload).select().single();
    if (error) {
      console.error('[addTodo] 에러:', error);
      alert(`❌ 할일 추가 실패\n코드: ${error.code}\n메시지: ${error.message}`);
      return;
    }
    setTodos(prev => [...prev, data]);
  }, []);

  const updateTodo = useCallback(async (todoId, fields) => {
    const dbUpdates = {};
    if ('content'  in fields) dbUpdates.content  = fields.content;
    if ('assignee' in fields) dbUpdates.assignee = fields.assignee || null;
    if ('status'   in fields) dbUpdates.status   = fields.status;
    if ('memo'     in fields) dbUpdates.memo     = fields.memo;

    console.log('[updateTodo] 업데이트 시도:', dbUpdates);
    const { data, error } = await supabase.from('brainstorm_todos').update(dbUpdates).eq('id', todoId).select().single();
    if (error) {
      console.error('[updateTodo] 에러:', error);
      alert(`❌ 할일 수정 실패\n코드: ${error.code}\n메시지: ${error.message}`);
      return;
    }
    setTodos(prev => prev.map(t => t.id === todoId ? data : t));
  }, []);

  const deleteTodo = useCallback(async (todoId) => {
    const { error } = await supabase.from('brainstorm_todos').delete().eq('id', todoId);
    if (error) { console.error('[deleteTodo] 에러:', error); return; }
    setTodos(prev => prev.filter(t => t.id !== todoId));
  }, []);

  // ── Feedbacks ─────────────────────────────────────────────────────────────

  // todo별 피드백 행이 없으면 새로 만들고, 있으면 업데이트 (upsert)
  const upsertFeedbackForTodo = useCallback(async (sessionId, todo, existing, fields) => {
    if (existing) {
      const { data, error } = await supabase.from('brainstorm_feedbacks').update(fields).eq('id', existing.id).select().single();
      if (error) {
        console.error('[upsertFeedbackForTodo] 업데이트 에러:', error);
        alert(`❌ 피드백 수정 실패\n코드: ${error.code}\n메시지: ${error.message}`);
        return;
      }
      setFeedbacks(prev => prev.map(f => f.id === existing.id ? data : f));
      return;
    }
    const payload = {
      session_id: sessionId,
      todo_id:    todo.id,
      content:    fields.content ?? '',
      assignee:   todo.assignee ?? null,
      status:     fields.status ?? 'not_done',
    };
    console.log('[upsertFeedbackForTodo] 삽입 시도:', payload);
    const { data, error } = await supabase.from('brainstorm_feedbacks').insert(payload).select().single();
    if (error) {
      console.error('[upsertFeedbackForTodo] 삽입 에러:', error);
      alert(`❌ 피드백 추가 실패\n코드: ${error.code}\n메시지: ${error.message}\n힌트: ${error.hint ?? '-'}`);
      return;
    }
    setFeedbacks(prev => [...prev, data]);
  }, []);

  const deleteFeedback = useCallback(async (feedbackId) => {
    const { error } = await supabase.from('brainstorm_feedbacks').delete().eq('id', feedbackId);
    if (error) { console.error('[deleteFeedback] 에러:', error); return; }
    setFeedbacks(prev => prev.filter(f => f.id !== feedbackId));
  }, []);

  // ── Ideas ─────────────────────────────────────────────────────────────────

  const addIdea = useCallback(async (sessionId, content, author) => {
    const payload = { session_id: sessionId, content, author: author || null, votes: 0, voters: [] };
    const { data, error } = await supabase.from('brainstorm_ideas').insert(payload).select().single();
    if (error) {
      console.error('[addIdea] 에러:', error);
      alert(`❌ 아이디어 추가 실패\n코드: ${error.code}\n메시지: ${error.message}`);
      return;
    }
    setIdeas(prev => [...prev, data]);
  }, []);

  const toggleVoteIdea = useCallback(async (ideaId, voterName) => {
    setIdeas(prev => {
      const idea = prev.find(i => i.id === ideaId);
      if (!idea) return prev;
      const hasVoted = (idea.voters ?? []).includes(voterName);
      const voters = hasVoted ? idea.voters.filter(v => v !== voterName) : [...(idea.voters ?? []), voterName];
      const votes = voters.length;
      supabase.from('brainstorm_ideas').update({ votes, voters }).eq('id', ideaId)
        .then(({ error }) => { if (error) console.error('[toggleVoteIdea] 에러:', error); });
      return prev.map(i => i.id === ideaId ? { ...i, votes, voters } : i);
    });
  }, []);

  const deleteIdea = useCallback(async (ideaId) => {
    const { error } = await supabase.from('brainstorm_ideas').delete().eq('id', ideaId);
    if (error) { console.error('[deleteIdea] 에러:', error); return; }
    setIdeas(prev => prev.filter(i => i.id !== ideaId));
  }, []);

  // ── Recordings ────────────────────────────────────────────────────────────

  const addRecording = useCallback(async (sessionId, { fileName, fileUrl, summary }) => {
    const payload = { session_id: sessionId, file_name: fileName ?? null, file_url: fileUrl ?? null, summary: summary ?? null };
    console.log('[addRecording] 삽입 시도:', payload);
    const { data, error } = await supabase.from('brainstorm_recordings').insert(payload).select().single();
    if (error) {
      console.error('[addRecording] 에러:', error);
      alert(`❌ 회의록 저장 실패\n코드: ${error.code}\n메시지: ${error.message}`);
      return null;
    }
    setRecordings(prev => [data, ...prev]);
    return data.id;
  }, []);

  const updateRecordingSummary = useCallback(async (recordingId, summary) => {
    const { data, error } = await supabase.from('brainstorm_recordings').update({ summary }).eq('id', recordingId).select().single();
    if (error) { console.error('[updateRecordingSummary] 에러:', error); return; }
    setRecordings(prev => prev.map(r => r.id === recordingId ? data : r));
  }, []);

  const uploadRecordingFile = useCallback(async (file) => {
    const path = `${Date.now()}-${file.name}`;
    console.log('[uploadRecordingFile] 업로드 시도:', path);
    const { error: upErr } = await supabase.storage.from('brainstorm-recordings').upload(path, file);
    if (upErr) {
      console.error('[uploadRecordingFile] 에러:', upErr);
      alert(`❌ 파일 업로드 실패\n메시지: ${upErr.message}`);
      return null;
    }
    const { data } = supabase.storage.from('brainstorm-recordings').getPublicUrl(path);
    return data.publicUrl;
  }, []);

  return {
    sessions, todos, feedbacks, ideas, recordings,
    addSession, deleteSession,
    addTodo, updateTodo, deleteTodo,
    upsertFeedbackForTodo, deleteFeedback,
    addIdea, toggleVoteIdea, deleteIdea,
    addRecording, updateRecordingSummary, uploadRecordingFile,
  };
}
