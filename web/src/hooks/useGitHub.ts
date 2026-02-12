import { useState, useEffect, useCallback } from 'react';
import type { Members, Problem, Activities } from '../types';
import { fetchRepoTree, fetchMembers, parseProblemsFromTree, extractWeeks } from '../services/github';
import { fetchSubmissionActivity, calculateStreak } from '../services/activity';
import { getKSTToday } from '../lib/date';

interface UseGitHubResult {
  members: Members;
  problems: Problem[];
  weeks: string[];
  activities: Activities;
  loading: boolean;
  error: string | null;
  addProblem: (problem: Problem) => void;
  removeProblem: (problemId: string) => void;
}

export function useGitHub(): UseGitHubResult {
  const [members, setMembers] = useState<Members>({});
  const [problems, setProblems] = useState<Problem[]>([]);
  const [weeks, setWeeks] = useState<string[]>([]);
  const [activities, setActivities] = useState<Activities>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [tree, membersData] = await Promise.all([fetchRepoTree(), fetchMembers()]);
        if (cancelled) return;
        const parsed = parseProblemsFromTree(tree, membersData);
        setMembers(membersData);
        setProblems(parsed);
        setWeeks(extractWeeks(parsed));

        // Supabase에서 제출 기록 조회 (비동기, 실패해도 메인 로드에 영향 없음)
        fetchSubmissionActivity(membersData).then((act) => {
          if (!cancelled) setActivities(act);
        });
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load data');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const addProblem = useCallback((problem: Problem) => {
    setProblems((prev) => {
      const updated = [problem, ...prev];
      updated.sort((a, b) => {
        const weekCmp = b.week.localeCompare(a.week);
        if (weekCmp !== 0) return weekCmp;
        return a.name.localeCompare(b.name);
      });
      return updated;
    });
    setWeeks((prev) => {
      if (prev.includes(problem.week)) return prev;
      return [problem.week, ...prev].sort((a, b) => b.localeCompare(a));
    });

    // 제출 후 낙관적 업데이트: 오늘 날짜를 멤버의 활동에 추가
    const memberId = problem.member;
    if (memberId === '_ref') return;
    const today = getKSTToday();
    setActivities((prev) => {
      const existing = prev[memberId] || { dates: [], streak: 0 };
      if (existing.dates.includes(today)) return prev;
      const newDates = [...existing.dates, today].sort();
      return {
        ...prev,
        [memberId]: {
          dates: newDates,
          streak: calculateStreak(newDates),
        },
      };
    });
  }, []);

  const removeProblem = useCallback((problemId: string) => {
    setProblems((prev) => prev.filter((p) => p.id !== problemId));
  }, []);

  return { members, problems, weeks, activities, loading, error, addProblem, removeProblem };
}
