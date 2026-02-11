import { useMemo } from 'react';
import { getRealMembers } from '../lib/reference';
import type { Problem, Members } from '../types';

interface StatsChartProps {
  problems: Problem[];
  members: Members;
}

export default function StatsChart({ problems, members }: StatsChartProps) {
  const memberCounts = useMemo(() => {
    const counts: { id: string; name: string; count: number }[] = [];
    const real = getRealMembers(members);
    for (const [id, member] of Object.entries(real)) {
      const count = problems.filter((p) => p.member === id).length;
      if (count > 0) counts.push({ id, name: member.name, count });
    }
    counts.sort((a, b) => b.count - a.count);
    return counts;
  }, [problems, members]);

  const maxCount = useMemo(
    () => Math.max(...memberCounts.map((m) => m.count), 1),
    [memberCounts]
  );

  const sourceCounts = useMemo(() => ({
    swea: problems.filter((p) => p.source === 'swea').length,
    boj: problems.filter((p) => p.source === 'boj').length,
    etc: problems.filter((p) => p.source === 'etc').length,
  }), [problems]);

  const total = problems.length || 1;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* 팀원별 풀이 수 */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">팀원별 풀이 수</h3>
        <div className="space-y-3">
          {memberCounts.map((m) => (
            <div key={m.id} className="flex items-center gap-3">
              <span className="text-xs text-slate-500 dark:text-slate-400 w-16 truncate">{m.name}</span>
              <div className="flex-1 h-5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all"
                  style={{ width: `${(m.count / maxCount) * 100}%` }}
                />
              </div>
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300 w-6 text-right">{m.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 출처별 분포 */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">출처별 분포</h3>
        <div className="flex items-center justify-center gap-8 py-4">
          {[
            { label: 'SWEA', count: sourceCounts.swea, color: 'bg-blue-500' },
            { label: 'BOJ', count: sourceCounts.boj, color: 'bg-green-500' },
            { label: '기타', count: sourceCounts.etc, color: 'bg-slate-400' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="relative w-16 h-16 mb-2">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15" fill="none" className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="15" fill="none"
                    className={s.color.replace('bg-', 'stroke-')}
                    strokeWidth="3"
                    strokeDasharray={`${(s.count / total) * 94.2} 94.2`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-300">
                  {s.count}
                </span>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
