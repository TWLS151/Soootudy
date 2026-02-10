import { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { History, ExternalLink, Upload } from 'lucide-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import SourceBadge from '../components/SourceBadge';
import { getProblemUrl } from '../services/github';
import { supabase } from '../lib/supabase';
import { getKSTToday } from '../lib/date';
import type { Members, Problem, DailyProblem } from '../types';

interface Context {
  members: Members;
  problems: Problem[];
}

interface GroupedProblems {
  date: string;
  label: string;
  problems: DailyProblem[];
}

export default function DailyHistoryPage() {
  const { members, problems } = useOutletContext<Context>();
  const [allProblems, setAllProblems] = useState<DailyProblem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllProblems();
  }, []);

  async function loadAllProblems() {
    try {
      const { data, error } = await supabase
        .from('daily_problem')
        .select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) throw error;
      setAllProblems(data || []);
    } catch (error) {
      console.error('Failed to load problems:', error);
    } finally {
      setLoading(false);
    }
  }

  // 날짜별로 그룹핑
  const groupedByDate: GroupedProblems[] = allProblems.reduce<GroupedProblems[]>((acc, problem) => {
    const existing = acc.find((g) => g.date === problem.date);
    if (existing) {
      existing.problems.push(problem);
    } else {
      const date = new Date(problem.date + 'T00:00:00');
      const label = date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short',
      });
      acc.push({ date: problem.date, label, problems: [problem] });
    }
    return acc;
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-24 h-24">
          <DotLottieReact src="/cat.lottie" loop autoplay />
        </div>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-2 animate-pulse">불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <History className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">오늘의 문제 기록</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            지금까지 등록된 모든 오늘의 문제 목록
          </p>
        </div>
      </div>

      {groupedByDate.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-28 h-28">
            <DotLottieReact src="/cat.lottie" loop autoplay />
          </div>
          <p className="text-slate-500 dark:text-slate-400 mt-2">등록된 문제가 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedByDate.map((group) => {
            const isToday = group.date === getKSTToday();

            return (
              <div
                key={group.date}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
              >
                <div className={`px-5 py-3 border-b border-slate-200 dark:border-slate-700 ${
                  isToday
                    ? 'bg-indigo-50 dark:bg-indigo-950/30'
                    : 'bg-slate-50 dark:bg-slate-800'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${
                      isToday
                        ? 'text-indigo-700 dark:text-indigo-300'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}>
                      {group.label}
                    </span>
                    {isToday && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-indigo-600 text-white rounded-full">
                        오늘
                      </span>
                    )}
                  </div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {group.problems.map((problem) => {
                    const problemUrl = problem.problem_url || getProblemUrl(problem.problem_number, problem.source);
                    const problemName = `${problem.source}-${problem.problem_number}`;
                    const solvers = problems.filter((p) => (p.baseName || p.name) === problemName);

                    return (
                      <div
                        key={problem.id}
                        className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <SourceBadge source={problem.source} />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                            {problem.problem_title}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {problem.source.toUpperCase()} {problem.problem_number}
                          </p>
                        </div>

                        {/* 제출자 */}
                        {solvers.length > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400 dark:text-slate-500">제출:</span>
                            <div className="flex -space-x-1.5">
                              {solvers.slice(0, 5).map((sol) => {
                                const solMember = members[sol.member];
                                if (!solMember) return null;
                                return (
                                  <Link
                                    key={sol.id}
                                    to={`/problem/${sol.member}/${sol.week}/${sol.name}`}
                                    className="relative"
                                    title={solMember.name}
                                  >
                                    <img
                                      src={`https://github.com/${solMember.github}.png?size=24`}
                                      alt={solMember.name}
                                      className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 hover:z-10 hover:ring-2 hover:ring-indigo-500 transition-all"
                                    />
                                  </Link>
                                );
                              })}
                              {solvers.length > 5 && (
                                <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-600 text-xs flex items-center justify-center text-slate-600 dark:text-slate-300 border-2 border-white dark:border-slate-900">
                                  +{solvers.length - 5}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* 액션 버튼 */}
                        <div className="flex items-center gap-1 shrink-0">
                          {problemUrl && (
                            <a
                              href={problemUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                              <span className="hidden sm:inline">문제</span>
                            </a>
                          )}
                          <Link
                            to={`/submit?source=${problem.source}&number=${problem.problem_number}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/30 rounded-lg transition-colors"
                          >
                            <Upload className="w-4 h-4" />
                            <span className="hidden sm:inline">제출</span>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
