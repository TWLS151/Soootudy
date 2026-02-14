import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { CodeBookmark } from '../types';

export function useCodeBookmarks(userId: string | null) {
  const [bookmarks, setBookmarks] = useState<CodeBookmark[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBookmarks = useCallback(async () => {
    if (!userId) {
      setBookmarks([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('code_bookmarks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookmarks(data || []);
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
      setBookmarks([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadBookmarks();

    if (!userId) return;

    // Real-time subscription
    const subscription = supabase
      .channel(`bookmarks:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'code_bookmarks',
          filter: `user_id=eq.${userId}`,
        },
        () => loadBookmarks()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId, loadBookmarks]);

  const isBookmarked = useCallback(
    (problemId: string): boolean => {
      return bookmarks.some((b) => b.problem_id === problemId);
    },
    [bookmarks]
  );

  const getBookmark = useCallback(
    (problemId: string): CodeBookmark | undefined => {
      return bookmarks.find((b) => b.problem_id === problemId);
    },
    [bookmarks]
  );

  const toggleBookmark = useCallback(
    async (problemId: string): Promise<boolean> => {
      if (!userId) return false;

      const existing = bookmarks.find((b) => b.problem_id === problemId);

      // Optimistic update - 즉시 UI 업데이트
      if (existing) {
        // Remove from local state immediately
        setBookmarks((prev) => prev.filter((b) => b.id !== existing.id));
      } else {
        // Add to local state immediately
        const optimisticBookmark: CodeBookmark = {
          id: `temp-${Date.now()}`,
          user_id: userId,
          problem_id: problemId,
          memo: null,
          created_at: new Date().toISOString(),
        };
        setBookmarks((prev) => [optimisticBookmark, ...prev]);
      }

      try {
        if (existing) {
          // Remove bookmark
          const { error } = await supabase
            .from('code_bookmarks')
            .delete()
            .eq('id', existing.id);

          if (error) throw error;
          return false; // Removed
        } else {
          // Add bookmark
          const { data: inserted, error } = await supabase
            .from('code_bookmarks')
            .insert({
              user_id: userId,
              problem_id: problemId,
              memo: null,
            })
            .select()
            .single();

          if (error) throw error;

          // temp ID를 실제 UUID로 교체
          if (inserted) {
            setBookmarks((prev) =>
              prev.map((b) =>
                b.problem_id === problemId && b.id.startsWith('temp-') ? inserted : b
              )
            );
          }
          return true; // Added
        }
      } catch (error) {
        console.error('Failed to toggle bookmark:', error);
        // Revert optimistic update on error
        await loadBookmarks();
        return isBookmarked(problemId); // Return current state on error
      }
    },
    [userId, bookmarks, isBookmarked, loadBookmarks]
  );

  const updateMemo = useCallback(
    async (problemId: string, memo: string): Promise<void> => {
      if (!userId) return;

      const existing = bookmarks.find((b) => b.problem_id === problemId);
      if (!existing) return;

      try {
        const { error } = await supabase
          .from('code_bookmarks')
          .update({ memo: memo.trim() || null })
          .eq('id', existing.id);

        if (error) throw error;
      } catch (error) {
        console.error('Failed to update memo:', error);
      }
    },
    [userId, bookmarks]
  );

  return {
    bookmarks,
    loading,
    isBookmarked,
    getBookmark,
    toggleBookmark,
    updateMemo,
  };
}

// Hook to get bookmark count for a specific problem (for all users)
export function useBookmarkCount(problemId: string | null) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!problemId) {
      setCount(0);
      setLoading(false);
      return;
    }

    const loadCount = async () => {
      try {
        const { count: resultCount, error } = await supabase
          .from('code_bookmarks')
          .select('*', { count: 'exact', head: true })
          .eq('problem_id', problemId);

        if (error) throw error;
        setCount(resultCount || 0);
      } catch (error) {
        console.error('Failed to load bookmark count:', error);
        setCount(0);
      } finally {
        setLoading(false);
      }
    };

    loadCount();

    // Real-time subscription for count updates
    const subscription = supabase
      .channel(`bookmark-count:${problemId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'code_bookmarks',
          filter: `problem_id=eq.${problemId}`,
        },
        () => loadCount()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [problemId]);

  return { count, loading };
}
