import { useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { sortedMemberEntries } from '../services/github';
import type { Members } from '../types';

interface SidebarProps {
  members: Members;
  weeks: string[];
  open: boolean;
  onClose: () => void;
}

type Tab = 'members' | 'weeks';

function formatWeekLabel(week: string): string {
  // "26-01-w4" → "Week 4"
  const match = week.match(/w(\d+)$/);
  return match ? `Week ${match[1]}` : week;
}

function groupWeeksByMonth(weeks: string[]): { month: string; label: string; weeks: string[] }[] {
  const groups: Record<string, string[]> = {};
  for (const w of weeks) {
    // "26-01-w4" → "26-01"
    const month = w.slice(0, 5);
    if (!groups[month]) groups[month] = [];
    groups[month].push(w);
  }
  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([month, ws]) => {
      const m = parseInt(month.slice(3, 5), 10);
      return { month, label: `${m}월`, weeks: ws };
    });
}

export default function Sidebar({ members, weeks, open, onClose }: SidebarProps) {
  const location = useLocation();
  const [tab, setTab] = useState<Tab>('members');
  const [openMonths, setOpenMonths] = useState<Set<string>>(new Set());

  const isActive = (path: string) => location.pathname === path;

  const monthGroups = useMemo(() => groupWeeksByMonth(weeks), [weeks]);

  // 첫 로드 시 최신 월을 열어둠
  useState(() => {
    if (monthGroups.length > 0) {
      setOpenMonths(new Set([monthGroups[0].month]));
    }
  });

  const toggleMonth = (month: string) => {
    setOpenMonths((prev) => {
      const next = new Set(prev);
      if (next.has(month)) next.delete(month);
      else next.add(month);
      return next;
    });
  };

  return (
    <>
      {/* 모바일 오버레이 */}
      {open && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed top-16 left-0 bottom-0 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 overflow-y-auto z-50 transition-transform lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* 탭 */}
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setTab('members')}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              tab === 'members'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            팀원
          </button>
          <button
            onClick={() => setTab('weeks')}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              tab === 'weeks'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            주차
          </button>
        </div>

        <div className="p-4">
          {/* 팀원 탭 */}
          {tab === 'members' && (
            <ul className="space-y-1">
              {sortedMemberEntries(members).map(([id, member]) => (
                <li key={id}>
                  <Link
                    to={`/member/${id}`}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive(`/member/${id}`)
                        ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-medium'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <img
                      src={`https://github.com/${member.github}.png?size=32`}
                      alt={member.name}
                      className="w-6 h-6 rounded-full"
                    />
                    {member.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {/* 주차 탭 */}
          {tab === 'weeks' && (
            <div className="space-y-1">
              {monthGroups.map((group) => {
                const isOpen = openMonths.has(group.month);
                return (
                  <div key={group.month}>
                    <button
                      onClick={() => toggleMonth(group.month)}
                      className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      {group.label}
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isOpen && (
                      <ul className="ml-2 space-y-0.5">
                        {group.weeks.map((week) => (
                          <li key={week}>
                            <Link
                              to={`/weekly/${week}`}
                              className={`block px-3 py-1.5 rounded-lg text-sm transition-colors ${
                                isActive(`/weekly/${week}`)
                                  ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-medium'
                                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                            >
                              {formatWeekLabel(week)}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
