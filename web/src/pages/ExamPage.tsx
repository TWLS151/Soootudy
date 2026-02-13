// --- 시험 대비 페이지 (임시 기능, 시험 후 제거 예정) ---
import { useState, useEffect, useMemo } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { ExternalLink, Upload, BookOpen, Sparkles, Lock, Code2 } from 'lucide-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import SourceBadge from '../components/SourceBadge';
import { getProblemUrl } from '../services/github';
import { hasUserSolvedBaseName } from '../lib/reference';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import type { Members, Problem, DailyProblem } from '../types';

interface Context {
  members: Members;
  problems: Problem[];
  user: User;
  dark: boolean;
}

export default function ExamPage() {
  const { members, problems, user } = useOutletContext<Context>();
  const [examProblems, setExamProblems] = useState<DailyProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSolver, setExpandedSolver] = useState<string | null>(null);

  const githubUsername = user?.user_metadata?.user_name || user?.user_metadata?.preferred_username;
  const currentMemberId = useMemo(() => {
    if (!githubUsername) return null;
    for (const [id, member] of Object.entries(members)) {
      if (member.github.toLowerCase() === githubUsername.toLowerCase()) return id;
    }
    return null;
  }, [members, githubUsername]);

  useEffect(() => {
    loadExamProblems();
  }, []);

  // 제출자 버전 토글 바깥 클릭 닫기
  useEffect(() => {
    if (!expandedSolver) return;
    const handleClick = () => setExpandedSolver(null);
    const timer = setTimeout(() => document.addEventListener('click', handleClick), 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClick);
    };
  }, [expandedSolver]);

  async function loadExamProblems() {
    try {
      const { data, error } = await supabase
        .from('daily_problem')
        .select('*')
        .is('date', null)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setExamProblems(data || []);
    } catch (error) {
      console.error('Failed to load exam problems:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">시험 대비</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">기한 없이 자유롭게 풀어보세요.</p>
        </div>
      </div>

      {/* 문제 목록 */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-24 h-24">
            <DotLottieReact src="/cat.lottie" loop autoplay />
          </div>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-2 animate-pulse">불러오는 중...</p>
        </div>
      ) : examProblems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-24 h-24">
            <DotLottieReact src="/cat.lottie" loop autoplay />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            등록된 시험 대비 문제가 없습니다.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {examProblems.map((problem) => {
            const problemUrl = problem.problem_url || getProblemUrl(problem.problem_number, problem.source);
            const problemNumber = problem.source === 'etc' ? problem.problem_number.replace(/ /g, '_') : problem.problem_number;
            const problemName = `${problem.source}-${problemNumber}`;
            const solvers = problems.filter((p) => (p.baseName || p.name) === problemName && p.member !== '_ref');
            const refSolution = problems.find((p) => (p.baseName || p.name) === problemName && p.member === '_ref');
            const userSolved = hasUserSolvedBaseName(problemName, problems, currentMemberId);

            // 멤버별 그룹화
            const grouped = new Map<string, typeof solvers>();
            for (const sol of solvers) {
              const existing = grouped.get(sol.member);
              if (existing) existing.push(sol);
              else grouped.set(sol.member, [sol]);
            }

            return (
              <div
                key={problem.id}
                className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <SourceBadge source={problem.source} />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {problem.problem_title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {problem.source.toUpperCase()} {problem.problem_number}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {problemUrl && (
                      <a
                        href={problemUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors"
                      >
                        문제 보기
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <Link
                      to={`/submit?source=${problem.source}&number=${problem.problem_number}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      제출
                    </Link>
                  </div>
                </div>

                {/* 제출한 팀원 + 참고 솔루션 */}
                {(solvers.length > 0 || refSolution) && (
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                    {solvers.length > 0 && <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">제출:</span>}
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {Array.from(grouped.entries()).map(([memberId, submissions]) => {
                        const solMember = members[memberId];
                        if (!solMember) return null;
                        const hasMultiple = submissions.length > 1;
                        const key = `${problem.id}-${memberId}`;
                        const isExpanded = expandedSolver === key;
                        const latest = submissions[submissions.length - 1];

                        if (!hasMultiple) {
                          return (
                            <Link
                              key={memberId}
                              to={`/problem/${latest.member}/${latest.week}/${latest.name}`}
                              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-50 dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                            >
                              <img
                                src={`https://github.com/${solMember.github}.png?size=20`}
                                alt={solMember.name}
                                className="w-4 h-4 rounded-full"
                              />
                              <span className="text-xs text-slate-700 dark:text-slate-300">{solMember.name}</span>
                            </Link>
                          );
                        }

                        return (
                          <div key={memberId} className="relative">
                            <button
                              onClick={() => setExpandedSolver(isExpanded ? null : key)}
                              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors ${
                                isExpanded
                                  ? 'bg-indigo-100 dark:bg-indigo-900/40 ring-1 ring-indigo-300 dark:ring-indigo-700'
                                  : 'bg-slate-50 dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'
                              }`}
                            >
                              <img
                                src={`https://github.com/${solMember.github}.png?size=20`}
                                alt={solMember.name}
                                className="w-4 h-4 rounded-full"
                              />
                              <span className="text-xs text-slate-700 dark:text-slate-300">{solMember.name}</span>
                              <span className="text-[10px] font-medium text-indigo-500 dark:text-indigo-400">
                                v{submissions.length}
                              </span>
                            </button>
                            {isExpanded && (
                              <div className="absolute left-0 top-full mt-1 z-10 min-w-[120px] rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg py-1">
                                {submissions.map((sol) => (
                                  <Link
                                    key={sol.id}
                                    to={`/problem/${sol.member}/${sol.week}/${sol.name}`}
                                    className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                                    onClick={() => setExpandedSolver(null)}
                                  >
                                    <Code2 className="w-3 h-3 text-slate-400" />
                                    v{sol.version || 1}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {refSolution && (
                        userSolved ? (
                          <Link
                            to={`/problem/_ref/${refSolution.week}/${refSolution.name}`}
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
                            <span className="text-xs font-medium text-purple-700 dark:text-purple-300">참고 솔루션</span>
                          </Link>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-700 cursor-not-allowed opacity-60">
                            <Lock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                            <span className="text-xs text-slate-400 dark:text-slate-500">참고 솔루션</span>
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
