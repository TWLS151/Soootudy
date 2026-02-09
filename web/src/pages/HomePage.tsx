import { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { X, ExternalLink, Sparkles, Plus, Trash2, Upload, History, ChevronRight } from 'lucide-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import MemberCard from '../components/MemberCard';
import StatsChart from '../components/StatsChart';
import SourceBadge from '../components/SourceBadge';
import { sortedMemberEntries, getProblemUrl } from '../services/github';
import { supabase } from '../lib/supabase';
import type { Members, Problem, Activities, DailyProblem } from '../types';

interface Context {
  members: Members;
  problems: Problem[];
  activities: Activities;
  dark: boolean;
}

export default function HomePage() {
  const { members, problems, activities } = useOutletContext<Context>();
  const [bannerClosed, setBannerClosed] = useState(() => {
    return sessionStorage.getItem('betaBannerClosed') === 'true';
  });

  const [dailyProblems, setDailyProblems] = useState<DailyProblem[]>([]);
  const [pastProblems, setPastProblems] = useState<DailyProblem[]>([]);
  const [loadingDaily, setLoadingDaily] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProblem, setNewProblem] = useState({
    source: 'swea' as 'swea' | 'boj' | 'etc',
    problem_number: '',
    problem_title: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const recentProblems = problems.slice(0, 8);

  const closeBanner = () => {
    setBannerClosed(true);
    sessionStorage.setItem('betaBannerClosed', 'true');
  };

  // 오늘의 문제 + 이전 문제 불러오기
  useEffect(() => {
    loadDailyProblems();
    loadPastProblems();

    // 실시간 구독
    const today = new Date().toISOString().split('T')[0];
    const subscription = supabase
      .channel(`daily_problems:${today}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_problem',
          filter: `date=eq.${today}`,
        },
        () => {
          loadDailyProblems();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function loadDailyProblems() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('daily_problem')
        .select('*')
        .eq('date', today)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setDailyProblems(data || []);
    } catch (error) {
      console.error('Failed to load daily problems:', error);
    } finally {
      setLoadingDaily(false);
    }
  }

  async function loadPastProblems() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('daily_problem')
        .select('*')
        .lt('date', today)
        .order('date', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(5);

      if (error) throw error;
      setPastProblems(data || []);
    } catch (error) {
      console.error('Failed to load past problems:', error);
    }
  }

  async function handleAddProblem(e: React.FormEvent) {
    e.preventDefault();
    if (!newProblem.problem_number.trim() || !newProblem.problem_title.trim()) return;

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('daily_problem').insert({
        source: newProblem.source,
        problem_number: newProblem.problem_number.trim(),
        problem_title: newProblem.problem_title.trim(),
        created_by: user.id,
      });

      if (error) throw error;

      // 폼 초기화
      setNewProblem({
        source: 'swea',
        problem_number: '',
        problem_title: '',
      });
      setShowAddForm(false);
      await loadDailyProblems();
    } catch (error: any) {
      console.error('Failed to add problem:', error);
      if (error.code === '23505') {
        alert('이미 추가된 문제입니다.');
      } else {
        alert('문제 추가에 실패했습니다.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteProblem(problemId: string) {
    if (!confirm('이 문제를 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase.from('daily_problem').delete().eq('id', problemId);

      if (error) throw error;
      await loadDailyProblems();
    } catch (error) {
      console.error('Failed to delete problem:', error);
      alert('문제 삭제에 실패했습니다.');
    }
  }

  return (
    <div className="space-y-8">
      {/* 베타 피드백 배너 */}
      {!bannerClosed && (
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3">
          <span className="text-2xl">🚧</span>
          <div className="flex-1 text-sm">
            <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
              베타 버전 운영 중 (2/5 - 2/12)
            </p>
            <p className="text-blue-700 dark:text-blue-300">
              웹사이트에서 이상한 점이나 추가했으면 하는 기능이 있다면 장수철에게 알려주세요!
            </p>
          </div>
          <button
            onClick={closeBanner}
            className="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-400 transition-colors"
            aria-label="배너 닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Hero */}
      <div className="text-center py-8">
        <div className="w-32 h-32 mx-auto mb-2">
          <DotLottieReact src="/pigeon.lottie" loop autoplay />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Soootudy</h1>
        <p className="text-slate-500 dark:text-slate-400">SSAFY 15기 서울 1반 알고리즘 스터디</p>
        <div className="flex justify-center gap-6 mt-4 text-sm">
          <span className="text-slate-600 dark:text-slate-300">
            <strong className="text-indigo-600 dark:text-indigo-400">{Object.keys(members).length}</strong> 팀원
          </span>
          <span className="text-slate-600 dark:text-slate-300">
            <strong className="text-indigo-600 dark:text-indigo-400">{problems.length}</strong> 풀이
          </span>
        </div>
      </div>

      {/* 오늘의 문제 */}
      <section className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-xl p-6 border border-indigo-100 dark:border-indigo-900">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">오늘의 문제</h2>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            문제 추가
          </button>
        </div>

        {/* 문제 추가 폼 */}
        {showAddForm && (
          <form onSubmit={handleAddProblem} className="mb-4 bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    출처
                  </label>
                  <select
                    value={newProblem.source}
                    onChange={(e) => setNewProblem({ ...newProblem, source: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="swea">SWEA</option>
                    <option value="boj">백준</option>
                    <option value="etc">기타</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    문제 번호
                  </label>
                  <input
                    type="text"
                    value={newProblem.problem_number}
                    onChange={(e) => setNewProblem({ ...newProblem, problem_number: e.target.value })}
                    placeholder="1004"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    문제 제목
                  </label>
                  <input
                    type="text"
                    value={newProblem.problem_title}
                    onChange={(e) => setNewProblem({ ...newProblem, problem_title: e.target.value })}
                    placeholder="어린 왕자"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={!newProblem.problem_number.trim() || !newProblem.problem_title.trim() || submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {submitting ? '추가 중...' : '추가'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          </form>
        )}

        {/* 문제 목록 */}
        {loadingDaily ? (
          <div className="flex flex-col items-center justify-center py-6">
            <div className="w-20 h-20">
              <DotLottieReact src="/cat.lottie" loop autoplay />
            </div>
          </div>
        ) : dailyProblems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6">
            <div className="w-24 h-24">
              <DotLottieReact src="/cat.lottie" loop autoplay />
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              오늘의 문제가 아직 등록되지 않았습니다.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {dailyProblems.map((problem) => {
              const problemUrl = getProblemUrl(problem.problem_number, problem.source);
              // 이 문제를 제출한 팀원 찾기
              const problemName = `${problem.source}-${problem.problem_number}`;
              const solvers = problems.filter((p) => (p.baseName || p.name) === problemName);
              return (
                <div
                  key={problem.id}
                  className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 space-y-3"
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
                      {problem.source !== 'etc' && (
                        <Link
                          to={`/submit?source=${problem.source}&number=${problem.problem_number}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          제출
                        </Link>
                      )}
                      <button
                        onClick={() => handleDeleteProblem(problem.id)}
                        className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-colors"
                        aria-label="삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* 제출한 팀원 */}
                  {solvers.length > 0 && (
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-700">
                      <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">제출:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {solvers.map((sol) => {
                          const solMember = members[sol.member];
                          if (!solMember) return null;
                          return (
                            <Link
                              key={sol.id}
                              to={`/problem/${sol.member}/${sol.week}/${sol.name}`}
                              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-50 dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                              title={`${solMember.name} (${sol.week})`}
                            >
                              <img
                                src={`https://github.com/${solMember.github}.png?size=20`}
                                alt={solMember.name}
                                className="w-4 h-4 rounded-full"
                              />
                              <span className="text-xs text-slate-700 dark:text-slate-300">{solMember.name}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 이전 문제들 */}
      {pastProblems.length > 0 && (
        <section className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">이전 문제들</h2>
            </div>
            <Link
              to="/daily-history"
              className="inline-flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              전체 보기
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-2">
            {pastProblems.map((problem) => {
              const problemUrl = getProblemUrl(problem.problem_number, problem.source);
              const problemName = `${problem.source}-${problem.problem_number}`;
              const solvers = problems.filter((p) => (p.baseName || p.name) === problemName);
              const dateLabel = new Date(problem.date + 'T00:00:00').toLocaleDateString('ko-KR', {
                month: 'short',
                day: 'numeric',
              });

              return (
                <div
                  key={problem.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700"
                >
                  <span className="text-xs text-slate-400 dark:text-slate-500 w-12 shrink-0">
                    {dateLabel}
                  </span>
                  <SourceBadge source={problem.source} />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-slate-900 dark:text-slate-100 font-medium truncate block">
                      {problem.problem_title}
                    </span>
                  </div>
                  {solvers.length > 0 && (
                    <div className="flex -space-x-1">
                      {solvers.slice(0, 3).map((sol) => {
                        const solMember = members[sol.member];
                        if (!solMember) return null;
                        return (
                          <img
                            key={sol.id}
                            src={`https://github.com/${solMember.github}.png?size=20`}
                            alt={solMember.name}
                            className="w-5 h-5 rounded-full border border-white dark:border-slate-800"
                            title={solMember.name}
                          />
                        );
                      })}
                      {solvers.length > 3 && (
                        <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-600 text-[10px] flex items-center justify-center text-slate-600 dark:text-slate-300 border border-white dark:border-slate-800">
                          +{solvers.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {problemUrl && (
                      <a
                        href={problemUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        문제 보기
                      </a>
                    )}
                    {problem.source !== 'etc' && (
                      <Link
                        to={`/submit?source=${problem.source}&number=${problem.problem_number}`}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/30 rounded-lg transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        제출
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 팀원 카드 */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">팀원</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedMemberEntries(members).map(([id, member]) => (
            <MemberCard
              key={id}
              id={id}
              member={member}
              problemCount={problems.filter((p) => p.member === id).length}
              streak={activities[id]?.streak}
            />
          ))}
        </div>
      </section>

      {/* 통계 */}
      {problems.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">통계</h2>
          <StatsChart problems={problems} members={members} />
        </section>
      )}

      {/* 최근 제출 */}
      {recentProblems.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">최근 풀이</h2>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
            {recentProblems.map((p) => (
              <Link
                key={p.id}
                to={`/problem/${p.member}/${p.week}/${p.name}`}
                className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <SourceBadge source={p.source} />
                <span className="text-sm text-slate-900 dark:text-slate-100 font-medium">{p.name}</span>
                <span className="text-xs text-slate-400 ml-auto">{members[p.member]?.name} · {p.week}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
