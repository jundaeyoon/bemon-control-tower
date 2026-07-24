import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const VOTER = 'me';

export function useIdeaBank() {
  const [ideas, setIdeas] = useState([]);

  useEffect(() => {
    supabase
      .from('brainstorm_ideas')
      .select('*')
      .is('session_id', null)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) { console.error('[useIdeaBank] fetch:', error); return; }
        setIdeas(data ?? []);
      });
  }, []);

  const addIdea = useCallback(async (title, content, author) => {
    const payload = {
      session_id: null,
      title: title || '',
      content: content || '',
      author: author || null,
      votes: 0,
      voters: [],
      downvotes: 0,
      downvoters: [],
    };
    const { data, error } = await supabase
      .from('brainstorm_ideas')
      .insert(payload)
      .select()
      .single();
    if (error) { console.error('[useIdeaBank] add:', error); return; }
    setIdeas(prev => [data, ...prev]);
  }, []);

  const updateIdea = useCallback(async (ideaId, fields) => {
    const dbUpdates = {};
    if ('title'   in fields) dbUpdates.title   = fields.title;
    if ('content' in fields) dbUpdates.content = fields.content;
    if ('author'  in fields) dbUpdates.author  = fields.author || null;
    const { data, error } = await supabase
      .from('brainstorm_ideas')
      .update(dbUpdates)
      .eq('id', ideaId)
      .select()
      .single();
    if (error) { console.error('[useIdeaBank] update:', error); return; }
    setIdeas(prev => prev.map(i => i.id === ideaId ? data : i));
  }, []);

  const toggleUpvote = useCallback((ideaId) => {
    setIdeas(prev => {
      const idea = prev.find(i => i.id === ideaId);
      if (!idea) return prev;
      const hasVoted = (idea.voters ?? []).includes(VOTER);
      const voters = hasVoted
        ? idea.voters.filter(v => v !== VOTER)
        : [...(idea.voters ?? []), VOTER];
      const votes = voters.length;
      supabase.from('brainstorm_ideas').update({ votes, voters }).eq('id', ideaId)
        .then(({ error }) => { if (error) console.error('[toggleUpvote]', error); });
      return prev.map(i => i.id === ideaId ? { ...i, votes, voters } : i);
    });
  }, []);

  const toggleDownvote = useCallback((ideaId) => {
    setIdeas(prev => {
      const idea = prev.find(i => i.id === ideaId);
      if (!idea) return prev;
      const hasVoted = (idea.downvoters ?? []).includes(VOTER);
      const downvoters = hasVoted
        ? idea.downvoters.filter(v => v !== VOTER)
        : [...(idea.downvoters ?? []), VOTER];
      const downvotes = downvoters.length;
      supabase.from('brainstorm_ideas').update({ downvotes, downvoters }).eq('id', ideaId)
        .then(({ error }) => { if (error) console.error('[toggleDownvote]', error); });
      return prev.map(i => i.id === ideaId ? { ...i, downvotes, downvoters } : i);
    });
  }, []);

  const deleteIdea = useCallback(async (ideaId) => {
    const { error } = await supabase.from('brainstorm_ideas').delete().eq('id', ideaId);
    if (error) { console.error('[useIdeaBank] delete:', error); return; }
    setIdeas(prev => prev.filter(i => i.id !== ideaId));
  }, []);

  const toggleComplete = useCallback((ideaId) => {
    setIdeas(prev => {
      const idea = prev.find(i => i.id === ideaId);
      if (!idea) return prev;
      const completed = !idea.completed;
      supabase.from('brainstorm_ideas').update({ completed }).eq('id', ideaId)
        .then(({ error }) => { if (error) console.error('[toggleComplete]', error); });
      return prev.map(i => i.id === ideaId ? { ...i, completed } : i);
    });
  }, []);

  return { ideas, addIdea, updateIdea, toggleUpvote, toggleDownvote, deleteIdea, toggleComplete };
}
