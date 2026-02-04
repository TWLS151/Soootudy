import { useState, useEffect } from 'react';
import type { Members, Problem } from '../types';
import { fetchRepoTree, fetchMembers, parseProblemsFromTree, extractWeeks } from '../services/github';

interface UseGitHubResult {
  members: Members;
  problems: Problem[];
  weeks: string[];
  loading: boolean;
  error: string | null;
}

export function useGitHub(): UseGitHubResult {
  const [members, setMembers] = useState<Members>({});
  const [problems, setProblems] = useState<Problem[]>([]);
  const [weeks, setWeeks] = useState<string[]>([]);
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

  return { members, problems, weeks, loading, error };
}
