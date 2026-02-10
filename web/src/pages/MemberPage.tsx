import { useState, useMemo } from 'react';
import { useParams, useOutletContext, Link } from 'react-router-dom';
import { Flame, MessageSquare, Calendar, Lock, Check } from 'lucide-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import FilterChips from '../components/FilterChips';
import ActivityHeatmap from '../components/ActivityHeatmap';
import { useCharacters } from '../hooks/useCharacters';
import { CHARACTERS, getCharacter } from '../lib/characters';
import type { User } from '@supabase/supabase-js';
import type { Members, Problem, Activities } from '../types';

interface Context {
  members: Members;
  problems: Problem[];
  activities: Activities;
  dark: boolean;
  user: User;
}

export default function MemberPage() {
  const { id } = useParams<{ id: string }>();
  const { members, problems, activities, user } = useOutletContext<Context>();
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const [openWeeks, setOpenWeeks] = useState<Set<string>>(new Set());
  const [showCharacterPicker, setShowCharacterPicker] = useState(false);

  const { selectedCharacter, unlockedCharacters, loading: charLoading, selectCharacter } = useCharacters(id ?? null);
  const charDef = getCharacter(selectedCharacter);

  const githubUsername = user?.user_metadata?.user_name || user?.user_metadata?.preferred_username;
  const isOwner = useMemo(() => {
    if (!githubUsername || !id) return false;
    return members[id]?.github.toLowerCase() === githubUsername?.toLowerCase();
  }, [members, id, githubUsername]);

  const member = id ? members[id] : undefined;
  if (!member || !id) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-28 h-28">
          <DotLottieReact src="/cat.lottie" loop autoplay />
        </div>
        <p className="text-slate-500 dark:text-slate-400 mt-2">팀원을 찾을 수 없습니다.</p>
      </div>
    );
  }

  const memberProblems = problems.filter((p) => p.member === id);
  const filtered = sourceFilter
    ? memberProblems.filter((p) => p.source === sourceFilter)
    : memberProblems;

  // 주차별 그룹핑
  const weekGroups = new Map<string, Problem[]>();
  for (const p of filtered) {
    const group = weekGroups.get(p.week) || [];
    group.push(p);
    weekGroups.set(p.week, group);
  }
  const sortedWeeks = Array.from(weekGroups.keys()).sort((a, b) => b.localeCompare(a));

  const toggleWeek = (week: string) => {
    setOpenWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(week)) next.delete(week);
      else next.add(week);
      return next;
    });
  };

  // 출처별 통계
  const sourceStats = {
    swea: memberProblems.filter((p) => p.source === 'swea').length,
    boj: memberProblems.filter((p) => p.source === 'boj').length,
    etc: memberProblems.filter((p) => p.source === 'etc').length,
  };

  // 2/5 이후 누적 출석일수 계산
  const totalAttendance = useMemo(() => {
    if (!id || !activities[id]) return 0;
    const startDate = new Date('2026-02-05T00:00:00+09:00');
    return activities[id].dates.filter(date => {
      const d = new Date(date + 'T00:00:00+09:00');
      return d >= startDate;
    }).length;
  }, [id, activities]);

  return (
    <div className="space-y-6">
      {/* 프로필 헤더 */}
      <div className="flex items-start justify-between gap-5">
        <div className="flex items-center gap-5">
          {/* 캐릭터 */}
          <div className="relative shrink-0">
            <div className="w-20 h-20">
              {!charLoading && (
                <DotLottieReact src={charDef.lottie} loop autoplay />
              )}
            </div>
            {isOwner && (
              <button
                onClick={() => setShowCharacterPicker((v) => !v)}
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors whitespace-nowrap"
              >
                변경
              </button>
            )}
          </div>
          <img
            src={`https://github.com/${member.github}.png?size=128`}
            alt={member.name}
            className="w-12 h-12 rounded-full shrink-0"
          />
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{member.name}</h1>
            <a
              href={`https://github.com/${member.github}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              @{member.github}
            </a>
            <div className="flex gap-4 mt-1 text-xs text-slate-500 dark:text-slate-400">
              <span>총 {memberProblems.length}문제</span>
              {sourceStats.swea > 0 && <span>SWEA {sourceStats.swea}</span>}
              {sourceStats.boj > 0 && <span>BOJ {sourceStats.boj}</span>}
              {sourceStats.etc > 0 && <span>기타 {sourceStats.etc}</span>}
            </div>
            <div className="flex items-center gap-3 mt-1">
              {activities[id] && activities[id].streak > 0 && (
                <div className="flex items-center gap-1 text-orange-500 dark:text-orange-400">
                  <Flame className="w-4 h-4" />
                  <span className="text-sm font-semibold">{activities[id].streak}일 연속</span>
                </div>
              )}
              {totalAttendance > 0 && (
                <div className="flex items-center gap-1 text-indigo-500 dark:text-indigo-400">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm font-semibold">{totalAttendance}일 출석</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <Link
          to={`/member/${id}/comments`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          댓글 모아보기
        </Link>
      </div>

      {/* 캐릭터 선택 */}
      {isOwner && showCharacterPicker && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">캐릭터 선택</p>
          <div className="grid grid-cols-4 gap-3">
            {CHARACTERS.map((c) => {
              const unlocked = unlockedCharacters.includes(c.id);
              const selected = selectedCharacter === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => unlocked && selectCharacter(c.id)}
                  disabled={!unlocked}
                  className={`relative flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                    selected
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
                      : unlocked
                        ? 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600'
                        : 'border-slate-100 dark:border-slate-800 opacity-50'
                  }`}
                >
                  <div className={`w-14 h-14 ${!unlocked ? 'grayscale' : ''}`}>
                    <DotLottieReact src={c.lottie} loop autoplay />
                  </div>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{c.name}</span>
                  {!unlocked && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-white/60 dark:bg-slate-900/60">
                      <Lock className="w-4 h-4 text-slate-400" />
                      <span className="text-[10px] text-slate-400 mt-0.5">{c.description}</span>
                    </div>
                  )}
                  {selected && (
                    <div className="absolute top-1 right-1">
                      <Check className="w-4 h-4 text-indigo-500" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 활동 히트맵 */}
      {activities[id] && (
        <ActivityHeatmap dates={activities[id].dates} />
      )}

      {/* 필터 */}
      <FilterChips active={sourceFilter} onChange={setSourceFilter} />

      {/* 주차별 아코디언 */}
      {sortedWeeks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10">
          <div className="w-24 h-24">
            <DotLottieReact src="/cat.lottie" loop autoplay />
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">풀이가 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedWeeks.map((week) => {
            const isOpen = openWeeks.has(week);
            const weekProblems = weekGroups.get(week)!;
            return (
              <div key={week} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <button
                  onClick={() => toggleWeek(week)}
                  className="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <span className="font-medium text-slate-900 dark:text-slate-100">{week}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{weekProblems.length}문제</span>
                    <svg
                      className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                {isOpen && (
                  <div className="border-t border-slate-100 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
                    {weekProblems.map((p) => (
                      <Link
                        key={p.id}
                        to={`/problem/${p.member}/${p.week}/${p.name}`}
                        className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                          p.source === 'swea' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                          p.source === 'boj' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                          'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                        }`}>
                          {p.source.toUpperCase()}
                        </span>
                        <span className="text-sm text-slate-900 dark:text-slate-100">{p.name}</span>
                        {p.hasNote && (
                          <span className="text-xs text-indigo-500 dark:text-indigo-400">노트</span>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
