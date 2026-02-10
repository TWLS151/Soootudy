import { Link } from 'react-router-dom';
import { Flame } from 'lucide-react';
import type { Member } from '../types';

interface MemberCardProps {
  id: string;
  member: Member;
  problemCount: number;
  streak?: number;
  completed?: boolean;
}

export default function MemberCard({ id, member, problemCount, streak = 0, completed }: MemberCardProps) {
  return (
    <Link
      to={`/member/${id}`}
      className={`block rounded-xl p-5 shadow-sm border transition-all ${
        completed
          ? 'bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 border-amber-300 dark:border-amber-700 shadow-[0_0_15px_rgba(245,158,11,0.3)] dark:shadow-[0_0_15px_rgba(245,158,11,0.2)]'
          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600'
      }`}
    >
      <div className="flex items-center gap-4">
        <img
          src={`https://github.com/${member.github}.png?size=80`}
          alt={member.name}
          className="w-12 h-12 rounded-full"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">{member.name}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {problemCount}문제 풀이
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {completed && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400">
              완료
            </span>
          )}
          {streak > 0 && (
            <div className="flex items-center gap-1 text-orange-500 dark:text-orange-400">
              <Flame className="w-4 h-4" />
              <span className="text-sm font-semibold">{streak}일</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
