import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { getKSTToday } from '../lib/date';
import type { Members } from '../types';

interface MemberCommentRow {
  github_username: string;
  problem_id: string;
}

/**
 * 모든 팀원의 오늘(KST) 댓글 수를 한번에 조회.
 * 자기 문제 제외: problem_id가 해당 멤버의 id/로 시작하는 건 카운트하지 않음.
 * 반환: memberId → commentCount
 */
export function useAllMembersProgress(members: Members) {
  const [progressMap, setProgressMap] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);

  // github username → memberId 역매핑
  const githubToMemberId = useCallback(() => {
    const map = new Map<string, string>();
    for (const [id, member] of Object.entries(members)) {
      map.set(member.github.toLowerCase(), id);
    }
    return map;
  }, [members]);

  const loadProgress = useCallback(async () => {
    if (Object.keys(members).length === 0) {
      setLoading(false);
      return;
    }

    try {
      const today = getKSTToday();
      const startOfDayKST = `${today}T00:00:00+09:00`;
      const endDate = new Date(new Date(startOfDayKST).getTime() + 24 * 60 * 60 * 1000);
      const endOfDayUTC = endDate.toISOString();

      const { data, error } = await supabase
        .from('comments')
        .select('github_username, problem_id')
        .gte('created_at', startOfDayKST)
        .lt('created_at', endOfDayUTC);

      if (error) throw error;

      const rows = (data || []) as MemberCommentRow[];
      const g2m = githubToMemberId();
      const counts = new Map<string, number>();

      // 모든 멤버를 0으로 초기화
      for (const id of Object.keys(members)) {
        counts.set(id, 0);
      }

      for (const row of rows) {
        const mId = g2m.get(row.github_username.toLowerCase());
        if (!mId) continue;

        // 자기 문제 제외
        if (row.problem_id.startsWith(`${mId}/`)) continue;

        counts.set(mId, (counts.get(mId) || 0) + 1);
      }

      setProgressMap(counts);
    } catch (error) {
      console.error('Failed to load all members progress:', error);
    } finally {
      setLoading(false);
    }
  }, [members, githubToMemberId]);

  useEffect(() => {
    loadProgress();

    const subscription = supabase
      .channel('all_members_progress')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
        },
        () => loadProgress()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [loadProgress]);

  return { progressMap, loading };
}
