import { useOutletContext } from 'react-router-dom';
import MemberCard from '../components/MemberCard';
import StatsChart from '../components/StatsChart';
import type { Members, Problem } from '../types';
import { Link } from 'react-router-dom';

interface Context {
  members: Members;
  problems: Problem[];
  dark: boolean;
}

export default function HomePage() {
  const { members, problems } = useOutletContext<Context>();

  const recentProblems = problems.slice(0, 8);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center py-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Sootudy</h1>
        <p className="text-slate-500 dark:text-slate-400">SSAFY 15기 서울 1반 알고리즘 스터디</p>
        <div className="flex justify-center gap-6 mt-4 text-sm">
          <span className="text-slate-600 dark:text-slate-300">
            <strong className="text-indigo-600 dark:text-indigo-400">{Object.keys(members).length}</strong> 팀원
          </span>
          <span className="text-slate-600 dark:text-slate-300">
            <strong className="text-indigo-600 dark:text-indigo-400">{problems.length}</strong> 풀이
          </span>
        </div>
      </div>

      {/* 팀원 카드 */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">팀원</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(members).map(([id, member]) => (
            <MemberCard
              key={id}
              id={id}
              member={member}
              problemCount={problems.filter((p) => p.member === id).length}
            />
          ))}
        </div>
      </section>

      {/* 통계 */}
      {problems.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">통계</h2>
          <StatsChart problems={problems} members={members} />
        </section>
      )}

      {/* 최근 제출 */}
      {recentProblems.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">최근 풀이</h2>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
            {recentProblems.map((p) => (
              <Link
                key={p.id}
                to={`/problem/${p.member}/${p.week}/${p.name}`}
                className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
              >
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                  p.source === 'swea' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                  p.source === 'boj' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                  'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                }`}>
                  {p.source.toUpperCase()}
                </span>
                <span className="text-sm text-slate-900 dark:text-slate-100 font-medium">{p.name}</span>
                <span className="text-xs text-slate-400 ml-auto">{members[p.member]?.name} · {p.week}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
