import { useState, useEffect, useMemo, useRef } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { X, ExternalLink, Sparkles, Upload, BookOpen, ChevronRight, Flame, Code2 } from 'lucide-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import MemberCard from '../components/MemberCard';
import StatsChart from '../components/StatsChart';
import SourceBadge from '../components/SourceBadge';
import DailyTaskTracker from '../components/DailyTaskTracker';
import { sortedMemberEntries, getProblemUrl } from '../services/github';
import { supabase } from '../lib/supabase';
import { getKSTToday } from '../lib/date';
import { useStudyConfig } from '../hooks/useStudyConfig';
import { useDailyProgress } from '../hooks/useDailyProgress';
import type { User } from '@supabase/supabase-js';
import confetti from 'canvas-confetti';
import type { Members, Problem, Activities, DailyProblem } from '../types';

const PIGEON_MESSAGES = [
  '오늘도 화이팅!',
  '한 문제라도 풀면 승리!',
  '꾸준함이 실력이다!',
  '알고리즘은 배신하지 않아!',
  '오늘의 커밋이 내일의 실력!',
  '코드 한 줄이 세상을 바꾼다!',
  '포기하면 거기서 끝이야!',
  '오늘 안 풀면 내일 두 문제!',
  '디버깅은 인생의 축소판',
  'AC 받으면 기분 최고!',
  '시간 초과? 다시 생각해보자!',
  '런타임 에러는 성장의 증거!',
  '어제의 나보다 한 문제 더!',
  '구구...열심히 하자구구!',
  '스터디원 모두 파이팅!',
  '코딩은 마라톤이야!',
  '풀이 수가 늘어나고 있어!',
  '오늘도 커밋 찍고 가자!',
  'WA는 AC의 어머니!',
  '반례를 찾으면 반은 푼 거야!',
  '점심 먹고 한 문제 어때?',
  '구현 문제? 차분하게!',
  'DP는 점화식만 찾으면 끝!',
  '그래프 탐색, 넌 할 수 있어!',
  '이분 탐색의 힘을 믿어!',
  '그리디하게 살자!',
  '스택/큐는 기본 중의 기본!',
  '재귀의 끝에 답이 있다!',
  '배열 인덱스 조심!',
  'Off-by-one은 누구나 실수해!',
  '코드 리뷰는 서로의 성장!',
  '댓글 달아주면 힘이 돼!',
  '같이 풀면 더 재밌어!',
  '수우터디 최고!',
  '오늘 제출 했어? 구구?',
  '커피 한 잔, 코드 한 줄!',
  '집중! 집중! 집중!',
  '느려도 괜찮아, 멈추지만 마!',
  '에러 메시지를 잘 읽어봐!',
  '테스트 케이스를 믿지 마!',
];

const CELEBRATION_MESSAGES = [
  '오늘도 해냈다!',
  '역시 프로...',
  '퇴근 가능!',
  '내일 또 보자~',
  '완벽한 하루!',
  '열정 그 자체!',
  'AC 인생 AC!',
  '오늘의 미션 클리어!',
  '이 정도면 알고리즘 마스터!',
  '꾸준함이 빛나는 순간!',
  '수우터디 에이스!',
  '오늘도 성장 완료!',
  '칼퇴 준비 완료!',
  '커밋하고 쉬자!',
  '대단해, 진짜!',
  '이게 바로 실력이야!',
  '풀이 + 댓글 = 완벽!',
  '오늘 할 일 끝! 야호!',
  '스터디원의 모범!',
  '내일의 나에게 박수!',
];

interface Context {
  members: Members;
  problems: Problem[];
  activities: Activities;
  dark: boolean;
  user: User;
}

export default function HomePage() {
  const { members, problems, activities, user } = useOutletContext<Context>();

  // 현재 유저 정보 해석
  const githubUsername = user?.user_metadata?.user_name || user?.user_metadata?.preferred_username;
  const currentMemberId = useMemo(() => {
    if (!githubUsername) return null;
    for (const [id, member] of Object.entries(members)) {
      if (member.github.toLowerCase() === githubUsername.toLowerCase()) return id;
    }
    return null;
  }, [members, githubUsername]);

  // 개인 통계
  const myProblemCount = useMemo(
    () => (currentMemberId ? problems.filter((p) => p.member === currentMemberId).length : 0),
    [problems, currentMemberId]
  );
  const myStreak = currentMemberId ? (activities[currentMemberId]?.streak ?? 0) : 0;
  const [pigeonMessage] = useState(() => PIGEON_MESSAGES[Math.floor(Math.random() * PIGEON_MESSAGES.length)]);

  // 일일 진행 상황
  const { config } = useStudyConfig();
  const { commentCount, loading: progressLoading } = useDailyProgress(githubUsername, currentMemberId);
  const [bannerClosed, setBannerClosed] = useState(() => {
    return sessionStorage.getItem('betaBannerClosed') === 'true';
  });

  const [dailyProblems, setDailyProblems] = useState<DailyProblem[]>([]);
  const [pastProblems, setPastProblems] = useState<DailyProblem[]>([]);
  const [loadingDaily, setLoadingDaily] = useState(true);

  const requiredComments = config?.required_comments ?? 3;
  const requiredSubmissions = config?.required_submissions ?? 1;

  // 일일 과제 완료 판정
  const allComplete = useMemo(() => {
    if (!currentMemberId || loadingDaily || progressLoading || dailyProblems.length === 0) return false;
    const submittedCount = dailyProblems.filter((dp) => {
      const name = `${dp.source}-${dp.problem_number}`;
      return problems.some((p) => p.member === currentMemberId && (p.baseName || p.name) === name);
    }).length;
    const submissionsOk = submittedCount >= Math.min(requiredSubmissions, dailyProblems.length);
    return submissionsOk && commentCount >= requiredComments;
  }, [currentMemberId, dailyProblems, problems, commentCount, requiredComments, requiredSubmissions, loadingDaily, progressLoading]);

  // 축하 메시지 (랜덤)
  const [celebrationMessage] = useState(
    () => CELEBRATION_MESSAGES[Math.floor(Math.random() * CELEBRATION_MESSAGES.length)]
  );

  // 축하 연출 (세션당 1회)
  const celebrationFired = useRef(false);
  useEffect(() => {
    if (!allComplete || celebrationFired.current) return;
    const key = `celebration_${getKSTToday()}`;
    if (sessionStorage.getItem(key)) return;

    celebrationFired.current = true;
    sessionStorage.setItem(key, 'true');

    const duration = 2500;
    const end = Date.now() + duration;
    const frame = () => {
      confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#6366f1', '#10b981', '#f59e0b'] });
      confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#6366f1', '#10b981', '#f59e0b'] });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, [allComplete]);

  const recentProblems = problems.slice(0, 8);

  const closeBanner = () => {
    setBannerClosed(true);
    sessionStorage.setItem('betaBannerClosed', 'true');
  };

  // 오늘의 문제 + 이전 문제 불러오기
  useEffect(() => {
    loadDailyProblems();
    loadPastProblems();

    // 실시간 구독
    const today = getKSTToday();
    const subscription = supabase
      .channel(`daily_problems:${today}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_problem',
          filter: `date=eq.${today}`,
        },
        () => {
          loadDailyProblems();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function loadDailyProblems() {
    try {
      const today = getKSTToday();
      const { data, error } = await supabase
        .from('daily_problem')
        .select('*')
        .eq('date', today)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setDailyProblems(data || []);
    } catch (error) {
      console.error('Failed to load daily problems:', error);
    } finally {
      setLoadingDaily(false);
    }
  }

  async function loadPastProblems() {
    try {
      const today = getKSTToday();

      // 어제 날짜 계산
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // 어제 문제 조회
      const { data: yesterdayData, error: yesterdayError } = await supabase
        .from('daily_problem')
        .select('*')
        .eq('date', yesterdayStr)
        .order('created_at', { ascending: true });

      if (yesterdayError) throw yesterdayError;

      // 어제 문제가 있으면 그것 사용
      if (yesterdayData && yesterdayData.length > 0) {
        setPastProblems(yesterdayData);
        return;
      }

      // 어제 문제가 없으면 가장 최근 날짜의 문제 조회
      const { data: allPast, error: allError } = await supabase
        .from('daily_problem')
        .select('*')
        .lt('date', today)
        .order('date', { ascending: false })
        .order('created_at', { ascending: true });

      if (allError) throw allError;

      if (allPast && allPast.length > 0) {
        // 가장 최근 날짜 찾기
        const mostRecentDate = allPast[0].date;
        // 그 날짜의 문제만 필터링
        const recentDayProblems = allPast.filter(p => p.date === mostRecentDate);
        setPastProblems(recentDayProblems);
      } else {
        setPastProblems([]);
      }
    } catch (error) {
      console.error('Failed to load past problems:', error);
    }
  }

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
        {/* 말풍선 + 피전 */}
        <div className="relative w-48 mx-auto mb-2">
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full whitespace-nowrap px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{allComplete ? celebrationMessage : pigeonMessage}</p>
            {/* 말풍선 꼬리 */}
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 rotate-45 bg-white dark:bg-slate-800 border-r border-b border-slate-200 dark:border-slate-700" />
          </div>
          <div className="w-48 h-48">
            <DotLottieReact src="/pigeon.lottie" loop autoplay />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Soootudy</h1>
        <p className="text-slate-500 dark:text-slate-400">SSAFY 15기 서울 1반 알고리즘 스터디</p>

        {/* 통계 */}
        <div className="flex justify-center gap-5 mt-4 text-sm">
          <span className="text-slate-600 dark:text-slate-300">
            <strong className="text-indigo-600 dark:text-indigo-400">{Object.keys(members).length}</strong> 팀원
          </span>
          <span className="text-slate-600 dark:text-slate-300">
            <strong className="text-indigo-600 dark:text-indigo-400">{problems.length}</strong> 풀이
          </span>
          {currentMemberId && (
            <>
              <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                <Code2 className="w-3.5 h-3.5 text-indigo-500" />
                <strong className="text-indigo-600 dark:text-indigo-400">{myProblemCount}</strong> 내 풀이
              </span>
              {myStreak > 0 && (
                <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                  <strong className="text-orange-500 dark:text-orange-400">{myStreak}일</strong> 연속
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* 오늘의 할 일 (컴팩트 바) */}
      {!loadingDaily && dailyProblems.length > 0 && (
        <DailyTaskTracker
          dailyProblems={dailyProblems}
          problems={problems}
          currentMemberId={currentMemberId}
          commentCount={commentCount}
          requiredComments={requiredComments}
          requiredSubmissions={requiredSubmissions}
          loading={loadingDaily || progressLoading}
        />
      )}

      {/* 문제 섹션 (오늘 + 이전 통합) */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">문제</h2>
          </div>
          <Link
            to="/daily-history"
            className="inline-flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            전체 보기
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* 오늘의 문제 (그라데이션 강조) */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wide">오늘</h3>
            </div>

            {loadingDaily ? (
              <div className="flex flex-col items-center justify-center py-4">
                <div className="w-16 h-16">
                  <DotLottieReact src="/cat.lottie" loop autoplay />
                </div>
              </div>
            ) : dailyProblems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-4">
                <div className="w-20 h-20">
                  <DotLottieReact src="/cat.lottie" loop autoplay />
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                  오늘의 문제가 아직 등록되지 않았습니다.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {dailyProblems.map((problem) => {
                  const problemUrl = problem.problem_url || getProblemUrl(problem.problem_number, problem.source);
                  // etc 문제의 경우 공백을 언더스코어로 치환하여 매칭
                  const problemNumber = problem.source === 'etc' ? problem.problem_number.replace(/ /g, '_') : problem.problem_number;
                  const problemName = `${problem.source}-${problemNumber}`;
                  const solvers = problems.filter((p) => (p.baseName || p.name) === problemName);
                  return (
                    <div
                      key={problem.id}
                      className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <SourceBadge source={problem.source} />
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 truncate">
                              {problem.problem_title}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {problem.source.toUpperCase()} {problem.problem_number}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {problemUrl && (
                            <a
                              href={problemUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors"
                            >
                              문제 보기
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <Link
                            to={`/submit?source=${problem.source}&number=${problem.problem_number}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            제출
                          </Link>
                        </div>
                      </div>

                      {/* 제출한 팀원 */}
                      {solvers.length > 0 && (
                        <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-700">
                          <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">제출:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {solvers.map((sol) => {
                              const solMember = members[sol.member];
                              if (!solMember) return null;
                              return (
                                <Link
                                  key={sol.id}
                                  to={`/problem/${sol.member}/${sol.week}/${sol.name}`}
                                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-50 dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                                  title={`${solMember.name} (${sol.week})`}
                                >
                                  <img
                                    src={`https://github.com/${solMember.github}.png?size=20`}
                                    alt={solMember.name}
                                    className="w-4 h-4 rounded-full"
                                  />
                                  <span className="text-xs text-slate-700 dark:text-slate-300">{solMember.name}</span>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 이전 문제들 */}
          {pastProblems.length > 0 && (
            <div className="p-5 border-t border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">이전</h3>
              <div className="space-y-2">
                {pastProblems.map((problem) => {
                  const problemUrl = problem.problem_url || getProblemUrl(problem.problem_number, problem.source);
                  // etc 문제의 경우 공백을 언더스코어로 치환하여 매칭
                  const problemNumber = problem.source === 'etc' ? problem.problem_number.replace(/ /g, '_') : problem.problem_number;
                  const problemName = `${problem.source}-${problemNumber}`;
                  const solvers = problems.filter((p) => (p.baseName || p.name) === problemName);
                  const dateLabel = new Date(problem.date + 'T00:00:00').toLocaleDateString('ko-KR', {
                    month: 'short',
                    day: 'numeric',
                  });

                  return (
                    <div
                      key={problem.id}
                      className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 space-y-2"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400 dark:text-slate-500 w-12 shrink-0">
                          {dateLabel}
                        </span>
                        <SourceBadge source={problem.source} />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-slate-900 dark:text-slate-100 font-medium truncate block">
                            {problem.problem_title}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {problemUrl && (
                            <a
                              href={problemUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              문제 보기
                            </a>
                          )}
                          <Link
                            to={`/submit?source=${problem.source}&number=${problem.problem_number}`}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/30 rounded-lg transition-colors"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            제출
                          </Link>
                        </div>
                      </div>

                      {/* 제출한 팀원 (아바타+이름 스타일) */}
                      {solvers.length > 0 && (
                        <div className="flex items-center gap-2 pl-12">
                          <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">제출:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {solvers.map((sol) => {
                              const solMember = members[sol.member];
                              if (!solMember) return null;
                              return (
                                <Link
                                  key={sol.id}
                                  to={`/problem/${sol.member}/${sol.week}/${sol.name}`}
                                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                                  title={`${solMember.name} (${sol.week})`}
                                >
                                  <img
                                    src={`https://github.com/${solMember.github}.png?size=20`}
                                    alt={solMember.name}
                                    className="w-4 h-4 rounded-full"
                                  />
                                  <span className="text-xs text-slate-700 dark:text-slate-300">{solMember.name}</span>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

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
              completed={id === currentMemberId && allComplete}
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
