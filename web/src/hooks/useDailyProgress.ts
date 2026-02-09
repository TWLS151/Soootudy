import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { getKSTToday } from '../lib/date';

export function useDailyProgress(githubUsername: string | null, memberId: string | null) {
  const [commentCount, setCommentCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadCommentCount = useCallback(async () => {
    if (!githubUsername || !memberId) {
      setLoading(false);
      return;
    }

    try {
      const today = getKSTToday();
      // KST 경계: today 00:00 KST ~ tomorrow 00:00 KST
      const startOfDayKST = `${today}T00:00:00+09:00`;
      const todayDate = new Date(startOfDayKST);
      const tomorrow = new Date(todayDate.getTime() + 24 * 60 * 60 * 1000);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      const endOfDayKST = `${tomorrowStr}T00:00:00+09:00`;

      const { count, error } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('github_username', githubUsername)
        .gte('created_at', startOfDayKST)
        .lt('created_at', endOfDayKST)
        .not('problem_id', 'like', `${memberId}/%`);

      if (error) throw error;
      setCommentCount(count || 0);
    } catch (error) {
      console.error('Failed to load comment count:', error);
    } finally {
      setLoading(false);
    }
  }, [githubUsername, memberId]);

  useEffect(() => {
    loadCommentCount();

    const subscription = supabase
      .channel('daily_progress_comments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
        },
        () => loadCommentCount()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [loadCommentCount]);

  return { commentCount, loading };
}
