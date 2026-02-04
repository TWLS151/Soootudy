import { useState } from 'react';
import { useParams, useOutletContext, useNavigate } from 'react-router-dom';
import FilterChips from '../components/FilterChips';
import ProgressTable from '../components/ProgressTable';
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

  const filtered = sourceFilter
    ? problems.filter((p) => p.source === sourceFilter)
    : problems;

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

      {/* 필터 */}
      <FilterChips active={sourceFilter} onChange={setSourceFilter} />

      {/* 테이블 */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <ProgressTable problems={filtered} members={members} week={currentWeek} />
      </div>
    </div>
  );
}
