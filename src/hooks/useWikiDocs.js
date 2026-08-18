import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useWikiDocs() {
  const [docs, setDocs] = useState([]);

  useEffect(() => {
    supabase
      .from('wiki_docs')
      .select('*')
      .order('updated_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) { console.error('[useWikiDocs] fetch:', error); return; }
        setDocs(data ?? []);
      });
  }, []);

  const addDoc = useCallback(async ({ title, category, content, author = null }) => {
    const payload = {
      title:    title.trim(),
      category: category.trim(),
      content:  content.trim(),
      author:   author || null,
    };
    const { data, error } = await supabase
      .from('wiki_docs')
      .insert(payload)
      .select()
      .single();
    if (error) { console.error('[useWikiDocs] add:', error); return null; }
    setDocs(prev => [data, ...prev]);
    return data;
  }, []);

  const updateDoc = useCallback(async (docId, { title, category, content, editedBy = null }) => {
    const payload = {
      title:           title.trim(),
      category:        category.trim(),
      content:         content.trim(),
      last_edited_by:  editedBy || null,
      updated_at:      new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from('wiki_docs')
      .update(payload)
      .eq('id', docId)
      .select()
      .single();
    if (error) { console.error('[useWikiDocs] update:', error); return null; }
    setDocs(prev =>
      prev.map(d => (d.id === docId ? data : d))
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    );
    return data;
  }, []);

  return { docs, addDoc, updateDoc };
}
