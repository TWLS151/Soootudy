import { Link } from 'react-router-dom';
import type { Problem, Members } from '../types';

interface ProgressTableProps {
  problems: Problem[];
  members: Members;
  week: string;
}

export default function ProgressTable({ problems, members, week }: ProgressTableProps) {
  const weekProblems = problems.filter((p) => p.week === week);
  const uniqueNames = [...new Set(weekProblems.map((p) => p.name))].sort();
  const memberIds = Object.keys(members).filter((id) =>
    weekProblems.some((p) => p.member === id)
  );

  if (weekProblems.length === 0) {
    return <p className="text-slate-500 dark:text-slate-400 text-sm">해당 주차에 제출된 풀이가 없습니다.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700">
            <th className="text-left py-3 px-4 text-slate-500 dark:text-slate-400 font-medium">팀원</th>
            {uniqueNames.map((name) => (
              <th key={name} className="text-center py-3 px-2 text-slate-500 dark:text-slate-400 font-medium text-xs">
                {name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {memberIds.map((id) => (
            <tr key={id} className="border-b border-slate-100 dark:border-slate-800">
              <td className="py-3 px-4">
                <Link to={`/member/${id}`} className="text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium">
                  {members[id]?.name}
                </Link>
              </td>
              {uniqueNames.map((name) => {
                const problem = weekProblems.find((p) => p.member === id && p.name === name);
                return (
                  <td key={name} className="text-center py-3 px-2">
                    {problem ? (
                      <Link to={`/problem/${problem.member}/${problem.week}/${problem.name}`}>
                        <span className="inline-block w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 leading-6 text-xs">
                          ✓
                        </span>
                      </Link>
                    ) : (
                      <span className="inline-block w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 leading-6 text-xs">
                        -
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
