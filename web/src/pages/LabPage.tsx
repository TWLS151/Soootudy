import { useState, useMemo } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { Flame, Trophy, Target, TrendingUp, Grid3x3, Check } from 'lucide-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { sortedMemberEntries } from '../services/github';
import type { Members, Problem, Activities } from '../types';

interface Context {
  members: Members;
  problems: Problem[];
  activities: Activities;
  dark: boolean;
}

type BoardType = 'total' | 'streak' | 'weekly';
type MainTab = 'leaderboard' | 'matrix';

export default function LabPage() {
  const { members, problems, activities } = useOutletContext<Context>();
  const [activeTab, setActiveTab] = useState<MainTab>('leaderboard');
  const [activeBoard, setActiveBoard] = useState<BoardType>('total');
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const [difficultyFilter, setDifficultyFilter] = useState<string | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());

  // 전체 풀이 수 랭킹
  const totalRanking = useMemo(() => {
    return sortedMemberEntries(members)
      .map(([id, member]) => ({
        id,
        name: member.name,
        github: member.github,
        value: problems.filter((p) => p.member === id).length,
      }))
      .sort((a, b) => b.value - a.value);
  }, [members, problems]);

  // 스트릭 랭킹
  const streakRanking = useMemo(() => {
    return sortedMemberEntries(members)
      .map(([id, member]) => ({
        id,
        name: member.name,
        github: member.github,
        value: activities[id]?.streak ?? 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [members, activities]);

  // 이번 주 풀이 수 랭킹
  const weeklyRanking = useMemo(() => {
    const weeks = [...new Set(problems.map((p) => p.week))].sort((a, b) => b.localeCompare(a));
    const currentWeek = weeks[0] || '';
    return sortedMemberEntries(members)
      .map(([id, member]) => ({
        id,
        name: member.name,
        github: member.github,
        value: problems.filter((p) => p.member === id && p.week === currentWeek).length,
      }))
      .sort((a, b) => b.value - a.value);
  }, [members, problems]);

  const boards: { key: BoardType; label: string; icon: typeof Trophy; unit: string }[] = [
    { key: 'total', label: '총 풀이', icon: Trophy, unit: '문제' },
    { key: 'streak', label: '스트릭', icon: Flame, unit: '일' },
    { key: 'weekly', label: '이번 주', icon: Target, unit: '문제' },
  ];

  const rankings = { total: totalRanking, streak: streakRanking, weekly: weeklyRanking };
  const currentRanking = rankings[activeBoard];
  const currentUnit = boards.find((b) => b.key === activeBoard)!.unit;
  const maxValue = Math.max(...currentRanking.map((r) => r.value), 1);

  const medalColors = ['text-yellow-500', 'text-slate-400', 'text-amber-700'];

  // 멤버 필터 토글
  const toggleMember = (memberId: string) => {
    setSelectedMembers((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) {
        next.delete(memberId);
      } else {
        next.add(memberId);
      }
      return next;
    });
  };

  const selectAllMembers = () => {
    setSelectedMembers(new Set());
  };

  // 선택된 멤버 목록 (빈 Set이면 전체)
  const displayMembers = useMemo(() => {
    if (selectedMembers.size === 0) {
      return sortedMemberEntries(members);
    }
    return sortedMemberEntries(members).filter(([id]) => selectedMembers.has(id));
  }, [members, selectedMembers]);

  // 문제 매트릭스 뷰 관련 로직
  const uniqueProblems = useMemo(() => {
    // 문제 번호 기준으로 중복 제거 (같은 문제를 여러 사람이 푼 경우)
    const problemMap = new Map<string, Problem>();
    for (const p of problems) {
      const key = `${p.source}-${p.name}`;
      if (!problemMap.has(key)) {
        problemMap.set(key, { ...p, difficulty: p.difficulty || '미정' });
      }
    }
    return Array.from(problemMap.values());
  }, [problems]);

  const filteredProblems = useMemo(() => {
    let filtered = uniqueProblems;
    if (sourceFilter) {
      filtered = filtered.filter((p) => p.source === sourceFilter);
    }
    if (difficultyFilter) {
      filtered = filtered.filter((p) => (p.difficulty || '미정') === difficultyFilter);
    }
    return filtered.sort((a, b) => {
      // source 순서대로 정렬 (swea -> boj -> etc), 그 다음 이름순
      if (a.source !== b.source) {
        const order = { swea: 0, boj: 1, etc: 2 };
        return order[a.source] - order[b.source];
      }
      return a.name.localeCompare(b.name);
    });
  }, [uniqueProblems, sourceFilter, difficultyFilter]);

  // 각 멤버가 어떤 문제를 풀었는지 매핑
  const solvedMatrix = useMemo(() => {
    const matrix: Record<string, Set<string>> = {};
    for (const [id] of sortedMemberEntries(members)) {
      matrix[id] = new Set();
    }
    for (const p of problems) {
      const key = `${p.source}-${p.name}`;
      if (matrix[p.member]) {
        matrix[p.member].add(key);
      }
    }
    return matrix;
  }, [members, problems]);

  // 난이도 목록 추출
  const difficulties = useMemo(() => {
    const diffSet = new Set(uniqueProblems.map((p) => p.difficulty || '미정'));
    return Array.from(diffSet).sort();
  }, [uniqueProblems]);

  // 통계
  const matrixStats = useMemo(() => {
    const totalMembers = displayMembers.length;
    const totalProblems = filteredProblems.length;
    const totalSolved = filteredProblems.reduce((sum, p) => {
      const key = `${p.source}-${p.name}`;
      let count = 0;
      for (const [id] of displayMembers) {
        if (solvedMatrix[id]?.has(key)) count++;
      }
      return sum + count;
    }, 0);
    const completionRate = totalProblems > 0 && totalMembers > 0
      ? ((totalSolved / (totalProblems * totalMembers)) * 100).toFixed(1)
      : '0.0';
    return { totalMembers, totalProblems, totalSolved, completionRate };
  }, [displayMembers, filteredProblems, solvedMatrix]);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">실험실</h1>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">새로운 기능을 미리 체험해보세요</p>
      </div>

      {/* 메인 탭 */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'leaderboard'
              ? 'bg-indigo-600 text-white'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
          }`}
        >
          <Trophy className="w-4 h-4" />
          리더보드
        </button>
        <button
          onClick={() => setActiveTab('matrix')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'matrix'
              ? 'bg-indigo-600 text-white'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
          }`}
        >
          <Grid3x3 className="w-4 h-4" />
          문제 현황
        </button>
      </div>

      {/* 리더보드 */}
      {activeTab === 'leaderboard' && (
        <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">리더보드</h2>
            <div className="flex gap-2">
              {boards.map((b) => {
                const Icon = b.icon;
                return (
                  <button
                    key={b.key}
                    onClick={() => setActiveBoard(b.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      activeBoard === b.key
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {b.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {currentRanking.map((r, i) => (
              <Link
                key={r.id}
                to={`/member/${r.id}`}
                className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                {/* 순위 */}
                <span className={`w-6 text-center font-bold text-sm ${
                  i < 3 && r.value > 0 ? medalColors[i] : 'text-slate-400 dark:text-slate-500'
                }`}>
                  {i + 1}
                </span>

                {/* 아바타 + 이름 */}
                <img
                  src={`https://github.com/${r.github}.png?size=32`}
                  alt={r.name}
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100 flex-1">
                  {r.name}
                </span>

                {/* 바 + 수치 */}
                <div className="flex items-center gap-3 w-40">
                  <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        i === 0 && r.value > 0 ? 'bg-yellow-500' :
                        i === 1 && r.value > 0 ? 'bg-slate-400' :
                        i === 2 && r.value > 0 ? 'bg-amber-700' :
                        'bg-indigo-500'
                      }`}
                      style={{ width: `${(r.value / maxValue) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 w-12 text-right">
                    {r.value}{currentUnit}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 문제 현황 매트릭스 */}
      {activeTab === 'matrix' && (
        <div className="space-y-4">
          {/* 통계 요약 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">전체 문제</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{matrixStats.totalProblems}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">전체 풀이</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{matrixStats.totalSolved}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">팀원 수</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{matrixStats.totalMembers}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">완료율</p>
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{matrixStats.completionRate}%</p>
            </div>
          </div>

          {/* 필터 */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 space-y-4">
            <div>
              <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">팀원</h3>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={selectAllMembers}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    selectedMembers.size === 0
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  전체
                </button>
                {sortedMemberEntries(members).map(([id, member]) => (
                  <button
                    key={id}
                    onClick={() => toggleMember(id)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      selectedMembers.has(id)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    {member.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">출처</h3>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setSourceFilter(null)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    sourceFilter === null
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  전체
                </button>
                <button
                  onClick={() => setSourceFilter('swea')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    sourceFilter === 'swea'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  SWEA
                </button>
                <button
                  onClick={() => setSourceFilter('boj')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    sourceFilter === 'boj'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  BOJ
                </button>
                <button
                  onClick={() => setSourceFilter('etc')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    sourceFilter === 'etc'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  기타
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">난이도</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-medium">
                  준비중
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setDifficultyFilter(null)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    difficultyFilter === null
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  전체
                </button>
                {difficulties.map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setDifficultyFilter(diff)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      difficultyFilter === diff
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 매트릭스 테이블 */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="sticky left-0 z-10 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700">
                      문제
                    </th>
                    {displayMembers.map(([id, member]) => (
                      <th
                        key={id}
                        className="px-3 py-3 text-center text-xs font-medium text-slate-700 dark:text-slate-300 min-w-[100px]"
                      >
                        <Link
                          to={`/member/${id}`}
                          className="flex flex-col items-center gap-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        >
                          <img
                            src={`https://github.com/${member.github}.png?size=32`}
                            alt={member.name}
                            className="w-8 h-8 rounded-full"
                          />
                          <span className="text-xs font-medium whitespace-nowrap">
                            {member.name}
                          </span>
                        </Link>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {filteredProblems.map((p) => {
                    const key = `${p.source}-${p.name}`;
                    return (
                      <tr key={key} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="sticky left-0 z-10 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 px-4 py-3 border-r border-slate-200 dark:border-slate-700">
                          <div className="flex items-center gap-3">
                            <span className={`text-xs px-2 py-0.5 rounded font-medium flex-shrink-0 ${
                              p.source === 'swea' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                              p.source === 'boj' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                              'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                            }`}>
                              {p.source.toUpperCase()}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                                {p.name}
                              </div>
                              <div className="text-[10px] text-slate-400 dark:text-slate-500">
                                {p.difficulty || '미정'}
                              </div>
                            </div>
                          </div>
                        </td>
                        {displayMembers.map(([id]) => {
                          const solved = solvedMatrix[id]?.has(key);
                          const problemBySolver = problems.find(
                            (prob) => prob.member === id && prob.source === p.source && prob.name === p.name
                          );
                          return (
                            <td
                              key={id}
                              className="px-3 py-3 text-center"
                            >
                              {solved && problemBySolver ? (
                                <Link
                                  to={`/problem/${id}/${problemBySolver.week}/${problemBySolver.name}`}
                                  className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                                >
                                  <Check className="w-4 h-4" />
                                </Link>
                              ) : (
                                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700/30">
                                  <span className="text-slate-300 dark:text-slate-600 text-xs">-</span>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {filteredProblems.length === 0 && (
            <div className="flex flex-col items-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="w-24 h-24">
                <DotLottieReact src="/cat.lottie" loop autoplay />
              </div>
              <p className="text-slate-500 dark:text-slate-400 mt-2">
                필터 조건에 맞는 문제가 없습니다.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
