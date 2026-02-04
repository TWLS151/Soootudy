import { Link, useLocation } from 'react-router-dom';
import { sortedMemberEntries } from '../services/github';
import type { Members } from '../types';

interface SidebarProps {
  members: Members;
  weeks: string[];
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ members, weeks, open, onClose }: SidebarProps) {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

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
        <div className="p-4">
          {/* 팀원 */}
          <h2 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
            팀원
          </h2>
          <ul className="space-y-1 mb-6">
            {sortedMemberEntries(members).map(([id, member]) => (
              <li key={id}>
                <Link
                  to={`/member/${id}`}
                  onClick={onClose}
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

          {/* 주차 */}
          <h2 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
            주차
          </h2>
          <ul className="space-y-1">
            {weeks.map((week) => (
              <li key={week}>
                <Link
                  to={`/weekly/${week}`}
                  onClick={onClose}
                  className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive(`/weekly/${week}`)
                      ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-medium'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {week}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </>
  );
}
