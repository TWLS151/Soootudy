import { useState, useEffect, useCallback } from 'react';
import type { Members, Problem, Activities } from '../types';
import { fetchRepoTree, fetchMembers, parseProblemsFromTree, extractWeeks, fetchCommitActivity } from '../services/github';

interface UseGitHubResult {
  members: Members;
  problems: Problem[];
  weeks: string[];
  activities: Activities;
  loading: boolean;
  error: string | null;
  addProblem: (problem: Problem) => void;
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

        // 커밋 활동 데이터 (비동기, 실패해도 메인 로드에 영향 없음)
        fetchCommitActivity(membersData).then((act) => {
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
  }, []);

  return { members, problems, weeks, activities, loading, error, addProblem };
}
