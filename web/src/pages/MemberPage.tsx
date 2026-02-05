import { useState } from 'react';
import { useParams, useOutletContext, Link } from 'react-router-dom';
import { Flame, MessageSquare } from 'lucide-react';
import FilterChips from '../components/FilterChips';
import ActivityHeatmap from '../components/ActivityHeatmap';
import type { Members, Problem, Activities } from '../types';

interface Context {
  members: Members;
  problems: Problem[];
  activities: Activities;
  dark: boolean;
}

export default function MemberPage() {
  const { id } = useParams<{ id: string }>();
  const { members, problems, activities } = useOutletContext<Context>();
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const [openWeeks, setOpenWeeks] = useState<Set<string>>(new Set());

  const member = id ? members[id] : undefined;
  if (!member || !id) {
    return <p className="text-slate-500 dark:text-slate-400">팀원을 찾을 수 없습니다.</p>;
  }

  const memberProblems = problems.filter((p) => p.member === id);
  const filtered = sourceFilter
    ? memberProblems.filter((p) => p.source === sourceFilter)
    : memberProblems;

  // 주차별 그룹핑
  const weekGroups = new Map<string, Problem[]>();
  for (const p of filtered) {
    const group = weekGroups.get(p.week) || [];
    group.push(p);
    weekGroups.set(p.week, group);
  }
  const sortedWeeks = Array.from(weekGroups.keys()).sort((a, b) => b.localeCompare(a));

  const toggleWeek = (week: string) => {
    setOpenWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(week)) next.delete(week);
      else next.add(week);
      return next;
    });
  };

  // 출처별 통계
  const sourceStats = {
    swea: memberProblems.filter((p) => p.source === 'swea').length,
    boj: memberProblems.filter((p) => p.source === 'boj').length,
    etc: memberProblems.filter((p) => p.source === 'etc').length,
  };

  return (
    <div className="space-y-6">
      {/* 프로필 헤더 */}
      <div className="flex items-start justify-between gap-5">
        <div className="flex items-center gap-5">
          <img
            src={`https://github.com/${member.github}.png?size=128`}
            alt={member.name}
            className="w-16 h-16 rounded-full"
          />
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{member.name}</h1>
            <a
              href={`https://github.com/${member.github}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              @{member.github}
            </a>
            <div className="flex gap-4 mt-1 text-xs text-slate-500 dark:text-slate-400">
              <span>총 {memberProblems.length}문제</span>
              {sourceStats.swea > 0 && <span>SWEA {sourceStats.swea}</span>}
              {sourceStats.boj > 0 && <span>BOJ {sourceStats.boj}</span>}
              {sourceStats.etc > 0 && <span>기타 {sourceStats.etc}</span>}
            </div>
            {activities[id] && activities[id].streak > 0 && (
              <div className="flex items-center gap-1 mt-1 text-orange-500 dark:text-orange-400">
                <Flame className="w-4 h-4" />
                <span className="text-sm font-semibold">{activities[id].streak}일 연속</span>
              </div>
            )}
          </div>
        </div>
        <Link
          to={`/member/${id}/comments`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          댓글 모아보기
        </Link>
      </div>

      {/* 활동 히트맵 */}
      {activities[id] && (
        <ActivityHeatmap dates={activities[id].dates} />
      )}

      {/* 필터 */}
      <FilterChips active={sourceFilter} onChange={setSourceFilter} />

      {/* 주차별 아코디언 */}
      {sortedWeeks.length === 0 ? (
        <p className="text-slate-500 dark:text-slate-400 text-sm">풀이가 없습니다.</p>
      ) : (
        <div className="space-y-2">
          {sortedWeeks.map((week) => {
            const isOpen = openWeeks.has(week);
            const weekProblems = weekGroups.get(week)!;
            return (
              <div key={week} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <button
                  onClick={() => toggleWeek(week)}
                  className="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <span className="font-medium text-slate-900 dark:text-slate-100">{week}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{weekProblems.length}문제</span>
                    <svg
                      className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                {isOpen && (
                  <div className="border-t border-slate-100 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
                    {weekProblems.map((p) => (
                      <Link
                        key={p.id}
                        to={`/problem/${p.member}/${p.week}/${p.name}`}
                        className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                          p.source === 'swea' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                          p.source === 'boj' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                          'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                        }`}>
                          {p.source.toUpperCase()}
                        </span>
                        <span className="text-sm text-slate-900 dark:text-slate-100">{p.name}</span>
                        {p.hasNote && (
                          <span className="text-xs text-indigo-500 dark:text-indigo-400">노트</span>
                        )}
                      </Link>
                    ))}
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
