import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

function getUserId() {
  let id = localStorage.getItem('bemon-uid');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('bemon-uid', id);
  }
  return id;
}

export function useThankYou() {
  const [thanks, setThanks] = useState([]);

  useEffect(() => {
    supabase
      .from('thanks')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) { console.error('[useThankYou] fetch:', error); return; }
        setThanks(data ?? []);
      });
  }, []);

  const addThank = useCallback(async (to_member, message) => {
    const { data, error } = await supabase
      .from('thanks')
      .insert({ to_member, message })
      .select()
      .single();
    if (error) { console.error('[useThankYou] add:', error); return; }
    setThanks(prev => [data, ...prev]);
  }, []);

  const toggleHeart = useCallback((thankId) => {
    const uid = getUserId();
    setThanks(prev => {
      const thank = prev.find(t => t.id === thankId);
      if (!thank) return prev;
      const hearted   = (thank.hearts_by ?? []).includes(uid);
      const hearts_by = hearted
        ? thank.hearts_by.filter(x => x !== uid)
        : [...(thank.hearts_by ?? []), uid];
      const hearts = hearts_by.length;
      supabase.from('thanks').update({ hearts, hearts_by }).eq('id', thankId)
        .then(({ error }) => { if (error) console.error(error); });
      return prev.map(t => t.id === thankId ? { ...t, hearts, hearts_by } : t);
    });
  }, []);

  return { thanks, addThank, toggleHeart };
}
