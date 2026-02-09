import { useState, useMemo } from 'react';
import { useParams, useOutletContext, useNavigate, Link } from 'react-router-dom';
import { Calendar, Check, TrendingUp } from 'lucide-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import SourceBadge from '../components/SourceBadge';
import type { Members, Problem } from '../types';

interface Context {
  members: Members;
  problems: Problem[];
  weeks: string[];
  dark: boolean;
}

export default function WeeklyPage() {
  const { week } = useParams<{ week: string }>();
  const { members, problems, weeks } = useOutletContext<Context>();
  const navigate = useNavigate();
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);

  const currentWeek = week || weeks[0];

  // 해당 주차 문제들
  const weekProblems = useMemo(
    () => problems.filter((p) => p.week === currentWeek),
    [problems, currentWeek]
  );

  // 필터링된 문제들 (고유 문제명 기준)
  const filteredProblems = useMemo(() => {
    const uniqueProblems = new Map<string, Problem>();
    weekProblems.forEach((p) => {
      if (!sourceFilter || p.source === sourceFilter) {
        const key = p.baseName || p.name;
        if (!uniqueProblems.has(key)) {
          uniqueProblems.set(key, p);
        }
      }
    });
    return Array.from(uniqueProblems.values()).sort((a, b) =>
      (a.baseName || a.name).localeCompare(b.baseName || b.name)
    );
  }, [weekProblems, sourceFilter]);

  // 해당 주차에 참여한 멤버들
  const participatingMemberIds = useMemo(() => {
    const memberSet = new Set(weekProblems.map((p) => p.member));
    return Array.from(memberSet).sort();
  }, [weekProblems]);

  const displayMembers = useMemo(
    () => participatingMemberIds.map((id) => [id, members[id]] as const),
    [participatingMemberIds, members]
  );

  // 풀이 행렬 생성
  const solvedMatrix = useMemo(() => {
    const matrix = new Map<string, Map<string, Problem>>();
    weekProblems.forEach((p) => {
      const key = p.baseName || p.name;
      if (!matrix.has(key)) {
        matrix.set(key, new Map());
      }
      const existing = matrix.get(key)!.get(p.member);
      if (!existing || (p.version || 0) > (existing.version || 0)) {
        matrix.get(key)!.set(p.member, p);
      }
    });
    return matrix;
  }, [weekProblems]);

  // 통계 계산
  const stats = useMemo(() => {
    const totalProblems = filteredProblems.length;
    const totalSolutions = weekProblems.filter((p) =>
      !sourceFilter || p.source === sourceFilter
    ).length;
    const avgPerMember =
      displayMembers.length > 0 ? (totalSolutions / displayMembers.length).toFixed(1) : '0';

    return { totalProblems, totalSolutions, avgPerMember };
  }, [filteredProblems, weekProblems, sourceFilter, displayMembers]);

  if (weekProblems.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 flex-wrap">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">주간 현황</h1>
          <select
            value={currentWeek}
            onChange={(e) => navigate(`/weekly/${e.target.value}`)}
            className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {weeks.map((w) => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-28 h-28">
            <DotLottieReact src="/cat.lottie" loop autoplay />
          </div>
          <p className="text-slate-500 dark:text-slate-400 mt-2">해당 주차에 제출된 풀이가 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4 flex-wrap">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">주간 현황</h1>
        <select
          value={currentWeek}
          onChange={(e) => navigate(`/weekly/${e.target.value}`)}
          className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {weeks.map((w) => (
            <option key={w} value={w}>{w}</option>
          ))}
        </select>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">총 문제 수</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {stats.totalProblems}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">총 풀이 수</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {stats.totalSolutions}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">평균 풀이/인</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {stats.avgPerMember}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 필터 */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">출처</h3>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSourceFilter(null)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              sourceFilter === null
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            전체
          </button>
          <button
            onClick={() => setSourceFilter('swea')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              sourceFilter === 'swea'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            SWEA
          </button>
          <button
            onClick={() => setSourceFilter('boj')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              sourceFilter === 'boj'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            BOJ
          </button>
          <button
            onClick={() => setSourceFilter('etc')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              sourceFilter === 'etc'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            기타
          </button>
        </div>
      </div>

      {/* 문제 현황 매트릭스 */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                <th className="sticky left-0 z-20 bg-slate-50 dark:bg-slate-900 text-left py-3 px-4 text-slate-900 dark:text-slate-100 font-semibold min-w-[200px]">
                  문제
                </th>
                {displayMembers.map(([id, member]) => (
                  <th
                    key={id}
                    className="py-3 px-3 text-center text-slate-900 dark:text-slate-100 font-semibold min-w-[100px]"
                  >
                    <Link
                      to={`/member/${id}`}
                      className="flex flex-col items-center gap-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                      <img
                        src={`https://github.com/${member?.github}.png?size=32`}
                        alt={member?.name}
                        className="w-8 h-8 rounded-full"
                      />
                      <span className="text-xs font-medium whitespace-nowrap">
                        {member?.name || id}
                      </span>
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredProblems.length === 0 ? (
                <tr>
                  <td
                    colSpan={displayMembers.length + 1}
                    className="text-center py-8 text-slate-500 dark:text-slate-400"
                  >
                    필터 조건에 맞는 문제가 없습니다.
                  </td>
                </tr>
              ) : (
                filteredProblems.map((problem) => {
                  const baseKey = problem.baseName || problem.name;
                  const problemRow = solvedMatrix.get(baseKey);

                  return (
                    <tr
                      key={baseKey}
                      className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                    >
                      <td className="sticky left-0 z-10 bg-white dark:bg-slate-800 py-3 px-4 group-hover:bg-slate-50 dark:group-hover:bg-slate-900/50">
                        <div className="flex items-center gap-2">
                          <SourceBadge source={problem.source} />
                          <span className="text-slate-900 dark:text-slate-100 font-medium">
                            {baseKey}
                          </span>
                        </div>
                      </td>
                      {displayMembers.map(([memberId]) => {
                        const solved = problemRow?.get(memberId);
                        return (
                          <td key={memberId} className="text-center py-3 px-3">
                            {solved ? (
                              <Link
                                to={`/problem/${memberId}/${currentWeek}/${solved.name}`}
                                className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                              >
                                <Check className="w-4 h-4" />
                              </Link>
                            ) : (
                              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700/30">
                                <span className="text-slate-300 dark:text-slate-600 text-xs">-</span>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
