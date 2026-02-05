import { useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { X } from 'lucide-react';
import MemberCard from '../components/MemberCard';
import StatsChart from '../components/StatsChart';
import SourceBadge from '../components/SourceBadge';
import { sortedMemberEntries } from '../services/github';
import type { Members, Problem, Activities } from '../types';

interface Context {
  members: Members;
  problems: Problem[];
  activities: Activities;
  dark: boolean;
}

export default function HomePage() {
  const { members, problems, activities } = useOutletContext<Context>();
  const [bannerClosed, setBannerClosed] = useState(() => {
    return sessionStorage.getItem('betaBannerClosed') === 'true';
  });

  const recentProblems = problems.slice(0, 8);

  const closeBanner = () => {
    setBannerClosed(true);
    sessionStorage.setItem('betaBannerClosed', 'true');
  };

  return (
    <div className="space-y-8">
      {/* 베타 피드백 배너 */}
      {!bannerClosed && (
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3">
          <span className="text-2xl">🚧</span>
          <div className="flex-1 text-sm">
            <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
              베타 버전 운영 중 (2/5 - 2/12)
            </p>
            <p className="text-blue-700 dark:text-blue-300">
              웹사이트에서 이상한 점이나 추가했으면 하는 기능이 있다면 장수철에게 알려주세요!
            </p>
          </div>
          <button
            onClick={closeBanner}
            className="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-400 transition-colors"
            aria-label="배너 닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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
          {sortedMemberEntries(members).map(([id, member]) => (
            <MemberCard
              key={id}
              id={id}
              member={member}
              problemCount={problems.filter((p) => p.member === id).length}
              streak={activities[id]?.streak}
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
                className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <SourceBadge source={p.source} />
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
