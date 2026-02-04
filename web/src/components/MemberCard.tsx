import { Link } from 'react-router-dom';
import { Flame } from 'lucide-react';
import type { Member } from '../types';

interface MemberCardProps {
  id: string;
  member: Member;
  problemCount: number;
  streak?: number;
}

export default function MemberCard({ id, member, problemCount, streak = 0 }: MemberCardProps) {
  return (
    <Link
      to={`/member/${id}`}
      className="block bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600 transition-all"
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
        {streak > 0 && (
          <div className="flex items-center gap-1 text-orange-500 dark:text-orange-400 shrink-0">
            <Flame className="w-4 h-4" />
            <span className="text-sm font-semibold">{streak}일</span>
          </div>
        )}
      </div>
    </Link>
  );
}
