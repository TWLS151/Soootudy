import { useState, useMemo } from 'react';
import { useParams, useOutletContext, Link } from 'react-router-dom';
import { Flame, MessageSquare, Calendar, Lock, Check, Settings, Star, ChevronDown } from 'lucide-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import FilterChips from '../components/FilterChips';
import ActivityHeatmap from '../components/ActivityHeatmap';
import { useCharacters } from '../hooks/useCharacters';
import { useCodeBookmarks } from '../hooks/useCodeBookmarks';
import { CHARACTERS, getCharacter } from '../lib/characters';
import { supabase } from '../lib/supabase';
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
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const { selectedCharacter, unlockedCharacters, loading: charLoading, selectCharacter } = useCharacters(id ?? null);
  const charDef = getCharacter(selectedCharacter);

  // 북마크 데이터
  const { bookmarks } = useCodeBookmarks(currentUserId);

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

  // 현재 로그인 유저 ID 가져오기
  useMemo(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (u) setCurrentUserId(u.id);
    });
  }, []);

  // 북마크된 문제들
  const bookmarkedProblems = useMemo(() => {
    if (!isOwner || bookmarks.length === 0) return [];
    const bookmarkIds = new Set(bookmarks.map(b => b.problem_id));
    return problems.filter(p => bookmarkIds.has(p.id));
  }, [bookmarks, problems, isOwner]);

  return (
    <div className="space-y-6">
      {/* 프로필 헤더 - 3단 레이아웃 */}
      <div className="grid grid-cols-[300px_1fr_300px] gap-8 items-start">
        {/* 왼쪽: 통계 정보 */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <img
              src={`https://github.com/${member.github}.png?size=128`}
              alt={member.name}
              className="w-16 h-16 rounded-full shrink-0"
            />
            <div>
              <a
                href={`https://github.com/${member.github}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                @{member.github}
              </a>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-slate-900 dark:text-slate-100 text-lg">{memberProblems.length}</span>
              <span className="ml-1">문제 해결</span>
            </div>
            {sourceStats.swea > 0 && (
              <div className="text-sm text-slate-600 dark:text-slate-400">
                <span className="font-semibold text-blue-600 dark:text-blue-400">{sourceStats.swea}</span>
                <span className="ml-1">SWEA</span>
              </div>
            )}
            {sourceStats.boj > 0 && (
              <div className="text-sm text-slate-600 dark:text-slate-400">
                <span className="font-semibold text-green-600 dark:text-green-400">{sourceStats.boj}</span>
                <span className="ml-1">BOJ</span>
              </div>
            )}
            {sourceStats.etc > 0 && (
              <div className="text-sm text-slate-600 dark:text-slate-400">
                <span className="font-semibold text-slate-600 dark:text-slate-400">{sourceStats.etc}</span>
                <span className="ml-1">기타</span>
              </div>
            )}
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
            {activities[id] && activities[id].streak > 0 && (
              <div className="flex items-center gap-2 text-orange-500 dark:text-orange-400">
                <Flame className="w-5 h-5" />
                <span className="text-sm font-semibold">{activities[id].streak}일 연속 출석</span>
              </div>
            )}
            {totalAttendance > 0 && (
              <div className="flex items-center gap-2 text-indigo-500 dark:text-indigo-400">
                <Calendar className="w-5 h-5" />
                <span className="text-sm font-semibold">{totalAttendance}일 누적 출석</span>
              </div>
            )}
          </div>

          <Link
            to={`/member/${id}/comments`}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors mt-2"
          >
            <MessageSquare className="w-4 h-4" />
            댓글 모아보기
          </Link>
        </div>

        {/* 중앙: 캐릭터 + 이름 */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-48 h-48">
              {!charLoading && (
                <DotLottieReact src={charDef.lottie} loop autoplay />
              )}
            </div>
            {isOwner && (
              <button
                onClick={() => setShowCharacterPicker((v) => !v)}
                className="absolute top-2 right-2 p-2 rounded-full bg-slate-100/80 dark:bg-slate-700/80 backdrop-blur-sm text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                title="캐릭터 설정"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{member.name}</h1>
        </div>

        {/* 오른쪽: 활동 히트맵 */}
        <div>
          {activities[id] && (
            <ActivityHeatmap dates={activities[id].dates} />
          )}
        </div>
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

      {/* 북마크한 코드 */}
      {isOwner && bookmarkedProblems.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <button
            onClick={() => setShowBookmarks(!showBookmarks)}
            className="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span className="font-medium text-slate-900 dark:text-slate-100">북마크한 코드</span>
              <span className="text-xs text-slate-400">({bookmarkedProblems.length})</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showBookmarks ? 'rotate-180' : ''}`} />
          </button>
          {showBookmarks && (
            <div className="border-t border-slate-100 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
              {bookmarkedProblems.map((p) => {
                const bookmarkInfo = bookmarks.find(b => b.problem_id === p.id);
                const bookmarkDate = bookmarkInfo ? new Date(bookmarkInfo.created_at) : null;
                const daysAgo = bookmarkDate
                  ? Math.floor((Date.now() - bookmarkDate.getTime()) / (1000 * 60 * 60 * 24))
                  : null;

                return (
                  <Link
                    key={p.id}
                    to={`/problem/${p.member}/${p.week}/${p.name}`}
                    className="flex items-start gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                          p.source === 'swea' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                          p.source === 'boj' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                          'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                        }`}>
                          {p.source.toUpperCase()}
                        </span>
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                          {p.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span>{members[p.member]?.name}</span>
                        <span>·</span>
                        <span>{p.week}</span>
                        {daysAgo !== null && (
                          <>
                            <span>·</span>
                            <span>{daysAgo === 0 ? '오늘' : `${daysAgo}일 전`} 북마크</span>
                          </>
                        )}
                      </div>
                      {bookmarkInfo?.memo && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                          💭 {bookmarkInfo.memo}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
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
