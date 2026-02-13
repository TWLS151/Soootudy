// --- 시험 대비 페이지 (임시 기능, 시험 후 제거 예정) ---
import { useState, useEffect, useMemo } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { ExternalLink, Upload, BookOpen, Sparkles, Lock, Code2, List, BarChart3, Check, X, Filter } from 'lucide-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import SourceBadge from '../components/SourceBadge';
import { getProblemUrl } from '../services/github';
import { hasUserSolvedBaseName } from '../lib/reference';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import type { Members, Problem, DailyProblem, ExamType } from '../types';

interface Context {
  members: Members;
  problems: Problem[];
  user: User;
  dark: boolean;
}

type Tab = 'problems' | 'status';

export default function ExamPage() {
  const { members, problems, user } = useOutletContext<Context>();
  const [examProblems, setExamProblems] = useState<DailyProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSolver, setExpandedSolver] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('problems');
  const [examTypeFilter, setExamTypeFilter] = useState<ExamType | 'all'>('all');
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());

  const githubUsername = user?.user_metadata?.user_name || user?.user_metadata?.preferred_username;
  const currentMemberId = useMemo(() => {
    if (!githubUsername) return null;
    for (const [id, member] of Object.entries(members)) {
      if (member.github.toLowerCase() === githubUsername.toLowerCase()) return id;
    }
    return null;
  }, [members, githubUsername]);

  const memberIds = useMemo(() => Object.keys(members).filter((id) => id !== '_ref'), [members]);

  // 초기에 전체 멤버 선택
  useEffect(() => {
    if (memberIds.length > 0 && selectedMembers.size === 0) {
      setSelectedMembers(new Set(memberIds));
    }
  }, [memberIds]);

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
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;
      setExamProblems(data || []);
    } catch (error) {
      console.error('Failed to load exam problems:', error);
    } finally {
      setLoading(false);
    }
  }

  // 시험 유형 필터 적용
  const filteredExamProblems = useMemo(
    () => examTypeFilter === 'all' ? examProblems : examProblems.filter((p) => p.exam_type === examTypeFilter),
    [examProblems, examTypeFilter]
  );

  // 풀이현황: 멤버별 문제 풀이 상태 계산
  const statusData = useMemo(() => {
    return filteredExamProblems.map((ep) => {
      const problemNumber = ep.source === 'etc' ? ep.problem_number.replace(/ /g, '_') : ep.problem_number;
      const problemName = `${ep.source}-${problemNumber}`;
      const solvedBy = new Set<string>();
      for (const p of problems) {
        if ((p.baseName || p.name) === problemName && p.member !== '_ref') {
          solvedBy.add(p.member);
        }
      }
      return { problem: ep, problemName, solvedBy };
    });
  }, [filteredExamProblems, problems]);

  const filteredMemberIds = useMemo(
    () => memberIds.filter((id) => selectedMembers.has(id)),
    [memberIds, selectedMembers]
  );

  function toggleMember(id: string) {
    setSelectedMembers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selectedMembers.size === memberIds.length) {
      setSelectedMembers(new Set());
    } else {
      setSelectedMembers(new Set(memberIds));
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

      {/* 탭 + 시험 유형 필터 */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex gap-2">
          <button
            onClick={() => setTab('problems')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'problems'
                ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <List className="w-4 h-4" />
            문제보기
          </button>
          <button
            onClick={() => setTab('status')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'status'
                ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            풀이현황
          </button>
        </div>
        <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
        <div className="flex gap-1.5">
          {([['all', '전체'], ['IM', 'IM형'], ['A', 'A형']] as const).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setExamTypeFilter(value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                examTypeFilter === value
                  ? value === 'A'
                    ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 ring-1 ring-red-300 dark:ring-red-700'
                    : value === 'IM'
                    ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 ring-1 ring-blue-300 dark:ring-blue-700'
                    : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 ring-1 ring-amber-300 dark:ring-amber-700'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 콘텐츠 */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-24 h-24">
            <DotLottieReact src="/cat.lottie" loop autoplay />
          </div>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-2 animate-pulse">불러오는 중...</p>
        </div>
      ) : filteredExamProblems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-24 h-24">
            <DotLottieReact src="/cat.lottie" loop autoplay />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            {examProblems.length === 0 ? '등록된 시험 대비 문제가 없습니다.' : '해당 유형의 문제가 없습니다.'}
          </p>
        </div>
      ) : tab === 'problems' ? (
        /* ========== 문제보기 탭 ========== */
        <div className="space-y-3">
          {filteredExamProblems.map((problem) => {
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
                    {problem.exam_type && (
                      <span className={`px-2 py-0.5 rounded text-xs font-bold shrink-0 ${
                        problem.exam_type === 'A'
                          ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'
                          : 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                      }`}>
                        {problem.exam_type}형
                      </span>
                    )}
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
      ) : (
        /* ========== 풀이현황 탭 ========== */
        <div className="space-y-4">
          {/* 멤버 필터 */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">팀원 필터</span>
              <button
                onClick={toggleAll}
                className="ml-auto text-xs text-amber-600 dark:text-amber-400 hover:underline"
              >
                {selectedMembers.size === memberIds.length ? '전체 해제' : '전체 선택'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {memberIds.map((id) => {
                const member = members[id];
                if (!member) return null;
                const isSelected = selectedMembers.has(id);
                return (
                  <button
                    key={id}
                    onClick={() => toggleMember(id)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      isSelected
                        ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 ring-1 ring-amber-300 dark:ring-amber-700'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    <img
                      src={`https://github.com/${member.github}.png?size=20`}
                      alt={member.name}
                      className={`w-4 h-4 rounded-full ${isSelected ? '' : 'opacity-40'}`}
                    />
                    {member.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 풀이현황 테이블 */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 sticky left-0 bg-white dark:bg-slate-900 z-10 min-w-[120px]">
                    팀원
                  </th>
                  {examProblems.map((ep) => (
                    <th
                      key={ep.id}
                      className="px-3 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 min-w-[80px]"
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase">{ep.source}</span>
                        <span className="truncate max-w-[80px]" title={ep.problem_title}>
                          {ep.problem_title}
                        </span>
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 min-w-[60px]">
                    합계
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredMemberIds.map((memberId) => {
                  const member = members[memberId];
                  if (!member) return null;
                  let solvedCount = 0;

                  return (
                    <tr key={memberId} className="border-b border-slate-100 dark:border-slate-800 last:border-b-0">
                      <td className="px-4 py-3 sticky left-0 bg-white dark:bg-slate-900 z-10">
                        <div className="flex items-center gap-2">
                          <img
                            src={`https://github.com/${member.github}.png?size=24`}
                            alt={member.name}
                            className="w-5 h-5 rounded-full"
                          />
                          <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{member.name}</span>
                        </div>
                      </td>
                      {statusData.map(({ problem, solvedBy }) => {
                        const solved = solvedBy.has(memberId);
                        if (solved) solvedCount++;
                        return (
                          <td key={problem.id} className="px-3 py-3 text-center">
                            {solved ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/40">
                                <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800">
                                <X className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
                              </span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-center">
                        <span className={`text-sm font-bold ${
                          solvedCount === filteredExamProblems.length
                            ? 'text-green-600 dark:text-green-400'
                            : solvedCount > 0
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}>
                          {solvedCount}/{filteredExamProblems.length}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredMemberIds.length === 0 && (
              <div className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                선택된 팀원이 없습니다.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
